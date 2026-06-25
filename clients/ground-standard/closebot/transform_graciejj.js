import { readFileSync, writeFileSync } from 'fs';

const templatePath = 'shared/sops/closebot-bot-build/vacaville-bot-template.kdl';
const outputPath = 'clients/ground-standard/closebot/graciejj-sanjose-bot-raw.kdl';

// All node blocks to remove entirely (Booking 3-5, Booking 10-14, AISwitch age routing, Comparators, Notif Statements)
const REMOVE_NODE_IDS = new Set([
    // KIDS_3_5 Bookings
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878',
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878-1772130255682',
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878-1772130255682-1772130828366',
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878-1772130255682-1772130922830',
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878-1775851932765',
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878-1775851932765-1776114029688',
    '86b4a781-3d49-453d-a13b-9e40f28d4732-1768849927878-1775851932765-1776114029688-1776115251120',
    // KIDS_10_14 Bookings
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543-1772130837086',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1772130268543-1772130937747',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863-1776114029688',
    'fc465a07-0b03-40c0-bf2e-0cd3f282b80b-1775851940863-1776114029688-1776115251120',
    // AISwitch "Types of Kids Classes" (all 4 path instances)
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc',
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc-1772130245577',
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc-1772130245577-1772130816944',
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc-1772130245577-1772130913049',
    // Comparator "3-5 Age Range" (multi-enrollee kids path)
    '7a19a86c-823e-4c12-968d-e520536a65c3',
    '7a19a86c-823e-4c12-968d-e520536a65c3-1776114029688',
    '7a19a86c-823e-4c12-968d-e520536a65c3-1776114029688-1776115251120',
    // Comparator "Booking based on Age Range" (7-14 router, multi-enrollee)
    'cf5045f3-200b-46aa-8f1f-00ff87042c68',
    'cf5045f3-200b-46aa-8f1f-00ff87042c68-1776114029688',
    'cf5045f3-200b-46aa-8f1f-00ff87042c68-1776114029688-1776115251120',
    // Statement "Notif" (passthrough before age comparator)
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee',
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee-1776168061629',
    '44abf063-fba4-45de-bbfe-fa1f3ca365ee-1776168061629-1776168103215',
]);

// When a handle points to a removed node, rewire it to the Kids 7-13 target for that path
const HANDLE_REWIRE = {
    // Kids Classes 1 MultiObjective was → AISwitch; now → Kids 7-13 main booking
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc':
        '86b4a781-3d49-453d-a13b-9e40f28d4732',
    // Get Phone (kids-only multi-enrollee 2.1) was → AISwitch #2; now → Kids 7-13 booking #2
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc-1772130245577':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1772130263179',
    // Kids Classes 2 was → AISwitch #3; now → Kids 7-13 booking #3
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc-1772130245577-1772130816944':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1772130263179-1772130832451',
    // Kids Classes 3 was → AISwitch #4; now → Kids 7-13 booking #4
    '44682e4d-95b3-4ee6-844a-39a09f00bdfc-1772130245577-1772130913049':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1772130263179-1772130930267',
    // Booking Confirm 1 was → 3-5 Comparator; now → Kids 7-13 booking (multi-enrollee kid 1)
    '7a19a86c-823e-4c12-968d-e520536a65c3':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196',
    // Booking Confirm 3.1 was → 3-5 Comparator; now → Kids 7-13 booking (multi-enrollee kid 3.1)
    '7a19a86c-823e-4c12-968d-e520536a65c3-1776114029688':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688',
    // Booking Confirm 3.2 was → 3-5 Comparator; now → Kids 7-13 booking (multi-enrollee kid 3.2)
    '7a19a86c-823e-4c12-968d-e520536a65c3-1776114029688-1776115251120':
        '86b4a781-3d49-453d-a13b-9e40f28d4732-1775851936196-1776114029688-1776115251120',
};

// Strip UTF-8 BOM if present (CloseBot importer rejects it)
let rawContent = readFileSync(templatePath, 'utf8');
if (rawContent.charCodeAt(0) === 0xFEFF) rawContent = rawContent.slice(1);
const rawLines = rawContent.split('\n');
const outputLines = [];
let skipDepth = 0;
let inSkip = false;

for (const line of rawLines) {
    if (!inSkip) {
        // Detect start of a node block we want to remove
        const nodeMatch = line.match(/^\s*\w[\w]*\s+id="([^"]+)"\s*\{/);
        if (nodeMatch && REMOVE_NODE_IDS.has(nodeMatch[1])) {
            inSkip = true;
            skipDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            continue;
        }

        // Rewire all handle references on this line
        let out = line.replace(/handle="([^"]+)"/g, (m, id) =>
            HANDLE_REWIRE[id] ? `handle="${HANDLE_REWIRE[id]}"` : m
        );

        // Update Vacaville-specific kids class ExtraPrompts
        if (/^\s+Prompt "There are five kids classes/.test(line)) {
            const indent = (line.match(/^(\s+)/) || ['', ''])[1];
            out = `${indent}Prompt "There is one kids BJJ class available: \\"Kids 7-13 BJJ\\" for kids ages 7 to 13 years old."`;
        }

        outputLines.push(out);
    } else {
        // Track brace depth until the removed block closes
        skipDepth += (line.match(/\{/g) || []).length;
        skipDepth -= (line.match(/\}/g) || []).length;
        if (skipDepth <= 0) {
            inSkip = false;
            skipDepth = 0;
        }
    }
}

let result = outputLines.join('\n');

// --- Simple placeholder substitutions ---
result = result.replace(/\[GYM_NAME\]/g, 'Gracie Jiu Jitsu East San Jose');
result = result.replace(/\[GYM_WEBSITE\]/g, 'https://www.gjjsanjose.com');
result = result.replace(/\[CALENDAR_ADULT\]/g, 'Adult Gracie Combatives');
result = result.replace(/\[CALENDAR_KIDS_7_13\]/g, 'Kids 7-13 BJJ');

// --- Replace conversationReason value in __CONFIG__ block ---
// Target the specific line that starts with whitespace + conversationReason
result = result.replace(
    /^(\s+conversationReason )".*"$/m,
    `$1"You are part of the front desk team named Emma who works for Gracie Jiu Jitsu East San Jose. Your goal is to help new leads learn about our Gracie Jiu Jitsu programs and book a free trial class. Never quote membership pricing — redirect all pricing questions to the instructor consultation after the trial."`
);

// --- Replace businessInformation value in __CONFIG__ block ---
result = result.replace(
    /^(\s+businessInformation )".*"$/m,
    `$1"The company name is Gracie Jiu Jitsu East San Jose."`
);

// Verify no [PLACEHOLDER] strings remain (except comments)
const placeholders = [...result.matchAll(/\[CALENDAR_KIDS_3_5\]|\[CALENDAR_KIDS_10_14\]|\[GYM_SPECIFIC_RULES\]/g)];
if (placeholders.length > 0) {
    console.warn(`WARNING: ${placeholders.length} unreplaced placeholder(s) found!`);
    placeholders.forEach(m => console.warn(`  at index ${m.index}: ${m[0]}`));
} else {
    console.log('Placeholder check: clean');
}

// Strip comment lines (CloseBot importer crashes on # lines)
result = result.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');

writeFileSync(outputPath, result, 'utf8');
console.log(`Output: ${outputPath}`);
console.log(`Lines: ${result.split('\n').length}`);
