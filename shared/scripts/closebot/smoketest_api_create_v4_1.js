/**
 * Smoke test for the 2026-04-25 importKdl / Agent Node silent-fail bug.
 *
 * Plan:
 *   1. Export KDL from bot_J56AWZ5TYQI9HKJS (launch source-of-truth)
 *   2. POST /bot { name, importKdl } → new bot
 *   3. Publish
 *   4. Pull detail, sanity check
 *   5. Open a test session WITHOUT mimicSourceId (sandbox-safe), send one
 *      message, check whether the bot replies within 60s.
 *      If it replies → silent-fail bug is RESOLVED → safe to API-duplicate launch bot.
 *      If it 60s timeouts → bug is STILL LIVE → fall back to rename strategy.
 *
 * Side effects:
 *   - Creates one throwaway bot (we'll delete it at end via API)
 *   - Logs everything to shared/logs/smoketest_api_create.log
 *   - Saves the exported KDL to shared/logs/launch_kdl.kdl for re-use
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const logDir = path.join(REPO_ROOT, 'shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'smoketest_api_create.log');
fs.writeFileSync(LOG, '');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
if (!KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const SOURCE_BOT = 'bot_J56AWZ5TYQI9HKJS'; // launch source-of-truth

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function main() {
  log('=== STEP 1: Export KDL from launch source-of-truth ===');
  const exp = await req('GET', `/bot/${SOURCE_BOT}/export`);
  log(`  GET /bot/${SOURCE_BOT}/export → ${exp.status}`);
  if (!exp.ok || !exp.json.kdl) {
    log(`  FATAL: export failed: ${JSON.stringify(exp.json).slice(0, 400)}`);
    process.exit(1);
  }
  const kdl = exp.json.kdl;
  const kdlPath = path.join(logDir, 'launch_kdl.kdl');
  fs.writeFileSync(kdlPath, kdl);
  log(`  exported KDL: ${kdl.length} chars → ${kdlPath}`);
  log('');

  log('=== STEP 2: Create new bot via importKdl ===');
  const newName = `SMOKETEST api-create-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const create = await req('POST', '/bot', { name: newName, importKdl: kdl });
  log(`  POST /bot → ${create.status}`);
  if (!create.ok) {
    log(`  FATAL: create failed: ${JSON.stringify(create.json).slice(0, 400)}`);
    process.exit(1);
  }
  const newBotId = create.json.id || create.json.bot?.id;
  log(`  new bot id: ${newBotId}`);
  log(`  new bot name: ${newName}`);
  log('');

  log('=== STEP 3: Publish ===');
  const pub = await req('POST', `/bot/${newBotId}/publish`, {});
  log(`  POST /bot/${newBotId}/publish → ${pub.status}`);
  if (!pub.ok) log(`  WARN publish: ${JSON.stringify(pub.json).slice(0, 300)}`);
  log('');

  log('=== STEP 4: Pull detail ===');
  const det = await req('GET', `/bot/${newBotId}`);
  log(`  GET /bot/${newBotId} → ${det.status}`);
  if (det.ok) {
    const b = det.json;
    log(`  name: ${b.name}`);
    log(`  versions: ${(b.versions || []).length}`);
    log(`  latest version published: ${(b.versions || [])[b.versions.length - 1]?.published}`);
    log(`  personaIds: ${JSON.stringify(b.personaIds)}`);
    log(`  sources: ${(b.sources || []).map(s => s.id).join(',') || 'none'}`);
    log(`  tools: ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
  }
  log('');

  log('=== STEP 5: Smoke-test responsiveness via test session (no mimic) ===');
  // Create test session (empty body — no mimic, sandbox-safe)
  const sess = await req('POST', `/bot/${newBotId}/testSession`, {});
  log(`  POST /bot/${newBotId}/testSession → ${sess.status}`);
  if (!sess.ok) {
    log(`  FAIL session: ${JSON.stringify(sess.json).slice(0, 300)}`);
    log('  → cannot determine bug status from session creation alone');
  } else {
    const leadId = sess.json.leadId || sess.json.id;
    log(`  leadId: ${leadId}`);

    // Open SSE stream
    log(`  opening SSE stream...`);
    const sseRes = await fetch(`${BASE}/bot/${newBotId}/testSession/messages/${leadId}`, {
      headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
    });
    log(`  SSE status: ${sseRes.status}`);

    if (!sseRes.ok) {
      log('  FAIL: SSE stream did not open');
    } else {
      // Wait briefly so SSE handshake settles
      await new Promise(r => setTimeout(r, 600));

      // Send opener
      log(`  sending opener: "Hi"`);
      const send = await req('POST', `/bot/${newBotId}/testSession/message`, { leadId, message: 'Hi' });
      log(`  send → ${send.status}`);

      // Read stream for up to 60s, looking for first bot reply
      const reader = sseRes.body.getReader();
      const dec = new TextDecoder();
      const start = Date.now();
      const timeout = 60_000;
      let buf = '';
      let firstBotMsg = null;
      let events = [];

      while (Date.now() - start < timeout) {
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise(r => setTimeout(() => r({ done: false, value: null }), 1500)),
        ]);
        if (done) break;
        if (!value) continue;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          try {
            const evt = JSON.parse(data);
            events.push(evt);
            if (evt.message && evt.sender !== 'lead') {
              firstBotMsg = evt.message;
              break;
            }
          } catch {}
        }
        if (firstBotMsg) break;
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      log(`  events received: ${events.length}`);
      log(`  elapsed: ${elapsed}s`);
      if (firstBotMsg) {
        log(`  ✅ BOT REPLIED: "${firstBotMsg.slice(0, 120)}"`);
        log('  → API bot-creation bug appears RESOLVED (new bot responds)');
      } else {
        log(`  ❌ BOT DID NOT REPLY in ${timeout / 1000}s`);
        log('  → API bot-creation silent-fail bug LIKELY STILL LIVE');
      }
      try { reader.releaseLock(); } catch {}
    }
  }
  log('');

  log('=== STEP 6: Cleanup — delete throwaway bot ===');
  const del = await req('DELETE', `/bot/${newBotId}`);
  log(`  DELETE /bot/${newBotId} → ${del.status}`);
  if (!del.ok) log(`  WARN delete failed: ${JSON.stringify(del.json).slice(0, 200)} — manual cleanup needed`);
  log('');

  log('=== DONE ===');
  log(`  smoketest bot id: ${newBotId} (${del.ok ? 'deleted' : 'NOT deleted — clean up manually'})`);
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
