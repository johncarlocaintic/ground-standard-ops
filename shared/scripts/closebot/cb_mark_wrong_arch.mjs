/**
 * cb_mark_wrong_arch.mjs — Phase 5 rename-for-deletion of wrong-architecture
 * (classic) GS bots. Never deletes; just renames with the [WRONG-ARCH DELETE]
 * prefix so Bobby can sweep them from the CloseBot UI when convenient.
 *
 * Rules:
 *  - DRY-RUN by default; pass --apply to actually issue PUTs.
 *  - All In `bot_D4H6ZU35D7Z2LICH` is source-attached to src_PQQCANSMZ8CS09UA
 *    (sandbox-only test attach); DETACH first via `cb_import_publish.js`'s
 *    detach idiom: POST /bot/{id}/source/{sid} with {tags:[],channels:[]} is
 *    NOT a detach — real detach = DELETE /bot/{id}/source/{sid}. We do that.
 *  - Logica v1.3 classic `bot_8F6LD2M4728TS05O` is the A/B baseline; HOLD
 *    flag in the target table controls whether it's processed in this run.
 *  - NEVER touches the 10 correct Agent bots or Vacaville PROD (hardcoded
 *    PROTECT list; rename target list is hardcoded too — no glob, no fuzzy
 *    match on names).
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_mark_wrong_arch.mjs           # dry-run
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_mark_wrong_arch.mjs --apply   # do it
 *   ...  --apply --include-logica   # only after Phase 3 passes
 */
const K = process.env.CB_GS_API_KEY;
if (!K) { console.error('FATAL: CB_GS_API_KEY missing'); process.exit(2); }
const H = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };
const APPLY = process.argv.includes('--apply');
const INCLUDE_LOGICA = process.argv.includes('--include-logica');

// HARD PROTECT — never touch these (the 10 correct Agent bots + Vacaville PROD).
const PROTECT = new Set([
  'bot_F0VNPTPCIW88YI3J', // Vacaville PROD (LIVE) — never touch
  'bot_ZC2MREMJ87S77LH1', // 10th Planet Miami (AGENT)
  'bot_01MYV7I9IWMHYPCF', // Academy Scottsdale (AGENT, canonical template base)
  'bot_WPGXC5YR7VT13RVY', // Artistry BJJ (AGENT)
  'bot_SYX87T5XAAKPCUDE', // Ballantyne MA (AGENT)
  'bot_3TG2JEKB8YHKZ711', // Breathe JJ (AGENT)
  'bot_F2IMVLSJ61TQ4R8X', // Centerline JJ (AGENT)
  'bot_GEGYNE5WQNOYH7UB', // Champion MA (AGENT)
  'bot_7H147LLL7WMR506K', // Grit JJ (AGENT)
  'bot_20P7NZ6ZMRY37GC4', // Academy Eden Prairie (AGENT, discipline-switch ref)
  'bot_7W616F4BTWVFG84C', // Logica Agent v2.0 (the validation bot)
]);

// Rename targets — CLASSIC bots that replaced what should have been Agent
// builds. Each row: { id, label, detachFrom? (source id), hold? }.
const TARGETS = [
  { id: 'bot_D4H6ZU35D7Z2LICH', label: 'All In v2.2',                detachFrom: 'src_PQQCANSMZ8CS09UA' },
  { id: 'bot_SZI6TVDFECKDHFMS', label: 'Bodega v2.2' },
  { id: 'bot_6M9WIXCXKY4W9HDV', label: 'Gracie FV v1.1' },
  { id: 'bot_W19E72R6C8R6P8G5', label: 'Hammer v1.0' },
  { id: 'bot_EP85XGY1Y77NMVNX', label: 'Inverted Gear v1.0' },
  { id: 'bot_5HSEXPZLA5DJYAMG', label: 'Hamptons S v1.2' },
  { id: 'bot_KD1I3PQ8YECAUHQO', label: 'Mason Dixon v1.2' },
  { id: 'bot_9C7WRU5YB74XR55E', label: 'Paragon v1.3' },
  { id: 'bot_JINYMB8JL9J9SME0', label: 'OM BJJ v1.0' },
  { id: 'bot_9FQFKDX3GQ08QKA0', label: 'Sugoi v1.0' },
  { id: 'bot_XGO927OTFB9ECZIH', label: 'Ray Longo v1.0' },
  { id: 'bot_CX2MDPYQ558PP1DY', label: 'Universal MMA v1.0' },
  { id: 'bot_5W8EDYF0CBPOT036', label: 'Montgomery v1.0' },
  { id: 'bot_8F6LD2M4728TS05O', label: 'Logica v1.3 (A/B baseline)', hold: !INCLUDE_LOGICA },
];

