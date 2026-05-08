/**
 * Persona audit for v3.16 pre-flight.
 * Goal: confirm shared persona's "How to Respond" contains no Vacaville-specific
 * cruft before we trim conversationReason. If Vacaville content is there, a
 * tight new conversationReason could be silently contradicted by persona state.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_persona_audit.log');
fs.mkdirSync(logDir, { recursive: true });

const V315_BOT = 'bot_T7VCBNV3YCYMI8JP';

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY') } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 800) } }; }
}

async function main() {
  log('=== PERSONA AUDIT — pre-v3.16 ===');

  // Step 1: Get v3.15 bot detail — find personaId
  log('--- GET bot detail ---');
  const b = await api(`/bot/${V315_BOT}`);
  log(`  status=${b.status}`);
  if (!b.ok) { log('FATAL: ' + JSON.stringify(b.json).slice(0, 400)); process.exit(1); }
  fs.writeFileSync(path.join(logDir, 'gs_persona_audit_bot.json'), JSON.stringify(b.json, null, 2));
  const personaId = b.json.personaId || b.json.persona?.id || b.json.persona_id;
  log(`  personaId: ${personaId || '(not on bot root — checking nested)'}`);
  log(`  bot keys: ${Object.keys(b.json).join(', ')}`);

  // Step 2: List all personas (in case persona is not embedded on bot)
  log('--- GET /persona (list) ---');
  const ps = await api('/persona');
  log(`  status=${ps.status}`);
  if (ps.ok) {
    fs.writeFileSync(path.join(logDir, 'gs_persona_audit_list.json'), JSON.stringify(ps.json, null, 2));
    const arr = ps.json.personas || ps.json.data || ps.json;
    if (Array.isArray(arr)) {
      log(`  ${arr.length} personas found:`);
      for (const p of arr) log(`    ${p.id || p._id} — "${p.name}"`);
    } else {
      log('  (non-array response — see gs_persona_audit_list.json)');
    }
  }

  // Step 3: If personaId known, fetch it
  if (personaId) {
    log('--- GET /persona/{id} ---');
    const p = await api(`/persona/${personaId}`);
    log(`  status=${p.status}`);
    if (p.ok) {
      fs.writeFileSync(path.join(logDir, 'gs_persona_audit_detail.json'), JSON.stringify(p.json, null, 2));
      log(`  name: ${p.json.name}`);
      log(`  howToRespond (first 2000 chars):`);
      const htr = p.json.howToRespond || p.json.how_to_respond || p.json.HowToRespond || '(field not found)';
      log(`    ${String(htr).slice(0, 2000)}`);
      log('');
      // Vacaville contamination check
      const h = String(htr).toLowerCase();
      const flags = ['vacaville', 'grappling', 'bjj', 'coach nick', 'no-gi', 'no gi', 'kids 7', 'kids 3', 'saturday', 'apex'];
      const hits = flags.filter(f => h.includes(f));
      if (hits.length) log(`  ⚠️  Vacaville-specific markers found: ${hits.join(', ')}`);
      else log('  ✓ No Vacaville-specific markers detected in howToRespond');
    }
  }

  log('=== DONE ===');
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
