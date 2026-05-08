/**
 * Attach Emma persona + enable SmartFAQ on the launch bot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/attach_persona_smartfaq.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const LAUNCH_BOT  = 'bot_SJNN1QEOEJUUU2MH';
const EMMA = 'pers_CB1LLPENDKDRB5S2';

async function req(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function main() {
  // 1. Persona via PUT
  log('[1] Attach Emma persona via PUT');
  const p = await req('PUT', `/bot/${LAUNCH_BOT}`, { personaIds: [EMMA] });
  log(`    PUT /bot/${LAUNCH_BOT} → ${p.status}`);
  if (!p.ok) log(`    body: ${p.raw.slice(0, 300)}`);

  // 2. SmartFAQ tool
  log('[2] Enable SmartFAQ');
  const tool = await req('POST', `/bot/${LAUNCH_BOT}/tool`, {
    type: 'SmartFAQ',
    enabled: true,
    options: { $type: 'smart_faq' },
  });
  log(`    POST tool → ${tool.status}`);
  if (!tool.ok) log(`    body: ${tool.raw.slice(0, 300)}`);

  // 3. Verify
  log('[3] Verify');
  const det = await req('GET', `/bot/${LAUNCH_BOT}`);
  if (det.ok) {
    const b = det.json;
    log(`    personaIds: ${JSON.stringify(b.personaIds)}`);
    log(`    tools:      ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
    log(`    sources:    ${(b.sources || []).map(s => `${s.name} tags=${(s.tags || []).length}`).join(', ')}`);
  }
}

main().catch(e => log(`FATAL: ${e.message}`));
