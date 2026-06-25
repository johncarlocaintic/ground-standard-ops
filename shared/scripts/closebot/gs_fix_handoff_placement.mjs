/**
 * gs_fix_handoff_placement.mjs
 *
 * Fixes incorrect handoff instruction placement on the 8 session rebuild bots.
 *
 * PROBLEM: gs_jj_handoff_update_session_rebuilds.mjs appended the handoff rule to
 * variables.business.whyText (conversationReason). That is wrong:
 *   1. @@[Update Tags] does not fire from conversationReason — tools only work inside node Instructions.
 *   2. conversationReason should stay under 1k chars.
 *
 * FIX:
 *   1. Strip the handoff text from variables.business.whyText on all 8 bots.
 *   2. Append the handoff rule to n10_intro.data.Instructions (where @@[tool] syntax is valid).
 *   3. POST /save + /publish each bot.
 *
 * Run (dry-run):  node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_fix_handoff_placement.mjs
 * Run (execute):  node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_fix_handoff_placement.mjs --execute
 */

import { writeFileSync } from 'fs';

const EXECUTE = process.argv.includes('--execute');
const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { console.error('CB_GS_API_KEY missing'); process.exit(1); }

const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

// The wrong text that was appended to whyText — strip this out.
// Trim leading \n\n before matching.
const HANDOFF_MARKER = 'If a lead asks something not covered by the knowledge base or outside your scope';

// The correct instruction for n10_intro.data.Instructions
const HANDOFF_NODE_TEXT = '\n\nIf a lead asks something not covered by the knowledge base or outside your scope: say "That is a great question — let me get the team to follow up with you on that." Use @@[Update Tags] to add the \'alert\' tag. Do not guess or fabricate an answer.';

const BOTS = [
  { slug: 'royaljj',       id: 'bot_4N8WBIF210AU944O' },
  { slug: 'allinjujitsu',  id: 'bot_15WPBGYMS6HLGC5E' },
  { slug: 'graciefv',      id: 'bot_J7WW9BOARJK0NI9F' },
  { slug: 'hammersports',  id: 'bot_AFKR1QYFJ3VKYF3W' },
  { slug: 'invertedgear',  id: 'bot_FIWVSZBWNX546KKA' },
  { slug: 'hamptonsjj',    id: 'bot_WWB97FEM611TC5SY' },
  { slug: 'masondixon',    id: 'bot_0HQBLZA2NO9T1ZFM' },
  { slug: 'graciejjsj',    id: 'bot_UMEBUHOW9YQOLIHU' },
];

function getLatestPublishedVersion(bot) {
  const versions = bot.versions || [];
  const published = versions.filter(v => v.published);
  const pool = published.length ? published : versions;
  return pool.slice().sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))[0]?.version;
}

const results = [];

for (const { slug, id } of BOTS) {
  console.log(`\n--- ${slug} (${id}) ---`);

  // 1. Get latest version
  const botR = await fetch(`https://api.closebot.com/bot/${id}`, { headers: H });
  const bot = await botR.json();
  const ver = getLatestPublishedVersion(bot);
  console.log(`  Latest published: ${ver}`);

  // 2. Fetch botSteps
  const stepsR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${ver}`, { headers: H });
  const steps = await stepsR.json();

  // 3. Strip HANDOFF_TEXT from whyText
  const whyBefore = steps.variables.business.whyText;
  const handoffIdx = whyBefore.indexOf(HANDOFF_MARKER);
  let whyFixed = whyBefore;
  if (handoffIdx !== -1) {
    // Strip from the last \n before the marker back (removes \n\n prefix too)
    const cutAt = whyBefore.lastIndexOf('\n', handoffIdx - 1);
    whyFixed = cutAt >= 0 ? whyBefore.substring(0, cutAt) : whyBefore.substring(0, handoffIdx);
    console.log(`  whyText: stripped handoff (${whyBefore.length} → ${whyFixed.length} chars)`);
  } else {
    console.log(`  whyText: no handoff marker found (${whyBefore.length} chars) — already clean or different format`);
  }
  if (whyFixed.length > 1000) {
    console.warn(`  WARNING: whyText still ${whyFixed.length} chars (>1000) after strip — review manually`);
  }
  steps.variables.business.whyText = whyFixed;

  // 4. Append handoff rule to n10_intro.data.Instructions
  const intro = steps.nodes.find(n => n.id === 'n10_intro');
  if (!intro) {
    console.error(`  ERROR: n10_intro not found — skipping ${slug}`);
    results.push({ slug, status: 'ERROR: no n10_intro' });
    continue;
  }
  const instrBefore = intro.data.Instructions || '';
  if (instrBefore.includes(HANDOFF_MARKER)) {
    console.log(`  n10_intro.Instructions: handoff already present — skip append`);
  } else {
    intro.data.Instructions = instrBefore + HANDOFF_NODE_TEXT;
    console.log(`  n10_intro.Instructions: appended handoff (${intro.data.Instructions.length} chars)`);
  }

  if (!EXECUTE) {
    console.log(`  [DRY RUN] Would POST /save + /publish`);
    results.push({ slug, status: 'DRY_RUN', whyBefore: whyBefore.length, whyAfter: whyFixed.length });
    continue;
  }

  // 5. POST /save
  const saveR = await fetch(`https://api.closebot.com/bot/${id}/save`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ botSteps: steps, layoutOnly: false }),
  });
  const saveJ = await saveR.json();
  if (!saveR.ok) {
    console.error(`  SAVE FAILED: ${saveR.status}`, JSON.stringify(saveJ));
    results.push({ slug, status: `SAVE_FAIL ${saveR.status}` });
    continue;
  }
  const newVer = saveJ.version || '?';
  console.log(`  Saved → new version: ${newVer}`);

  // 6. Publish
  const pubR = await fetch(`https://api.closebot.com/bot/${id}/publish`, {
    method: 'POST', headers: H, body: JSON.stringify({}),
  });
  if (!pubR.ok) {
    const t = await pubR.text();
    console.error(`  PUBLISH FAILED: ${pubR.status}`, t);
    results.push({ slug, status: `PUB_FAIL ${pubR.status}`, version: newVer });
    continue;
  }
  console.log(`  Published ✓`);

  // 7. Verify — fetch new version and check
  await new Promise(r => setTimeout(r, 1500));
  const verR = await fetch(`https://api.closebot.com/bot/${id}/steps?botVersion=${newVer}`, { headers: H });
  const verSteps = await verR.json();
  const verIntro = verSteps.nodes.find(n => n.id === 'n10_intro');
  const verWhy = verSteps.variables.business.whyText;
  const whyOK = !verWhy.includes(HANDOFF_MARKER);
  const instrOK = verIntro?.data.Instructions?.includes(HANDOFF_MARKER);
  console.log(`  Verify — whyText clean: ${whyOK} | n10_intro has handoff: ${instrOK}`);

  results.push({
    slug, id,
    status: (whyOK && instrOK) ? 'PASS' : `PARTIAL (why=${whyOK},instr=${instrOK})`,
    version: newVer,
    whyLen: verWhy.length,
  });

  await new Promise(r => setTimeout(r, 500));
}

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(`  ${r.slug}: ${r.status}${r.version ? ` v${r.version}` : ''}${r.whyLen ? ` whyLen=${r.whyLen}` : ''}`));
