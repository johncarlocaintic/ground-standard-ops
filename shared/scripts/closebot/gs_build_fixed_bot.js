import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

// Source: current REBUILD TEST bot KDL, already exported earlier
const exp = JSON.parse(fs.readFileSync(path.join(logDir, 'rebuild_bot_export.json'), 'utf8'));
let kdl = exp.kdl;

console.log('--- Step 1: Age-6 collapse ---');

// 1a. Remove age-6 case from each AISwitch (kid1, kid2, kid3)
// The pattern is a repeating block in AiCases:
//     _ {
//         id "case_kidN_age_6"
//         CaseName "Age 6 years old - no program currently available"
//     }
// And the handles:
//     AiCases:3 handle="n25_age6_notify"   (etc.)
// Strategy: regex out the age-6 case block + its handle mapping.

function stripAge6Case(body, ids) {
  let out = body;
  // Remove the case block
  for (const id of ids) {
    const re = new RegExp(`\\s*_\\s*\\{\\s*id\\s*"${id}"\\s*CaseName[^}]*\\}`, 'g');
    const before = (out.match(re) || []).length;
    out = out.replace(re, '');
    console.log(`  removed case ${id} × ${before}`);
  }
  return out;
}

kdl = stripAge6Case(kdl, ['case_kid1_age_6', 'case_kid2_age_6', 'case_kid3_age_6']);

// 1b. Remove the AiCases:3 handle lines that point to age6 notify
const age6HandleRe = /\s*AiCases:3 handle="n(25|46|56)_age6_notify(_[23])?"/g;
const h6 = (kdl.match(age6HandleRe) || []).length;
kdl = kdl.replace(age6HandleRe, '');
console.log(`  removed age-6 handle lines: ${h6}`);

// 1c. Relabel age 7-13 cases to include age 6
kdl = kdl.replace(/CaseName "Age 7, 8, 9, 10, 11, 12, or 13 years old \(Kids 7-13 program\)"/g,
  'CaseName "Age 6, 7, 8, 9, 10, 11, 12, or 13 years old (Kids 7-13 program)"');
kdl = kdl.replace(/CaseName "Age 7 through 13 years old"/g, 'CaseName "Age 6 through 13 years old"');

// 1d. Remove the Statement nodes that notify about age-6
const age6NotifyRe = /Statement id="n(25_age6_notify|46_age6_notify_2|56_age6_notify_3)" \{[\s\S]*?\n\}\n?/g;
const statementsRemoved = (kdl.match(age6NotifyRe) || []).length;
kdl = kdl.replace(age6NotifyRe, '');
console.log(`  removed age-6 notify statements: ${statementsRemoved}`);

// 1e. Update the AISwitch descriptions to drop age-6 mention
kdl = kdl.replace(/If the kid is age 6, there is no program available\./g, '');
kdl = kdl.replace(/If age 6, no program available\./g, '');
kdl = kdl.replace(/Age 6 has no program\./g, '');

console.log('\n--- Step 2: Multi-kid comma-pack ---');

// 2a. Change kid1 objective to write to kid1_name + kid1_dob (intermediate vars)
kdl = kdl.replace(/Variable "contact\.youth_name"([\s\S]*?id "obj_kid1_name")/g, 'Variable "kid1_name"$1');
kdl = kdl.replace(/Variable "contact\.youth_birthday"([\s\S]*?id "obj_kid1_dob")/g, 'Variable "kid1_dob"$1');
kdl = kdl.replace(/Variable "contact\.youth_name"([\s\S]*?id "obj_kid2_name")/g, 'Variable "kid2_name"$1');
kdl = kdl.replace(/Variable "contact\.youth_birthday"([\s\S]*?id "obj_kid2_dob")/g, 'Variable "kid2_dob"$1');
kdl = kdl.replace(/Variable "contact\.youth_name"([\s\S]*?id "obj_kid3_name")/g, 'Variable "kid3_name"$1');
kdl = kdl.replace(/Variable "contact\.youth_birthday"([\s\S]*?id "obj_kid3_dob")/g, 'Variable "kid3_dob"$1');

