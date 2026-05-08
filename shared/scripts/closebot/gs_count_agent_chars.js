// Count instruction chars per Agent Node (Section bodies + Instructions field)
import fs from 'fs';
const kdl = fs.readFileSync('shared/logs/vacaville_v5.1.kdl', 'utf8');

// Match Method blocks
const methodBlocks = [...kdl.matchAll(/Method id="([^"]+)" \{([\s\S]*?)^\}/gm)];

for (const m of methodBlocks) {
  const id = m[1];
  const body = m[2];

  // Extract all Section Body strings
  const sectionBodies = [...body.matchAll(/Body "((?:[^"\\]|\\.)*)"/g)].map(b => b[1]);
  const sectionTitles = [...body.matchAll(/Title "((?:[^"\\]|\\.)*)"/g)].map(b => b[1]);
  const instructions = (body.match(/Instructions "((?:[^"\\]|\\.)*)"/) || [])[1] || '';

  const sectionsTotal = sectionBodies.reduce((sum, b) => sum + b.length, 0);
  const total = sectionsTotal + instructions.length;

  console.log(`\n=== ${id} ===`);
  console.log(`Sections (${sectionBodies.length}): ${sectionsTotal} chars`);
  for (let i = 0; i < sectionBodies.length; i++) {
    console.log(`  - ${sectionTitles[i] || '?'} : ${sectionBodies[i].length} chars`);
  }
  console.log(`Instructions: ${instructions.length} chars`);
  console.log(`TOTAL prompt content: ${total} chars  (limit: 1000)`);
  console.log(total > 1000 ? `  ⚠ OVER LIMIT by ${total - 1000} chars` : `  ✓ within limit`);
}
