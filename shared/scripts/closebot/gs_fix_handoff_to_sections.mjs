/**
 * gs_fix_handoff_to_sections.mjs
 *
 * Aligns the 8 session rebuild bots with the 19 launched bots (commit 0fe1ba3):
 *   1. Replace n10_intro.data.Sections[Knowledge Gap].Body with canonical handoff text
 *      (includes @@[Update Tags] 'alert' tag — this is the correct location for tool calls)
 *   2. Strip the handoff append from n10_intro.data.Instructions
 *      (we incorrectly appended it there in gs_fix_handoff_placement.mjs — wrong field)
 *
 * Canonical KB gap text sourced from vacaville bot_F0VNPTPCIW88YI3J v0.0.3.
 */

const EXECUTE = process.argv.includes('--execute');
const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { console.error('CB_GS_API_KEY missing'); process.exit(1); }
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

const KNOWLEDGE_GAP_BODY = `Use the knowledge base when answering questions. If an inquiry from the contact is NOT found in the knowledge base or FAQs, do not guess or fabricate an answer. Respond with: 'That's a great question — let me get the team to follow up with you on that.' Then use @@[Update Tags] to add the 'alert' tag so a teammate can step in.`;

const HANDOFF_APPEND_MARKER = 'If a lead asks something not covered by the knowledge base or outside your scope';

const BOTS = [
  { slug: 'royaljj',      id: 'bot_4N8WBIF210AU944O' },
  { slug: 'allinjujitsu', id: 'bot_15WPBGYMS6HLGC5E' },
  { slug: 'graciefv',     id: 'bot_J7WW9BOARJK0NI9F' },
  { slug: 'hammersports', id: 'bot_AFKR1QYFJ3VKYF3W' },
  { slug: 'invertedgear', id: 'bot_FIWVSZBWNX546KKA' },
  { slug: 'hamptonsjj',   id: 'bot_WWB97FEM611TC5SY' },
  { slug: 'masondixon',   id: 'bot_0HQBLZA2NO9T1ZFM' },
  { slug: 'graciejjsj',   id: 'bot_UMEBUHOW9YQOLIHU' },
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
  console.log(`  Latest published: ${ver}`);

  const stepsR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${ver}`, { headers: H });
  const steps = await stepsR.json();

  const intro = steps.nodes.find(n => n.id === 'n10_intro');
  if (!intro) { console.error('  ERROR: no n10_intro'); results.push({ slug, status: 'NO_INTRO' }); continue; }

  // 1. Fix Knowledge Gap section
  const kgSection = (intro.data.Sections || []).find(s => s.Title === 'Knowledge Gap');
  if (kgSection) {
    const before = kgSection.Body;
    kgSection.Body = KNOWLEDGE_GAP_BODY;
    console.log(`  Knowledge Gap: updated (was ${before.length} chars → ${KNOWLEDGE_GAP_BODY.length} chars)`);
  } else {
    console.warn(`  WARN: no Knowledge Gap section found — adding one`);
    if (!intro.data.Sections) intro.data.Sections = [];
    intro.data.Sections.push({ Title: 'Knowledge Gap', Body: KNOWLEDGE_GAP_BODY });
  }

  // 2. Strip handoff append from data.Instructions
  const instrBefore = intro.data.Instructions || '';
  const appendIdx = instrBefore.indexOf('\n\n' + HANDOFF_APPEND_MARKER.substring(0, 20));
  const appendIdx2 = instrBefore.indexOf('\n\n' + 'If a lead asks');
  const cutAt = appendIdx >= 0 ? appendIdx : appendIdx2;
  if (cutAt >= 0) {
    intro.data.Instructions = instrBefore.substring(0, cutAt);
    console.log(`  Instructions: stripped handoff append (${instrBefore.length} → ${intro.data.Instructions.length} chars)`);
  } else {
    console.log(`  Instructions: no handoff append found (${instrBefore.length} chars) — already clean`);
  }

  if (!EXECUTE) {
    console.log(`  [DRY RUN] would POST /save + /publish`);
    results.push({ slug, status: 'DRY_RUN', ver });
    continue;
  }

  // POST /save
  const saveR = await fetch(`https://api.closebot.com/bot/${id}/save`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ botSteps: steps, layoutOnly: false }),
  });
  const saveJ = await saveR.json();
  if (!saveR.ok) { console.error(`  SAVE FAILED: ${saveR.status}`, JSON.stringify(saveJ)); results.push({ slug, status: 'SAVE_FAIL' }); continue; }
  const newVer = saveJ.version;
  console.log(`  Saved → ${newVer}`);

  // Publish
  const pubR = await fetch(`https://api.closebot.com/bot/${id}/publish`, {
    method: 'POST', headers: H, body: JSON.stringify({}),
  });
  if (!pubR.ok) { console.error(`  PUBLISH FAILED: ${pubR.status}`, await pubR.text()); results.push({ slug, status: 'PUB_FAIL', ver: newVer }); continue; }
  console.log(`  Published ✓`);

  // Verify
  await new Promise(r => setTimeout(r, 1500));
  const vR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${newVer}`, { headers: H });
  const vSteps = await vR.json();
  const vIntro = vSteps.nodes.find(n => n.id === 'n10_intro');
  const vKg = (vIntro?.data?.Sections||[]).find(s => s.Title === 'Knowledge Gap');
  const vInstr = vIntro?.data?.Instructions || '';
  const kgOK = vKg?.Body?.includes('@@[Update Tags]');
  const instrClean = !vInstr.includes(HANDOFF_APPEND_MARKER.substring(0, 20));
  console.log(`  Verify — KG has @@[Update Tags]: ${kgOK} | Instructions clean: ${instrClean}`);

  results.push({ slug, status: (kgOK && instrClean) ? 'PASS' : `PARTIAL kg=${kgOK},instr=${instrClean}`, ver: newVer });
  await new Promise(r => setTimeout(r, 400));
}

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(`  ${r.slug}: ${r.status}${r.ver ? ' v'+r.ver : ''}`));
