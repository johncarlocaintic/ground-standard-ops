/**
 * Apply all v3.17 audit edits to the local KDL programmatically.
 * Backs up the existing KDL before editing.
 *
 * See tasks/projects/vacaville-v3.17-audit.md for the reasoning per edit.
 * Categories:
 *   1. AIExpression trims (2 fields)
 *   2. AiDescription trim (1 field)
 *   3. Booking Description trims (11 fields)
 *   4. Confirm Statement rewrites (6 fields)
 *   5. Age-switch AISwitch Description trims (5 fields)
 *   6. ns07 Scenario + sub-flow insertion (5 new nodes)
 */
import fs from 'fs';

const KDL_PATH = 'shared/logs/vacaville_v3.kdl';
const BACKUP = 'shared/logs/vacaville_v3.kdl.pre_v3_17.bak';

let src = fs.readFileSync(KDL_PATH, 'utf8');
fs.writeFileSync(BACKUP, src);

const changes = [];
function replace(name, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    changes.push(`MISS: ${name} - old_string not found`);
    return;
  }
  src = src.replace(oldStr, newStr);
  changes.push(`OK:   ${name} (${oldStr.length} -> ${newStr.length} chars)`);
}

// ==== 1. AIExpression trims ====

replace('n15_book_this_adult_check AIExpression',
  `    AIExpression "Look at this answer from the contact about who is going to train: '{{nodes.n06_whofor_ask.result[0]}}'. Is the adult contact (the one messaging right now) planning to train themselves? Answer TRUE if the adult said the class is for them, or for both them and their kid. Answer FALSE only when the class is exclusively for a kid or kids and the adult is NOT training themselves. Default to TRUE if uncertain."`,
  `    AIExpression "The adult contact is training themselves, alone or alongside their kid(s). Reference: {{nodes.n06_whofor_ask.result[0]}}"`
);

replace('n19_has_kids_check AIExpression',
  `    AIExpression "Look at this answer from the contact about who is going to train: '{{nodes.n06_whofor_ask.result[0]}}'. Did the contact say the class is ALSO for a kid or kids (in addition to themselves)? Answer TRUE only when a kid is explicitly included. Answer FALSE when the class is for the adult alone, with no kid involvement."`,
  `    AIExpression "The contact explicitly included a kid or kids in who is training. Reference: {{nodes.n06_whofor_ask.result[0]}}"`
);

// ==== 2. AiDescription trim ====

replace('n79_write_youth_name AiDescription',
  `    AiDescription "Combine all kid/youth names collected during this conversation into a single comma-separated list. Read the values in {{kid1_name}}, {{kid2_name}}, {{kid3_name}}, {{kid4_name}}, and {{kid5_name}}. Produce a string like 'Name1, Name2, Name3' - skip any value that is blank, null, or empty. If ONLY one kid was provided, just output that single name with no comma. If NO kid names were provided, output an empty string."`,
  `    AiDescription "Comma-separated list of the non-blank values among {{kid1_name}}, {{kid2_name}}, {{kid3_name}}, {{kid4_name}}, {{kid5_name}}. Empty string if all are blank."`
);

// Note: the original AiDescription may use a unicode em dash rather than hyphen. Try that too if the above misses.
if (changes[changes.length-1].startsWith('MISS')) {
  replace('n79_write_youth_name AiDescription (em-dash variant)',
    `    AiDescription "Combine all kid/youth names collected during this conversation into a single comma-separated list. Read the values in {{kid1_name}}, {{kid2_name}}, {{kid3_name}}, {{kid4_name}}, and {{kid5_name}}. Produce a string like 'Name1, Name2, Name3' — skip any value that is blank, null, or empty. If ONLY one kid was provided, just output that single name with no comma. If NO kid names were provided, output an empty string."`,
    `    AiDescription "Comma-separated list of the non-blank values among {{kid1_name}}, {{kid2_name}}, {{kid3_name}}, {{kid4_name}}, {{kid5_name}}. Empty string if all are blank."`
  );
}

// ==== 3. Booking Description trims (11 nodes) ====
// Each Booking Description starts with its unique identity so we can anchor-match.

