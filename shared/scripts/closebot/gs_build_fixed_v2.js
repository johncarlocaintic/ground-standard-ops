import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');

// Start from the v1 fixed KDL (has age-6 collapse + intermediate kid vars already)
let kdl = fs.readFileSync(path.join(logDir, 'rebuild_bot_fixed.kdl'), 'utf8');

console.log('--- Step 1: Strengthen Booking node Prompts (anti false-confirmation) ---');

// Find every Booking node and add a Prompt attribute that forces tool call
// Target: add after FailedTag, before Next — format: Prompt "..."
const bookingRegex = /(Booking id="[^"]+" \{[\s\S]*?FailedTag "[^"]*"\n)(    Next handle=)/g;
const antiPromptLine = `    Prompt "CRITICAL: You MUST invoke the book_appointment tool to actually create the appointment. Do not send a confirmation message unless the tool has returned SUCCESS. If you cannot book for any reason, say so explicitly — never claim a booking was made when it was not."\n`;
let bookingCount = 0;
kdl = kdl.replace(bookingRegex, (m, before, next) => {
  bookingCount++;
  return before + antiPromptLine + next;
});
console.log(`  added Prompt to ${bookingCount} Booking nodes`);

console.log('\n--- Step 2: Insert SetField node (comma-pack to contact.youth_name) before n80_reminders ---');

// Create the new node KDL. Insert BEFORE n80_reminders. All paths that currently route to n80_reminders
// should now route to the new SetField node, which then routes to n80_reminders.
const NEW_NODE_ID = 'n79_write_youth_name';

const setFieldNode = `SetField id="${NEW_NODE_ID}" {
    Variable "contact.youth_name"
    UseAI true
    AiDescription "Combine all kid/youth names collected during this conversation into a single comma-separated list. Read the values in {{kid1_name}}, {{kid2_name}}, and {{kid3_name}}. Produce a string like 'Name1, Name2, Name3' — skip any value that is blank, null, or empty. If ONLY one kid was provided, just output that single name with no comma. If NO kid names were provided, output an empty string."
    FieldValueExpression ""
    Next handle="n80_reminders"
    __position 7850.0 0.0
    __zIndex 1
}
`;

// Inject the new node definition. Place it right before n80_reminders definition.
const n80Pattern = /Statement id="n80_reminders"/;
kdl = kdl.replace(n80Pattern, setFieldNode + 'Statement id="n80_reminders"');

// Re-route: replace all `handle="n80_reminders"` with `handle="${NEW_NODE_ID}"` — but NOT on the new node itself (the new node still points to n80).
// Do this by first replacing ALL occurrences, then fix the new node's own reference.
const beforeReroute = (kdl.match(/handle="n80_reminders"/g) || []).length;
kdl = kdl.replace(/handle="n80_reminders"/g, `handle="${NEW_NODE_ID}"`);
// The new node's Next handle should go to n80_reminders. Restore.
kdl = kdl.replace(`Next handle="${NEW_NODE_ID}"\n    __position 7850.0 0.0`, `Next handle="n80_reminders"\n    __position 7850.0 0.0`);
const afterReroute = (kdl.match(new RegExp(`handle="${NEW_NODE_ID}"`, 'g')) || []).length;
console.log(`  rerouted ${beforeReroute} handle references → ${afterReroute} now point to new SetField node (1 of them being the new node's own Next reset back to n80)`);

// Sanity: one handle should still point to n80_reminders (from the new SetField node)
const finalN80Refs = (kdl.match(/handle="n80_reminders"/g) || []).length;
console.log(`  remaining handle="n80_reminders" references: ${finalN80Refs} (expect 1, from the new SetField node)`);

// Save and import
fs.writeFileSync(path.join(logDir, 'rebuild_bot_fixed_v2.kdl'), kdl);
console.log(`\nKDL v2 saved → shared/logs/rebuild_bot_fixed_v2.kdl (${kdl.length} chars)`);

const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const botName = `Vacaville v2 FIXED v2 (titles+write+anti-falseconfirm ${new Date().toISOString().slice(0,19)})`;
console.log(`\n--- Importing as: ${botName} ---`);
const createRes = await fetch('https://api.closebot.com/bot', {
  method: 'POST', headers: H,
  body: JSON.stringify({ name: botName, importKdl: kdl }),
});
const createText = await createRes.text();
let createJson; try { createJson = JSON.parse(createText); } catch { createJson = { raw: createText.slice(0, 400) }; }
console.log(`  → ${createRes.status}`);
if (!createRes.ok) {
  console.log('  FAIL:', JSON.stringify(createJson).slice(0, 600));
  process.exit(1);
}
const newBotId = createJson?.id || createJson?.bot?.id;
console.log(`  new bot: ${newBotId}`);

const pub = await fetch(`https://api.closebot.com/bot/${newBotId}/publish`, { method: 'POST', headers: H, body: '{}' });
console.log(`  publish → ${pub.status}`);

const attach = await fetch(`https://api.closebot.com/bot/${newBotId}/source/src_4R4DUIQTMMX2NFPU`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ tags: [{ name: 'concierge', approveDeny: true, id: 'concierge' }], channels: [], enabled: true }),
});
console.log(`  attach GS Ads → ${attach.status}`);

const state = JSON.parse(fs.readFileSync(path.join(logDir, 'sim_test_contacts.json'), 'utf8'));
state.fixedBotV2Id = newBotId;
fs.writeFileSync(path.join(logDir, 'sim_test_contacts.json'), JSON.stringify(state, null, 2));
console.log(`\n✅ Fixed v2 bot ready: ${newBotId}`);
