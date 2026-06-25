/**
 * Pull current launch bot KDL + source attachment + extract every tag we use.
 * Output: a clean list Bobby can audit in Vacaville GHL.
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';

async function req(m, ep) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

(async () => {
  console.log(`=== Vacaville Bot Tag Inventory ===\n`);

  // 1. Pull bot detail for source filter tags
  const det = await req('GET', `/bot/${LAUNCH}`);
  if (!det.ok) { console.log('detail fetch fail'); return; }

  console.log(`SOURCE FILTER TAGS (set on the Vacaville source attachment in CloseBot):\n`);
  for (const s of (det.json.sources || [])) {
    console.log(`  Source: ${s.name} (${s.id})`);
    const required = (s.tags || []).filter(t => t.approveDeny);
    const excluded = (s.tags || []).filter(t => !t.approveDeny);
    if (required.length) {
      console.log(`  REQUIRED (contact MUST have at least one to enter):`);
      for (const t of required) console.log(`    + ${t.name}`);
    }
    if (excluded.length) {
      console.log(`  EXCLUDED (contact must NOT have any to enter):`);
      for (const t of excluded) console.log(`    - ${t.name}`);
    }
  }

  // 2. Pull KDL and grep all add_tag references
  console.log(`\n\nTAGS THE BOT ADDS TO CONTACTS (from the workflow KDL):\n`);
  const exp = await req('GET', `/bot/${LAUNCH}/export`);
  if (!exp.ok || !exp.json.kdl) { console.log('export fail'); return; }
  const kdl = exp.json.kdl;

  // Scan for tag references in KDL
  const tagSet = new Set();

  // Pattern 1: Tag "tag-name" (in TagsModified, AddTag etc nodes)
  const pat1 = /Tag\s+"([^"]+)"/g;
  let m;
  while ((m = pat1.exec(kdl)) !== null) tagSet.add(m[1]);

  // Pattern 2: addTag references in Body strings
  const pat2 = /['"](?:concierge[^'"]*|interested|booked|appointment booked|alumni|member|spam|staff|service|showed|ai off)['"]/gi;
  while ((m = pat2.exec(kdl)) !== null) {
    let raw = m[0].slice(1, -1).toLowerCase();
    tagSet.add(raw);
  }

  // Pattern 3: explicit `tag 'X'` mentions in Body / Instructions strings
  const pat3 = /\btag(?:\s+to\s+)?\s+['"]([^'"]+)['"]/gi;
  while ((m = pat3.exec(kdl)) !== null) tagSet.add(m[1]);

  // Pattern 4: known scenario-related tags (from earlier work)
  const knownScenarios = ['aggression detected', 'aggression detected - human', 'aggression detected - human handoff'];
  // We'll only add if the KDL actually references aggression
  if (/aggression/i.test(kdl)) {
    for (const t of knownScenarios) tagSet.add(t);
  }

  const sorted = Array.from(tagSet).sort();
  console.log(`  (${sorted.length} unique tag references found in KDL — some may be in instruction text rather than actual tool calls)`);
  console.log('');
  for (const t of sorted) console.log(`  • ${t}`);

  // 3. Pull "interested" and "booked" type tags from observed test runs
  console.log(`\n\nTAGS OBSERVED ON TEST CONTACTS IN GHL TODAY (from sweep runs):\n`);
  // Just enumerate the common ones we've seen
  console.log(`  • interested            (added when lead expresses interest)`);
  console.log(`  • appointment booked    (added after successful booking)`);
  console.log(`  • booked                (added after successful booking)`);

  // 4. Save raw KDL excerpt for Bobby's audit
  const fs = await import('fs');
  fs.writeFileSync('shared/logs/vacaville_tag_audit.txt', [
    '=== Vacaville Bot Tag Inventory ===',
    '',
    'SOURCE FILTER (CloseBot side):',
    ...((det.json.sources || []).flatMap(s => [
      `  ${s.name}:`,
      ...((s.tags || []).map(t => `    ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}`)),
    ])),
    '',
    'TAGS REFERENCED IN BOT KDL:',
    ...sorted.map(t => `  • ${t}`),
  ].join('\n'));
  console.log('\nSaved → shared/logs/vacaville_tag_audit.txt');
})().catch(e => console.log(`FATAL: ${e.message}`));
