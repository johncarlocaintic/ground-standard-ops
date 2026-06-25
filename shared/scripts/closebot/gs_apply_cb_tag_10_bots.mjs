/**
 * gs_apply_cb_tag_10_bots.mjs
 *
 * Apply the CB tag instruction to n30_book on the 10 parked bots
 * that are pending launch (same pattern as the 20 live bots in commit 4e9bea3).
 *
 * Tag text: "After the booking is confirmed successfully, use @@[Update Tags]
 * to add the 'CB' tag to this contact."
 *
 * Dry:     node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_apply_cb_tag_10_bots.mjs
 * Execute: node ... --execute
 */

const EXECUTE = process.argv.includes('--execute');
const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { console.error('CB_GS_API_KEY missing'); process.exit(1); }
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

const CB_TAG_APPEND = "\n\nAfter the booking is confirmed successfully, use @@[Update Tags] to add the 'CB' tag to this contact.";

const BOTS = [
  { slug: 'logica',       id: 'bot_7W616F4BTWVFG84C' },
  { slug: 'paragon',      id: 'bot_3CLH0PGK4HNLX144' },
  { slug: 'royaljj',      id: 'bot_4N8WBIF210AU944O' },
  { slug: 'allinjj',      id: 'bot_15WPBGYMS6HLGC5E' },
  { slug: 'graciefv',     id: 'bot_J7WW9BOARJK0NI9F' },
  { slug: 'hammer',       id: 'bot_AFKR1QYFJ3VKYF3W' },
  { slug: 'invertedgear', id: 'bot_FIWVSZBWNX546KKA' },
  { slug: 'hamptonsjj',   id: 'bot_WWB97FEM611TC5SY' },
  { slug: 'graciejjsj',   id: 'bot_UMEBUHOW9YQOLIHU' },
  { slug: 'soma',         id: 'bot_U2JSE7DXEXL7ME50' },
];

function getLatestPublished(bot) {
  const versions = bot.versions || [];
  const pub = versions.filter(v => v.published).sort((a,b) => new Date(b.modifiedAt)-new Date(a.modifiedAt));
  return (pub[0] || versions.sort((a,b) => new Date(b.modifiedAt)-new Date(a.modifiedAt))[0])?.version;
}

const results = [];

for (const { slug, id } of BOTS) {
  console.log(`\n--- ${slug} (${id}) ---`);

  const botR = await fetch(`https://api.closebot.com/bot/${id}`, { headers: H });
  const bot = await botR.json();
  const ver = getLatestPublished(bot);

  const stepsR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${ver}`, { headers: H });
  const steps = await stepsR.json();

  const n30 = (steps.nodes || []).find(n => n.id === 'n30_book');
  if (!n30) {
    console.error('  ERROR: no n30_book');
    results.push({ slug, status: 'NO_N30' });
    continue;
  }

  // Check already patched
  if ((n30.data.Instructions || '').includes("'CB' tag")) {
    console.log('  SKIP — already has CB tag');
    results.push({ slug, status: 'ALREADY_PATCHED', ver });
    continue;
  }

  // Append to Instructions
  n30.data.Instructions = (n30.data.Instructions || '') + CB_TAG_APPEND;

  // Append to Sections[0].Body if it exists (mirrors Instructions on these bots)
  const sec = n30.data.Sections?.[0];
  if (sec) sec.Body = (sec.Body || '') + CB_TAG_APPEND;

  // Ensure EnableAddTag is on
  n30.data.EnableAddTag = true;

  console.log(`  Appended CB tag to Instructions${sec ? ' + Sections[0]' : ''}`);

  if (!EXECUTE) {
    console.log(`  [DRY RUN] would POST /save + /publish`);
    results.push({ slug, status: 'DRY_RUN', ver });
    continue;
  }

  const saveR = await fetch(`https://api.closebot.com/bot/${id}/save`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ botSteps: steps, layoutOnly: false }),
  });
  const saveJ = await saveR.json();
  if (!saveR.ok) {
    console.error(`  SAVE FAILED: ${saveR.status}`, JSON.stringify(saveJ));
    results.push({ slug, status: 'SAVE_FAIL' });
    continue;
  }
  const newVer = saveJ.version;
  console.log(`  Saved → ${newVer}`);

  const pubR = await fetch(`https://api.closebot.com/bot/${id}/publish`, {
    method: 'POST', headers: H, body: JSON.stringify({}),
  });
  if (!pubR.ok) {
    console.error(`  PUBLISH FAILED: ${pubR.status}`, await pubR.text());
    results.push({ slug, status: 'PUB_FAIL', ver: newVer });
    continue;
  }
  console.log(`  Published ✓`);

  // Verify
  await new Promise(r => setTimeout(r, 1200));
  const vR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${newVer}`, { headers: H });
  const vSteps = await vR.json();
  const vN30 = (vSteps.nodes||[]).find(n => n.id === 'n30_book');
  const ok = (vN30?.data?.Instructions || '').includes("'CB' tag");
  console.log(`  Verify CB tag: ${ok}`);

  results.push({ slug, status: ok ? 'PASS' : 'PARTIAL', ver: newVer });
  await new Promise(r => setTimeout(r, 400));
}

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(`  ${r.slug}: ${r.status}${r.ver ? ' v'+r.ver : ''}`));
if (!EXECUTE) console.log('\n[DRY RUN] Add --execute to apply.');
