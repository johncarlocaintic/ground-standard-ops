/**
 * gs_mark_demo_for_delete.mjs
 *
 * Rename all original DEMO bots (Section C legacy) to "[DELETE] {name}".
 * These are the pre-Agent-Node placeholder bots sitting on prod sources
 * that have since been superseded by Launch builds.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_mark_demo_for_delete.mjs
 * Add --execute to actually rename.
 */

const EXECUTE = process.argv.includes('--execute');
const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { console.error('CB_GS_API_KEY missing'); process.exit(1); }
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

const DEMO_BOTS = [
  // Section C — untouched DEMO bots (original legacy builds)
  { id: 'bot_A6FT1DEJ00RECPX8', slug: 'paragonsimi' },
  { id: 'bot_JDOGUXG518OUCW07', slug: 'ombjj' },
  { id: 'bot_U3AYK2QUT6ZCLT82', slug: 'sugoi' },
  { id: 'bot_X25FOL4OBQIZLQHC', slug: 'raylongo' },
  { id: 'bot_UXK2C02TYVFFEGVP', slug: 'universalmma' },
  { id: 'bot_ZLPS10P745H18PMH', slug: 'montgomery' },
  { id: 'bot_M7329FUF6URC5QEM', slug: 'signature' },
  { id: 'bot_MIMY3MXZA9F095HJ', slug: 'roberts' },
  { id: 'bot_LT26658HEJQFIYIM', slug: 'simpleman' },
  { id: 'bot_9W8PGIG7EE5MM04L', slug: 'killerb' },
  { id: 'bot_KDNCW1NQLJ4YPK3V', slug: 'wisconsin' },
  { id: 'bot_11O7Q2TL1O4C1EKE', slug: 'soulcraft' },
  { id: 'bot_9EBS13G4Z15K0X93', slug: 'plainville' },
  { id: 'bot_EV9FGN2PCDTB5GGK', slug: 'jiujitsuhub' },
  { id: 'bot_LGLEO5P8XKXO2C91', slug: 'verdevalley' },
  { id: 'bot_NWBZGGIGUSO7BVOF', slug: 'granitebay' },
  { id: 'bot_PNXQEN2D6FX5GFD7', slug: 'jeanjaques' },
  { id: 'bot_VS4PE4SZ6V72T5TM', slug: 'luckycat' },
  { id: 'bot_8H030EGM691OESNT', slug: 'westhampton' },
  // Non-gym holds
  { id: 'bot_DQ1RQC9SZWLDBC1W', slug: 'blab' },
  { id: 'bot_SOPZN2ZRFB9UOSYR', slug: 'championchiro' },
];

const results = [];

for (const { id, slug } of DEMO_BOTS) {
  const r = await fetch(`https://api.closebot.com/bot/${id}`, { headers: H });
  if (!r.ok) {
    console.log(`  ${slug} (${id}) — FETCH FAILED ${r.status}`);
    results.push({ slug, id, status: `FETCH_FAIL_${r.status}` });
    continue;
  }
  const bot = await r.json();
  const currentName = bot.name || '(no name)';
  const newName = `[DELETE] ${currentName}`;

  console.log(`${slug}: "${currentName}" → "${newName}"`);

  if (!EXECUTE) {
    results.push({ slug, id, status: 'DRY_RUN', currentName });
    continue;
  }

  const putR = await fetch(`https://api.closebot.com/bot/${id}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ name: newName }),
  });
  if (!putR.ok) {
    console.error(`  RENAME FAILED: ${putR.status}`, await putR.text());
    results.push({ slug, id, status: 'RENAME_FAIL', currentName });
  } else {
    console.log(`  ✓ renamed`);
    results.push({ slug, id, status: 'RENAMED', from: currentName, to: newName });
  }

  await new Promise(r => setTimeout(r, 300));
}

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(`  ${r.slug}: ${r.status}${r.currentName ? ` | was: "${r.currentName}"` : ''}`));
if (!EXECUTE) console.log('\n[DRY RUN] Add --execute to rename.');
