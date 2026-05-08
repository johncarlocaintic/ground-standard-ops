/**
 * Audit current state of the Vacaville launch bot AND export the latest KDL
 * to see Bobby's UI edits (especially n30_book calendar IDs).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BOT = 'bot_J56AWZ5TYQI9HKJS';

async function req(method, ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  console.log(`=== Audit ${BOT} ===\n`);

  const det = await req('GET', `/bot/${BOT}`);
  console.log(`GET /bot/${BOT} → ${det.status}`);
  if (det.ok) {
    const b = det.json;
    console.log(`  name:         ${b.name}`);
    console.log(`  modifiedAt:   ${b.modifiedAt}`);
    console.log(`  modifiedBy:   ${b.modifiedBy}`);
    console.log(`  versions:     ${(b.versions || []).length}`);
    if ((b.versions || []).length) {
      const last = (b.versions || []).slice(-3);
      console.log(`  last 3 vers:`);
      for (const v of last) console.log(`    ${v.version} pub=${v.published} ${v.modifiedAt} by ${v.modifiedBy}`);
    }
    console.log(`  personaIds:   ${JSON.stringify(b.personaIds)}`);
    console.log(`  tools:        ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
    console.log(`  sources:`);
    for (const s of (b.sources || [])) {
      console.log(`    ${s.name}(${s.id}) channels=[${(s.channelList || []).join(', ')}]`);
      console.log(`      tags (${(s.tags || []).length}):`);
      for (const t of (s.tags || [])) {
        console.log(`        ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}  id=${t.id}`);
      }
    }
  }

  // Export current KDL
  console.log(`\nGET /bot/${BOT}/export →`);
  const exp = await req('GET', `/bot/${BOT}/export`);
  console.log(`  ${exp.status}`);
  if (exp.ok && exp.json.kdl) {
    const out = path.join(REPO_ROOT, 'shared/logs/launch_kdl_after_bobby_edit.kdl');
    fs.writeFileSync(out, exp.json.kdl);
    console.log(`  KDL: ${exp.json.kdl.length} chars → ${out}`);
  }
})();
