/**
 * Two-phase smoke test:
 *   Phase A: minimal Method-only KDL → confirms endpoint health
 *   Phase B: retry full v4.1 export, 3x with backoff
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/smoketest_minimal_then_full.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

const minimalKdl = `__CONFIG__ {
    conversationReason "test"
    businessInformation "test"
    prohibitedWords
}
Source id="src" {
    Next handle="n10"
}
Method id="n10" {
    EnableSmartFaq false
    Sections {
        _ {
            Title "Test"
            Body "Just say hi back."
        }
    }
    Instructions "Just say hi back."
    EnableThinking false
    Title "Test"
    Next handle="EOC"
}`;

async function main() {
  // Phase A
  log('=== PHASE A: minimal KDL ===');
  const minName = `smoketest-minimal-${Date.now()}`;
  const a = await req('POST', '/bot', { name: minName, importKdl: minimalKdl });
  log(`  POST /bot (minimal) → ${a.status}`);
  if (a.ok) {
    const id = a.json.id || a.json.bot?.id;
    log(`  ✅ minimal create works → ${id}`);
    // delete it
    const d = await req('DELETE', `/bot/${id}`);
    log(`  delete → ${d.status}`);
  } else {
    log(`  ❌ minimal failed: status=${a.status}, raw="${a.raw.slice(0, 200)}"`);
    log('  → endpoint is unhealthy regardless of KDL content');
    return;
  }
  log('');

  // Phase B: retry full v4.1 KDL
  log('=== PHASE B: full v4.1 KDL (3 retries) ===');
  const fullKdl = fs.readFileSync(path.join(REPO_ROOT, 'shared/logs/launch_kdl.kdl'), 'utf8');
  log(`  KDL length: ${fullKdl.length} chars`);

  for (let i = 1; i <= 3; i++) {
    log(`\n  --- attempt ${i}/3 ---`);
    const name = `smoketest-full-v4_1-attempt${i}-${Date.now()}`;
    const r = await req('POST', '/bot', { name, importKdl: fullKdl });
    log(`  POST /bot → ${r.status}`);
    if (r.ok) {
      const id = r.json.id || r.json.bot?.id;
      log(`  ✅ full create works → ${id}`);
      const pub = await req('POST', `/bot/${id}/publish`, {});
      log(`  publish → ${pub.status}`);
      log(`  CREATED bot id (left in place for further inspection): ${id}`);
      log('  → API DUPLICATION FLOW IS HEALTHY for this KDL');
      return;
    } else {
      log(`  ❌ status=${r.status}, raw="${r.raw.slice(0, 300)}"`);
    }
    if (i < 3) await new Promise(r => setTimeout(r, 2000 * i));
  }
  log('');
  log('  → API DUPLICATION FAILS after 3 attempts — fall back to rename strategy');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