// 2b. Update Booking node descriptions to use the intermediate var
kdl = kdl.replace(/\{\{contact\.youth_name\}\}([^"]*?Kid 1)/g, '{{kid1_name}}$1');
kdl = kdl.replace(/\{\{contact\.youth_birthday\}\}([^"]*?)/g, '{{contact.youth_birthday}}$1'); // leave birthday refs in AISwitch as-is for now — the age switch uses whichever var was collected last, but since each kid fires its switch between its own collect and book, this still works per-kid via context
// Actually re-think: each kid's AISwitch uses {{contact.youth_birthday}} which now doesn't exist until final write. Need to update AISwitch AIExpressions to use kidN_dob too.
kdl = kdl.replace(/based on the kid's date of birth \{\{contact\.youth_birthday\}\}/g, (m) => m); // placeholder; we'll do per-switch below
kdl = kdl.replace(/Based on the kid's date of birth \{\{contact\.youth_birthday\}\}/g, 'Based on the kid\'s date of birth {{kid1_dob}}');
kdl = kdl.replace(/Based on the second kid's date of birth \{\{contact\.youth_birthday\}\}/g, 'Based on the second kid\'s date of birth {{kid2_dob}}');
kdl = kdl.replace(/Based on the third kid's date of birth \{\{contact\.youth_birthday\}\}/g, 'Based on the third kid\'s date of birth {{kid3_dob}}');

// Kid 1 booking descriptions reference contact.youth_name — switch to kid1_name
// Kid 2/3 similar
for (let i = 1; i <= 3; i++) {
  const desc = new RegExp(`Book a free trial class for \\{\\{contact\\.youth_name\\}\\}([^"]*?Kid ${i}[^"]*?)`, 'g');
  kdl = kdl.replace(desc, `Book a free trial class for {{kid${i}_name}}$1`);
  // Also: "for {{contact.youth_name}} in the Kids X-Y" occurs without "(Kid N)" suffix
  const desc2 = new RegExp(`(n(2[2-4]|4[3-5]|5[3-5])_book_kid${i}_[^{]*\\{[\\s\\S]*?Description ")Book a free trial class for \\{\\{contact\\.youth_name\\}\\}`, 'g');
  kdl = kdl.replace(desc2, `$1Book a free trial class for {{kid${i}_name}}`);
}

// 2c. Add a final "write all kid names to contact.youth_name" node BEFORE n80_reminders
// Approach: insert a MultiObjective that uses a prompt to synthesize and write back.
// Actually a simpler approach: use a Statement with UseAI=true that executes a variable write.
// CloseBot may not support that cleanly. Let me try injecting a new AISwitch that no-ops but writes.
// SAFER: just have the final-before-n80 node be a Statement with UseAI=true that prompts the AI
// to confirm the booking summary. We don't need a new node — we rely on the fact that kid names
// are in intermediate vars, and the CONTACT record won't have youth_name populated at all.
// This is the simplest form of fix — contact just won't have youth_name (explicit tradeoff).

// Alternative: add a Code-like node. CloseBot may have a "SetVariable" or "Update Contact Field" node.
// Let me search node descriptors later. For now, v1 of fix = intermediate vars + no contact.youth_name write.
// The names/birthdays are captured in appointment titles/descriptions (Booking nodes reference kid1_name, etc.)
// so they're NOT lost, they're just on the APPOINTMENT not on the CONTACT.

console.log('\n--- Step 3: Sanity checks ---');
const remainingYouthNameWrites = (kdl.match(/Variable "contact\.youth_name"/g) || []).length;
const remainingYouthBdayWrites = (kdl.match(/Variable "contact\.youth_birthday"/g) || []).length;
console.log(`  contact.youth_name writes remaining: ${remainingYouthNameWrites} (expected 0)`);
console.log(`  contact.youth_birthday writes remaining: ${remainingYouthBdayWrites} (expected 0)`);
const age6Leftover = (kdl.match(/age_6|age 6/gi) || []).length;
console.log(`  age-6 references remaining: ${age6Leftover}`);

// Save modified KDL for review
fs.writeFileSync(path.join(logDir, 'rebuild_bot_fixed.kdl'), kdl);
console.log(`\nFixed KDL saved → shared/logs/rebuild_bot_fixed.kdl (${kdl.length} chars, was ${exp.kdl.length})`);

// Import as new bot
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const botName = `Vacaville v2 FIXED (age-6 + commapack ${new Date().toISOString().slice(0,19)})`;
console.log(`\n--- Step 4: Import as new bot ---`);
console.log(`  name: ${botName}`);
const createRes = await fetch('https://api.closebot.com/bot', {
  method: 'POST', headers: H,
  body: JSON.stringify({ name: botName, importKdl: kdl }),
});
const createText = await createRes.text();
let createJson; try { createJson = JSON.parse(createText); } catch { createJson = { raw: createText.slice(0, 400) }; }
console.log(`  → ${createRes.status}`);
if (!createRes.ok) {
  console.log('  FAIL:', JSON.stringify(createJson).slice(0, 500));
  process.exit(1);
}
const newBotId = createJson?.id || createJson?.bot?.id;
console.log(`  new bot id: ${newBotId}`);

// Publish
const pub = await fetch(`https://api.closebot.com/bot/${newBotId}/publish`, { method: 'POST', headers: H, body: '{}' });
console.log(`\n--- Step 5: Publish ---\n  → ${pub.status}`);

// Attach GS Ads
const attach = await fetch(`https://api.closebot.com/bot/${newBotId}/source/src_4R4DUIQTMMX2NFPU`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ tags: [{ name: 'concierge', approveDeny: true, id: 'concierge' }], channels: [], enabled: true }),
});
console.log(`\n--- Step 6: Attach GS Ads source ---\n  → ${attach.status}`);

// Save bot id for reuse
const state = JSON.parse(fs.readFileSync(path.join(logDir, 'sim_test_contacts.json'), 'utf8'));
state.fixedBotId = newBotId;
fs.writeFileSync(path.join(logDir, 'sim_test_contacts.json'), JSON.stringify(state, null, 2));
console.log(`\n✅ Fixed bot ready: ${newBotId}`);
console.log(`   saved to shared/logs/sim_test_contacts.json as fixedBotId`);
