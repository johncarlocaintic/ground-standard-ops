import { readFileSync, writeFileSync } from 'fs';

const templatePath = 'shared/sops/closebot-bot-build/vacaville-bot-template.kdl';
const outputPath = 'clients/ground-standard/closebot/masondixon-bot-raw.kdl';

// Mason Dixon has TWO adult calendars (BJJ + Striking).
// Flow: whatever pointed to adult booking node → DisciplineAsk (new) → AISwitch → BJJ or Striking booking
// HANDLE_REWIRE redirects whatever pointed to the adult booking → the discipline ask node.
// Each discipline ask node routes to its AISwitch, which routes to BJJ or Striking booking.

const ADULT_BOOKING_MAP = [
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000001',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567811',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1772130327949',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000002',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567812',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1769117021187',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1772130887916',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000003',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567803',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567813',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1769117580447',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1772130327949-1772130979696',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000004',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567814',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1769117021187-1769117619078',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1776086079155',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000005',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567805',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567815',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1776093702913',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1776086079155-1776093878176',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000006',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567806',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567816',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1776093702913-1776093878176',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1776086079155-1776093878176-1776094144882',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000007',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567807',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567817',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1776093702913-1776093878176-1776094144882',
    },
    {
        bjjId: '86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353-1776086079155-1776093878176-1776094144882-1776094953504',
        disciplineAskId: 'a1b2c3d4-e5f6-7890-abcd-disc00000008',
        aiSwitchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567808',
        strikingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567818',
        confirmHandle: '0cee3b69-b209-464d-9390-916c82c79931-1768853645388-1776093702913-1776093878176-1776094144882-1776094953504',
    },
];

// Nodes to remove entirely
const REMOVE_NODE_IDS = new Set([
    // KIDS_10_14 bookings (Mason Dixon has no 10-14 calendar)
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543-1772130837086',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543-1772130937747',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863-1776114029688',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863-1776114029688-1776115251120',
    // Notif Statements ("Give info about 7-14 range") — no longer needed with 2-calendar routing
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee',
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee-1776168061629',
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee-1776168061629-1776168103215',
    // "Booking based on Age Range" Comparators — replaced by direct routing
    'cf5045f3-200b-46aa-8f1f-00ff87042c68',
    'cf5045f3-200b-46aa-8f1f-00ff87042c68-1776114029688',
    'cf5045f3-200b-46aa-8f1f-00ff87042c68-1776114029688-1776115251120',
]);

// Handle rewiring
const HANDLE_REWIRE = {};

// Adult bookings: anything pointing to an adult booking node → discipline ask node first
for (const entry of ADULT_BOOKING_MAP) {
    HANDLE_REWIRE[entry.bjjId] = entry.disciplineAskId;
}

// KIDS_10_14 → KIDS_7_13 (now "Kids 8-13 Martial Arts")
Object.assign(HANDLE_REWIRE, {
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b':
        '86b4a781-3d49-453d-a13b-9e40f28d4732',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1772130263179',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543-1772130837086':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1772130263179-1772130832451',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543-1772130937747':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1772130263179-1772130930267',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863-1776114029688':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863-1776114029688-1776115251120':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688-1776115251120',
    // Notif Statements → KIDS_7_13 (now KIDS_8_13) — False path of "3-5 Age Range" Comparators
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee-1776168061629-1776168103215':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196',
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee-1776168061629':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688',
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688-1776115251120',
    // "Booking based on Age Range" Comparators (in case anything points to them)
    'cf5045f3-200b-46aa-8f1f-00ff87042c68':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196',
    'cf5045f3-200b-46aa-8f1f-00ff87042c68-1776114029688':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688',
    'cf5045f3-200b-46aa-8f1f-00ff87042c68-1776114029688-1776115251120':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688-1776115251120',
});

// --- Main transform loop (remove nodes + rewire handles) ---
// Strip UTF-8 BOM if present (Windows editors add it; CloseBot importer rejects it)
let rawContent = readFileSync(templatePath, 'utf8');
if (rawContent.charCodeAt(0) === 0xFEFF) rawContent = rawContent.slice(1);
const rawLines = rawContent.split('\n');
const outputLines = [];
let skipDepth = 0;
let inSkip = false;

for (const line of rawLines) {
    if (!inSkip) {
        const nodeMatch = line.match(/^\s*\w[\w]*\s+id="([^"]+)"\s*\{/);
        if (nodeMatch && REMOVE_NODE_IDS.has(nodeMatch[1])) {
            inSkip = true;
            skipDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            continue;
        }

        // Rewire all handle references
        let out = line.replace(/handle="([^"]+)"/g, (m, id) =>
            HANDLE_REWIRE[id] ? `handle="${HANDLE_REWIRE[id]}"` : m
        );

        // Update "five kids classes" Prompt → Mason Dixon's two classes
        if (/^\s+Prompt "There are five kids classes/.test(line)) {
            const indent = (line.match(/^(\s+)/) || ['', ''])[1];
            out = `${indent}Prompt "There are two kids martial arts classes: \\"Kids 4-7 Martial Arts\\" for kids ages 4 to 7 years old, and \\"Kids 8-13 Martial Arts\\" for kids ages 8 to 13 years old.\\n"`;
        }

        outputLines.push(out);
    } else {
        skipDepth += (line.match(/\{/g) || []).length;
        skipDepth -= (line.match(/\}/g) || []).length;
        if (skipDepth <= 0) {
            inSkip = false;
            skipDepth = 0;
        }
    }
}

