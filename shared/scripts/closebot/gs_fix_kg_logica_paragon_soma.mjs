/**
 * gs_fix_kg_logica_paragon_soma.mjs
 *
 * Apply the canonical Knowledge Gap section (with @@[Update Tags]) to
 * Logica, Paragon, and SOMA — missed by the earlier session fix pass.
 *
 * Run dry:  node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_fix_kg_logica_paragon_soma.mjs
 * Execute:  node ... --execute
 */

const EXECUTE = process.argv.includes('--execute');
const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { console.error('CB_GS_API_KEY missing'); process.exit(1); }
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

const KNOWLEDGE_GAP_BODY = "Use the knowledge base when answering questions. If an inquiry from the contact is NOT found in the knowledge base or FAQs, do not guess or fabricate an answer. Respond with: 'That's a great question — let me get the team to follow up with you on that.' Then use @@[Update Tags] to add the 'alert' tag so a teammate can step in.";

const BOTS = [
  { slug: 'logica',  id: 'bot_7W616F4BTWVFG84C' },  // Agent Node v2.0
  { slug: 'paragon', id: 'bot_3CLH0PGK4HNLX144' },  // Agent Node v2.0
  { slug: 'soma',    id: 'bot_U2JSE7DXEXL7ME50' },  // Agent Node v1.0
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
  console.log(`  version: ${ver}`);

  const stepsR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${ver}`, { headers: H });
  const steps = await stepsR.json();

  const intro = (steps.nodes || []).find(n => n.id === 'n10_intro');
  if (!intro) {
    console.error(`  ERROR: no n10_intro found. Node IDs: ${(steps.nodes||[]).map(n=>n.id).join(', ')}`);
    results.push({ slug, status: 'NO_INTRO' });
    continue;
  }

  if (!intro.data.Sections) intro.data.Sections = [];
  const kgSection = intro.data.Sections.find(s => s.Title === 'Knowledge Gap');
  if (kgSection) {
    kgSection.Body = KNOWLEDGE_GAP_BODY;
    console.log(`  Updated existing Knowledge Gap section`);
  } else {
    intro.data.Sections.push({ Title: 'Knowledge Gap', Body: KNOWLEDGE_GAP_BODY });
    console.log(`  Added new Knowledge Gap section`);
  }

  if (!EXECUTE) {
    console.log(`  [DRY RUN] would POST /save + /publish`);
    results.push({ slug, status: 'DRY_RUN', ver });
    continue;
  }

  const saveR = await fetch(`https://api.closebot.com/bot/${id}/save`, {
    method: 'POST',
    headers: H,
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

  await new Promise(r => setTimeout(r, 1500));
  const vR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${newVer}`, { headers: H });
  const vSteps = await vR.json();
  const vIntro = (vSteps.nodes||[]).find(n => n.id === 'n10_intro');
  const vKg = (vIntro?.data?.Sections||[]).find(s => s.Title === 'Knowledge Gap');
  const ok = vKg?.Body?.includes('@@[Update Tags]');
  console.log(`  Verify KG@@: ${ok}`);

  results.push({ slug, status: ok ? 'PASS' : 'PARTIAL', ver: newVer });
  await new Promise(r => setTimeout(r, 400));
}

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(`  ${r.slug}: ${r.status}${r.ver ? ' v'+r.ver : ''}`));
if (!EXECUTE) console.log('\n[DRY RUN] Add --execute to apply.');
