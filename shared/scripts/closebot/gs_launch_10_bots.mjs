/**
 * gs_launch_10_bots.mjs
 *
 * Attach the 10 parked GS bots to their prod sources.
 * Tag filter matches the live bot standard: concierge trigger + standard exclusions.
 *
 * Logica (src_0HFNJJIYASHOG06Y) is 404 — skipped, needs Bobby to provide real source.
 *
 * Dry:     node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_launch_10_bots.mjs
 * Execute: node ... --execute
 */

const EXECUTE = process.argv.includes('--execute');
const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { console.error('CB_GS_API_KEY missing'); process.exit(1); }
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

const STANDARD_TAGS = [
  { name: 'concierge',   approveDeny: true,  id: 'concierge' },
  { name: 'booked',      approveDeny: false, id: 'booked' },
  { name: 'member',      approveDeny: false, id: 'member' },
  { name: 'alumni',      approveDeny: false, id: 'alumni' },
  { name: 'spam',        approveDeny: false, id: 'spam' },
  { name: 'staff',       approveDeny: false, id: 'staff' },
  { name: 'service',     approveDeny: false, id: 'service' },
  { name: 'showed',      approveDeny: false, id: 'showed' },
  { name: 'alert',       approveDeny: false, id: 'alert' },
  { name: 'aggressive',  approveDeny: false, id: 'aggressive' },
];

const STANDARD_CHANNELS = ['WhatsApp', 'GMB', 'Live_Chat', 'SMS', 'FB', 'IG'];

const BOTS = [
  // Logica skipped — src_0HFNJJIYASHOG06Y is 404, needs Bobby to provide real source
  { slug: 'paragon',      botId: 'bot_3CLH0PGK4HNLX144', srcId: 'src_SFJ08L818G37B5CP' },
  { slug: 'royaljj',      botId: 'bot_4N8WBIF210AU944O', srcId: 'src_R9BDT0U16EJ6LA29' },
  { slug: 'allinjj',      botId: 'bot_15WPBGYMS6HLGC5E', srcId: 'src_PQQCANSMZ8CS09UA' },
  { slug: 'graciefv',     botId: 'bot_J7WW9BOARJK0NI9F', srcId: 'src_LGA6WCCJSAEE8X6R' },
  { slug: 'hammer',       botId: 'bot_AFKR1QYFJ3VKYF3W', srcId: 'src_OKNBAOGCND99B5EM' },
  { slug: 'invertedgear', botId: 'bot_FIWVSZBWNX546KKA',  srcId: 'src_O7P37VWAEHPFNCQ5' },
  { slug: 'hamptonsjj',   botId: 'bot_WWB97FEM611TC5SY',  srcId: 'src_3HPZKL5NULBRLNLX' },
  { slug: 'graciejjsj',   botId: 'bot_UMEBUHOW9YQOLIHU',  srcId: 'src_257VE0Q8RX3IEDVD' },
  { slug: 'soma',         botId: 'bot_U2JSE7DXEXL7ME50',  srcId: 'src_R05QT50QS4PTYDBG' },
];

const results = [];

for (const { slug, botId, srcId } of BOTS) {
  console.log(`\n--- ${slug} ---`);
  console.log(`  bot: ${botId} → src: ${srcId}`);

  if (!EXECUTE) {
    console.log(`  [DRY RUN] would POST /bot/${botId}/source/${srcId}`);
    results.push({ slug, status: 'DRY_RUN' });
    continue;
  }

  const r = await fetch(`https://api.closebot.com/bot/${botId}/source/${srcId}`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ tags: STANDARD_TAGS, channels: STANDARD_CHANNELS }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error(`  ATTACH FAILED: ${r.status} — ${err.slice(0, 200)}`);
    results.push({ slug, status: `FAIL_${r.status}` });
    continue;
  }

  console.log(`  Attached ✓`);

  // Verify
  await new Promise(resolve => setTimeout(resolve, 800));
  const vR = await fetch(`https://api.closebot.com/agency/source/${srcId}`, { headers: H });
  const vSrc = await vR.json();
  const attached = (vSrc.bots || []).find(b => b.id === botId);
  const ok = !!attached;
  console.log(`  Verify: ${ok ? 'CONFIRMED on prod source' : 'NOT FOUND — check manually'}`);

  results.push({ slug, status: ok ? 'LIVE' : 'ATTACH_UNVERIFIED' });
  await new Promise(resolve => setTimeout(resolve, 400));
}

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(`  ${r.slug}: ${r.status}`));
console.log('\n  logica: SKIPPED — src_0HFNJJIYASHOG06Y is 404. Bobby needs to provide the real CB source ID.');
if (!EXECUTE) console.log('\n[DRY RUN] Add --execute to launch.');