let result = outputLines.join('\n');

// --- Placeholder substitutions ---
result = result.replace(/\[GYM_NAME\]/g, 'Mason Dixon Jiu-Jitsu');
result = result.replace(/\[GYM_WEBSITE\]/g, 'https://masondixonjiujitsu.com');
result = result.replace(/\[CALENDAR_ADULT\]/g, 'Adult Fundamentals BJJ');
result = result.replace(/\[CALENDAR_KIDS_3_5\]/g, 'Kids 4-7 Martial Arts');
result = result.replace(/\[CALENDAR_KIDS_7_13\]/g, 'Kids 8-13 Martial Arts');

// Update adult Booking titles from generic to BJJ-specific
result = result.replace(/Title "Booking Adult No-Gi "/g, 'Title "Booking Adult BJJ"');

// Update AISwitch kids case names to match Mason Dixon age bands
result = result.replace(/CaseName "Age Range 3 to 5 years old"/g, 'CaseName "Age Range 4 to 7 years old"');
result = result.replace(/CaseName "Age range 7 to 13 years old"/g, 'CaseName "Age range 8 to 13 years old"');
result = result.replace(/CaseName "Age range 10 to 14 years old"/g, 'CaseName "Age range 8 to 13 years old"');

// Update age-based Comparator AIExpressions
result = result.replace(/AIExpression "The age range is 3 to 5 years old/g, 'AIExpression "The age range is 4 to 7 years old');
result = result.replace(/Title "3 - 5 Age Range"/g, 'Title "4 - 7 Age Range"');

// Replace conversationReason wholesale
result = result.replace(
    /^(\s+conversationReason )".*"$/m,
    `$1"You are part of the front desk team named Emma who works for Mason Dixon Jiu-Jitsu. Your goal is to help new leads learn about our martial arts programs and book a free trial class. Never quote membership pricing — redirect all pricing questions to the instructor consultation after the trial."`
);

// Replace businessInformation wholesale
result = result.replace(
    /^(\s+businessInformation )".*"$/m,
    `$1"The company name is Mason Dixon Jiu-Jitsu."`
);

// --- Append Discipline Ask + AISwitch + Striking Booking nodes for dual adult calendar routing ---
const newNodes = ADULT_BOOKING_MAP.map(entry => `
MultiObjective id="${entry.disciplineAskId}" {
    Objectives {
        _ {
            MaxAttempts "3"
            Sensitivity "75"
            SkipIfNotBlank false
            Title "Discipline Preference"
            Description "Determine whether the contact wants BJJ/Jiu-Jitsu or Muay Thai Striking"
            Prompt "Ask {{contact.first_name}} which program they are most interested in — our BJJ/Jiu-Jitsu classes or our Muay Thai Striking classes."
            id "${entry.disciplineAskId}-obj"
        }
    }
    __dynamicVariables
    Next handle="${entry.aiSwitchId}"
    __position 0 0
}
AISwitch id="${entry.aiSwitchId}" {
    UseAI true
    Title "BJJ or Striking?"
    __dynamicVariables
    Description "Is the contact interested in BJJ / grappling / no-gi jiu-jitsu or in Striking / Muay Thai"
    AiCases {
        _ {
            id "${entry.aiSwitchId}-bjj"
            CaseName "BJJ or grappling or no-gi jiu-jitsu"
        }
        _ {
            id "${entry.aiSwitchId}-striking"
            CaseName "Striking or Muay Thai or kickboxing or MMA"
        }
    }
    AiCases:0 handle="${entry.bjjId}"
    AiCases:1 handle="${entry.strikingId}"
    __position 0 0
}
Booking id="${entry.strikingId}" {
    __dynamicVariables
    CalendarName "Adult Striking"
    Title "Booking Adult Striking"
    Description "Book a free trial Muay Thai / striking class for the contact"
    FailedTag "concierge - failed booking"
    Next handle="${entry.confirmHandle}"
    __position 0 0
}`).join('\n');

result = result.trimEnd() + '\n' + newNodes + '\n';

// --- Verification ---
const remaining = [...result.matchAll(/\[CALENDAR_KIDS_3_5\]|\[CALENDAR_KIDS_7_13\]|\[CALENDAR_KIDS_10_14\]|\[CALENDAR_ADULT\]|\[GYM_NAME\]|\[GYM_WEBSITE\]|\[GYM_SPECIFIC_RULES\]/g)];
if (remaining.length > 0) {
    console.warn(`WARNING: ${remaining.length} unreplaced placeholder(s) found!`);
    remaining.forEach(m => console.warn(`  at index ${m.index}: ${m[0]}`));
} else {
    console.log('Placeholder check: clean');
}

// Strip comment lines (CloseBot importer crashes on # lines)
result = result.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');

writeFileSync(outputPath, result, 'utf8');
console.log(`Output: ${outputPath}`);
console.log(`Lines: ${result.split('\n').length}`);
console.log(`Adult Discipline Ask + AISwitch nodes injected: ${ADULT_BOOKING_MAP.length} each`);
console.log(`KIDS_10_14 nodes removed: ${[...REMOVE_NODE_IDS].filter(id => id.startsWith('fc465a07')).length}`);