const bookingEdits = [
  { id: 'n16_book_adult_nogi', newDesc: 'Book a first class in the Adult No-Gi Submission Grappling program for {{contact.first_name}} {{contact.last_name}}.' },
  { id: 'n23_book_kid1_7_13',  newDesc: 'Book a first class in the Kids 7-13 Jiu-Jitsu program for {{kid1_name}}.' },
  { id: 'n24_book_kid1_adult', newDesc: 'Book a first class in the Adult No-Gi Submission Grappling program for {{kid1_name}} (age 14+). Parent remains the booking contact.' },
  { id: 'n44_book_kid2_7_13',  newDesc: 'Book a first class in the Kids 7-13 Jiu-Jitsu program for {{kid2_name}}.' },
  { id: 'n45_book_kid2_adult', newDesc: 'Book a first class in the Adult No-Gi Submission Grappling program for {{kid2_name}} (age 14+). Parent remains the booking contact.' },
  { id: 'n54_book_kid3_7_13',  newDesc: 'Book a first class in the Kids 7-13 Jiu-Jitsu program for {{kid3_name}}.' },
  { id: 'n55_book_kid3_adult', newDesc: 'Book a first class in the Adult No-Gi Submission Grappling program for {{kid3_name}} (age 14+). Parent remains the booking contact.' },
  { id: 'n65_book_kid4_713',   newDesc: 'Book a first class in the Kids 7-13 Jiu-Jitsu program for {{kid4_name}}.' },
  { id: 'n66_book_kid4_adult', newDesc: 'Book a first class in the Adult No-Gi Submission Grappling program for {{kid4_name}} (age 14+). Parent remains the booking contact.' },
  { id: 'n84_book_kid5_713',   newDesc: 'Book a first class in the Kids 7-13 Jiu-Jitsu program for {{kid5_name}}.' },
  { id: 'n85_book_kid5_adult', newDesc: 'Book a first class in the Adult No-Gi Submission Grappling program for {{kid5_name}} (age 14+). Parent remains the booking contact.' },
];

for (const e of bookingEdits) {
  // Match entire Booking block's Description line using a regex anchored to the node id
  const re = new RegExp(
    `(Booking id="${e.id}"\\s*\\{[\\s\\S]*?)\\n    Description "((?:[^"\\\\]|\\\\.)*)"`,
    'm'
  );
  const m = src.match(re);
  if (!m) { changes.push(`MISS: ${e.id} Description (regex no match)`); continue; }
  const oldLen = m[2].length;
  src = src.replace(re, `$1\n    Description "${e.newDesc}"`);
  changes.push(`OK:   ${e.id} Description (${oldLen} -> ${e.newDesc.length} chars)`);
}

// ==== 4. Confirm Statement rewrites (6 nodes) ====

const confirmEdits = [
  { id: 'n17_confirm_adult', newStmt: "Confirm {{contact.first_name}}'s first class (date, time, Adult No-Gi Submission Grappling). Remind them to wear a rashguard or fitted shirt with pocketless shorts, bring water, and arrive a few minutes early." },
  { id: 'n26_confirm_kid1', newStmt: "Confirm {{kid1_name}}'s first class (date, time, program). Remind the parent to have them wear a rashguard or fitted shirt with pocketless shorts, bring water, and arrive a few minutes early." },
  { id: 'n47_confirm_kid2', newStmt: "Confirm {{kid2_name}}'s first class (date, time, program). Remind the parent of gear (rashguard or fitted shirt, pocketless shorts) and water." },
  { id: 'n57_confirm_kid3', newStmt: "Confirm {{kid3_name}}'s first class (date, time, program). Remind the parent of gear (rashguard or fitted shirt, pocketless shorts) and water." },
  { id: 'n67_confirm_kid4', newStmt: "Confirm {{kid4_name}}'s first class (date, time, program). Remind the parent of gear (rashguard or fitted shirt, pocketless shorts) and water." },
  { id: 'n86_confirm_kid5', newStmt: "Confirm {{kid5_name}}'s first class (date, time, program). Remind the parent of gear (rashguard or fitted shirt, pocketless shorts) and water." },
];