console.log(`MODE: ${APPLY ? 'APPLY' : 'DRY-RUN'}${INCLUDE_LOGICA ? ' (include-logica)' : ''}`);
console.log(`TARGETS: ${TARGETS.filter(t => !t.hold).length} active / ${TARGETS.length} total\n`);

const PREFIX = '[WRONG-ARCH DELETE] ';
let renamed = 0, detached = 0, skipped = 0, failed = 0;

for (const t of TARGETS) {
  if (PROTECT.has(t.id)) { console.error(`!! PROTECTED id in target list: ${t.id} — REFUSED`); failed++; continue; }
  if (t.hold) { console.log(`HOLD  ${t.id} (${t.label}) — skipped this run`); skipped++; continue; }

  // Fetch current name
  let r, j;
  try {
    r = await fetch(`https://api.closebot.com/bot/${t.id}`, { headers: H });
    const tx = await r.text();
    try { j = JSON.parse(tx); } catch { j = {}; }
  } catch (e) { console.error(`FAIL fetch ${t.id}: ${e.message}`); failed++; continue; }
  if (!r.ok) { console.error(`FAIL fetch ${t.id}: HTTP ${r.status}`); failed++; continue; }

  const current = j.bot?.name || j.name || '';
  if (current.startsWith(PREFIX)) { console.log(`SKIP  ${t.id} (${t.label}) — already prefixed`); skipped++; continue; }
  const target = PREFIX + current;

  // Detach first if needed
  if (t.detachFrom) {
    if (APPLY) {
      try {
        const dr = await fetch(`https://api.closebot.com/bot/${t.id}/source/${t.detachFrom}`, { method: 'DELETE', headers: H });
        if (dr.ok) { console.log(`DETACH ${t.id} from ${t.detachFrom} :: OK`); detached++; }
        else { console.error(`DETACH ${t.id} from ${t.detachFrom} :: HTTP ${dr.status}`); failed++; continue; }
      } catch (e) { console.error(`DETACH ${t.id}: ${e.message}`); failed++; continue; }
    } else {
      console.log(`DRY   detach ${t.id} from ${t.detachFrom}`);
    }
  }

  // Rename
  if (APPLY) {
    try {
      const pr = await fetch(`https://api.closebot.com/bot/${t.id}`, {
        method: 'PUT', headers: H, body: JSON.stringify({ name: target }),
      });
      if (pr.ok) { console.log(`RENAME ${t.id} :: ${current.slice(0, 60)}... -> [WRONG-ARCH DELETE] ...`); renamed++; }
      else { console.error(`RENAME ${t.id} :: HTTP ${pr.status}`); failed++; }
    } catch (e) { console.error(`RENAME ${t.id}: ${e.message}`); failed++; }
  } else {
    console.log(`DRY   rename ${t.id} :: "${current}" -> "${target}"`);
  }
}

console.log(`\nSUMMARY: renamed=${renamed}, detached=${detached}, skipped=${skipped}, failed=${failed}`);
if (!APPLY) console.log('Dry run only. Re-run with --apply to issue PUTs.');
process.exit(failed > 0 ? 1 : 0);
