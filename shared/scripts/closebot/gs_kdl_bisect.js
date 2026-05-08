// Bisect v4.1 KDL: strip blocks one at a time, see which one unblocks the create.
import fs from 'fs';
const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

const fullKdl = fs.readFileSync('shared/logs/vacaville_v4.1.kdl', 'utf8');

// Helper: strip a top-level node block by ID match
function stripBlock(kdl, blockType, blockId) {
  const startMarker = `${blockType} id="${blockId}" {`;
  const startIdx = kdl.indexOf(startMarker);
  if (startIdx === -1) return kdl;
  // Find matching closing brace
  let depth = 0;
  let i = kdl.indexOf('{', startIdx);
  for (; i < kdl.length; i++) {
    if (kdl[i] === '{') depth++;
    else if (kdl[i] === '}') { depth--; if (depth === 0) break; }
  }
  return kdl.slice(0, startIdx) + kdl.slice(i + 2); // +2 to skip "}\n"
}

async function tryCreate(kdl, label) {
  const r = await fetch('https://api.closebot.com/bot', {
    method: 'POST',
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `bisect_${label}_${Date.now()}`, importKdl: kdl }),
  });
  const t = await r.text();
  return { status: r.status, body: t.slice(0, 200) };
}

(async () => {
  console.log(`Full v4.1 KDL: ${fullKdl.length} chars`);

  const tests = [
    { label: 'baseline_full', kdl: fullKdl },
    { label: 'no_aggression', kdl: stripBlock(fullKdl, 'ScenarioAggression', '45705328-9e53-44d6-a530-53ba70d19e63') },
    { label: 'no_multiobj', kdl: stripBlock(fullKdl, 'MultiObjective', 'a8aad376-4fd4-4a1b-b5bf-a9d72b06ee03') },
    { label: 'no_ns04', kdl: stripBlock(fullKdl, 'ScenarioCustom', 'ns04_dropin') },
    { label: 'no_ns06', kdl: stripBlock(fullKdl, 'ScenarioCustom', 'ns06_knowledge_gap_handoff') },
    { label: 'no_ns07', kdl: stripBlock(fullKdl, 'ScenarioCustom', 'ns07_booking_failure_handoff') },
    { label: 'no_n30_book', kdl: stripBlock(fullKdl, 'Method', 'n30_book') },
    { label: 'no_n20_details', kdl: stripBlock(fullKdl, 'Method', 'n20_details') },
    { label: 'only_intro_and_book', kdl: stripBlock(stripBlock(stripBlock(stripBlock(fullKdl, 'ScenarioAggression', '45705328-9e53-44d6-a530-53ba70d19e63'), 'MultiObjective', 'a8aad376-4fd4-4a1b-b5bf-a9d72b06ee03'), 'ScenarioCustom', 'ns04_dropin'), 'ScenarioCustom', 'ns07_booking_failure_handoff') },
  ];

  for (const t of tests) {
    const result = await tryCreate(t.kdl, t.label);
    const delta = t.kdl.length - fullKdl.length;
    console.log(`[${result.status}] ${t.label} (${delta >= 0 ? '+' : ''}${delta} chars): ${result.body.slice(0, 120)}`);
    await new Promise(r => setTimeout(r, 1500));
  }
})();