for (const e of confirmEdits) {
  const re = new RegExp(
    `(Statement id="${e.id}"\\s*\\{[\\s\\S]*?)\\n    Statement "((?:[^"\\\\]|\\\\.)*)"`,
    'm'
  );
  const m = src.match(re);
  if (!m) { changes.push(`MISS: ${e.id} Statement (regex no match)`); continue; }
  const oldLen = m[2].length;
  src = src.replace(re, `$1\n    Statement "${e.newStmt}"`);
  changes.push(`OK:   ${e.id} Statement (${oldLen} -> ${e.newStmt.length} chars)`);
}

// ==== 5. Age-switch AISwitch Description trims (5 nodes) ====

const ageSwitchEdits = [
  { id: 'n21_kid1_age_switch', dob: 'kid1_dob' },
  { id: 'n42_kid2_age_switch', dob: 'kid2_dob' },
  { id: 'n52_kid3_age_switch', dob: 'kid3_dob' },
  { id: 'n64_kid4_age_switch', dob: 'kid4_dob' },
  { id: 'n83_kid5_age_switch', dob: 'kid5_dob' },
];

for (const e of ageSwitchEdits) {
  const re = new RegExp(
    `(AISwitch id="${e.id}"[\\s\\S]*?)\\n    Description "((?:[^"\\\\]|\\\\.)*)"`,
    'm'
  );
  const m = src.match(re);
  if (!m) { changes.push(`MISS: ${e.id} Description (regex no match)`); continue; }
  const oldLen = m[2].length;
  const newDesc = `Route by age. Reference: {{${e.dob}}}`;
  src = src.replace(re, `$1\n    Description "${newDesc}"`);
  changes.push(`OK:   ${e.id} Description (${oldLen} -> ${newDesc.length} chars)`);
}

// ==== 6. ns07 Scenario + sub-flow nodes ====
// Insert after the existing ns06_knowledge_gap scenarios (before ns04 or after last scenario)
// Best: append after ns05_info_pressure_handoff's End node (nd05_handoff_stop).

const ns07Block = `
ScenarioCustom id="ns07_booking_failure_handoff" {
    AllowReEntry ""
    Priority 80
    Threshold 6
    Title "Booking Failure Handoff"
    Description "The contact's tag list {{contact.tags}} contains 'concierge - failed booking'. This tag is applied automatically by the native CloseBot booking engine when a Booking node's calendar tool could not secure a slot. The contact currently has no confirmed first-class booking and needs a team member to follow up and schedule them manually."
    Next handle="nd07_booking_failure_tag"
    __position -3200.0 2100.0
    __zIndex 1
}
ModifyTags id="nd07_booking_failure_tag" {
    Title "Tag: concierge - booking handoff"
    TagsToAdd {
        _ {
            id "tag_booking_handoff"
            Tag "concierge - booking handoff"
        }
    }
    Next handle="nd07_booking_failure_msg"
    __position -2900.0 2100.0
    __zIndex 1
}
Statement id="nd07_booking_failure_msg" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Booking Failure Handoff Message"
    Statement "Let {{contact.first_name}} know warmly that we're having trouble confirming that slot on our end. Note that we've flagged it and someone from the team will reach out personally to get their first class scheduled. Two sentences max. No apology theater."
    Next handle="nd07_booking_failure_stop"
    __position -2600.0 2100.0
    __zIndex 1
}
End id="nd07_booking_failure_stop" {
    Title "Stop - Booking Failure Handoff"
    __position -2300.0 2100.0
    __zIndex 1
}
`;

// Append at end of file (before any trailing newline).
src = src.trimEnd() + '\n' + ns07Block;
changes.push(`OK:   ns07 block appended (${ns07Block.length} chars, 4 new nodes)`);

// Write result
fs.writeFileSync(KDL_PATH, src);
fs.writeFileSync('shared/logs/gs_apply_v3_17_edits.log', [
  `=== APPLY V3.17 EDITS - ${new Date().toISOString()} ===`,
  `Source: ${KDL_PATH}`,
  `Backup: ${BACKUP}`,
  `Final KDL size: ${src.length} chars`,
  '',
  ...changes,
].join('\n'));

console.log(`Applied v3.17 edits to ${KDL_PATH}`);
console.log(`Backup: ${BACKUP}`);
console.log(`\nChanges:`);
for (const c of changes) console.log('  ' + c);
const misses = changes.filter(c => c.startsWith('MISS'));
if (misses.length) { console.log(`\n${misses.length} MISSES - audit needed`); process.exit(1); }
