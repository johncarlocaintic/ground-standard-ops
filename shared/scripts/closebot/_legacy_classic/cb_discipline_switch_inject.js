// cb_discipline_switch_inject.js
// Injects an N-way adult-discipline AISwitch + (N-1) Booking clones before each
// adult Booking node in the Vacaville classic template.
//
// Usage:
//   node cb_discipline_switch_inject.js <input.kdl> <output.kdl> [spec.json]
//
// - With a spec.json: N-way, spec-driven. spec.calendars.adult[0] (default=true)
//   is the AISwitch case-0 target (the existing template Booking node, already
//   substituted to that calendar). Each remaining spec.calendars.adult[i] gets a
//   cloned Booking node + its own AISwitch case.
// - Without a spec.json: backward-compatible 2-way Gracie Farmington Valley
//   behavior (BJJ default vs Cardio Kickboxing).
//
// For each of the 8 adult Booking node instances (main + 7 multi-enrollee):
//   1. Predecessor Next handle is repointed to a new AISwitch node.
//   2. AISwitch case 0 -> original Booking (default discipline).
//   3. AISwitch cases 1..N-1 -> cloned Booking nodes (alternate disciplines),
//      same Description + downstream Next handle, scope-guard suffix preserved.

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const input = process.argv[2];
const output = process.argv[3];
const specPath = process.argv[4]; // optional

if (!input || !output) {
    console.error('Usage: node cb_discipline_switch_inject.js <input.kdl> <output.kdl> [spec.json]');
    process.exit(1);
}

// Resolve discipline set: spec-driven (N-way) or hardcoded fallback (2-way GFV).
let DEFAULT_CAL, ALTERNATES;
if (specPath) {
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));
    const adult = spec.calendars && spec.calendars.adult;
    if (!Array.isArray(adult) || adult.length < 2) {
        console.error('Spec.calendars.adult must have >=2 entries for a discipline switch. Aborting.');
        process.exit(1);
    }
    const def = adult.find(a => a.default) || adult[0];
    DEFAULT_CAL = def.calendarName;
    ALTERNATES = adult.filter(a => a !== def).map(a => ({
        cal: a.calendarName,
        program: a.program || a.calendarName,
    }));
} else {
    DEFAULT_CAL = 'Adult Fundamentals BJJ';
    ALTERNATES = [{ cal: 'Adult All Levels Cardio Kickboxing', program: 'kickboxing' }];
}

const N = ALTERNATES.length + 1;

let kdl = readFileSync(input, 'utf8');

// --- Parse the 8 adult Booking nodes (Vacaville template fixed ID prefix) ---
const ADULT_PREFIX_RE = /^Booking id="(86b4a781-3d49-453d-a13b-9e40f28d4732-1768850028015-1768850217038-1768850273031-1768850902353[^"]*)" \{/;
const lines = kdl.split('\n');
const adultBookings = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const openMatch = line.match(ADULT_PREFIX_RE);
    if (!openMatch) continue;

    const id = openMatch[1];
    let desc = '';
    let downstream = '';

    for (let j = i + 1; j < lines.length; j++) {
        const bodyLine = lines[j].replace(/\r$/, '');
        if (bodyLine.trim() === '}') break;
        const dm = bodyLine.match(/^\s+Description "(.+)"$/);
        if (dm) desc = dm[1];
        const nm = bodyLine.match(/^\s+Next handle="([^"]+)"/);
        if (nm) downstream = nm[1];
    }
    adultBookings.push({ id, desc, downstream });
}

if (adultBookings.length !== 8) {
    console.error(`Expected 8 adult Booking nodes, found ${adultBookings.length}. Aborting.`);
    process.exit(1);
}

adultBookings.sort((a, b) => a.id.length - b.id.length);

console.log(`Discipline switch: ${N}-way`);
console.log(`  default (case 0): ${DEFAULT_CAL}`);
ALTERNATES.forEach((a, i) => console.log(`  case ${i + 1}: ${a.cal} [${a.program}]`));
console.log(`Found ${adultBookings.length} adult Booking nodes.\n`);

// --- Inject ---
const appendNodes = [];

for (let i = 0; i < adultBookings.length; i++) {
    const { id, desc, downstream } = adultBookings[i];
    const idx = i + 1;
    const ts = Date.now() + idx * 100;
    const switchId = `${randomUUID()}-${ts}`;

    // Repoint predecessor(s). Closing quote prevents matching a longer sibling id.
    const oldHandle = `Next handle="${id}"`;
    const newHandle = `Next handle="${switchId}"`;
    const hits = kdl.split(oldHandle).length - 1;
    kdl = kdl.split(oldHandle).join(newHandle);
    if (hits === 0) {
        console.warn(`  [WARN] no predecessor handle for booking ${idx}: ${id}`);
    } else {
        console.log(`  Booking ${idx}: patched ${hits} predecessor handle(s) -> switch ${switchId.slice(-12)}`);
    }

    // Build the N alternate Booking clones for this instance.
    const altIds = ALTERNATES.map(() => `${randomUUID()}-${ts + Math.floor(Math.random() * 9000 + 100)}`);

    // AiCases block: case 0 = default discipline, cases 1..N-1 = alternates.
    const caseEntries = [];
    caseEntries.push(`        _ {
            id "${randomUUID()}"
            CaseName "${escapeKdl(DEFAULT_CAL)} - default when no specific discipline is requested"
        }`);
    ALTERNATES.forEach(a => {
        caseEntries.push(`        _ {
            id "${randomUUID()}"
            CaseName "${escapeKdl(a.cal)} - only when the adult explicitly asks for ${escapeKdl(disciplineKeywords(a))}"
        }`);
    });

    const handleLines = [`    AiCases:0 handle="${id}"`];
    altIds.forEach((aid, k) => handleLines.push(`    AiCases:${k + 1} handle="${aid}"`));

    const aiSwitch = `AISwitch id="${switchId}" {
    UseAI true
    Title "Adult Discipline Switch"
    __dynamicVariables
    Description "Route the adult to the discipline they asked for. Default to ${escapeKdl(DEFAULT_CAL)} if they have no preference or did not name a specific discipline. Only pick an alternate discipline when the adult explicitly named it."
    AiCases {
${caseEntries.join('\n')}
    }
${handleLines.join('\n')}
    __position 0.0 0.0
}`;
    appendNodes.push(aiSwitch);

    // Clone a Booking node per alternate discipline (same desc + downstream).
    ALTERNATES.forEach((a, k) => {
        appendNodes.push(`Booking id="${altIds[k]}" {
    __dynamicVariables
    CalendarName "${escapeKdl(a.cal)}"
    Title "Booking ${escapeKdl(a.cal)}"
    Description "${desc}"
    FailedTag "concierge - failed booking"
    Next handle="${downstream}"
    __position 100.0 ${k * 60}.0
}`);
    });
}

const final = kdl.trimEnd() + '\n' + appendNodes.join('\n') + '\n';
writeFileSync(output, final, 'utf8');

console.log(`\nDiscipline switch injection complete (${N}-way).`);
console.log(`New nodes appended: ${appendNodes.length} (${adultBookings.length} AISwitch + ${adultBookings.length * ALTERNATES.length} Booking clones)`);
console.log(`Output: ${output}`);

// --- helpers ---
function escapeKdl(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function disciplineKeywords(a) {
    // Human routing hint from program/calendar so the AISwitch has clear signal.
    const p = (a.program || '').toLowerCase();
    if (p.includes('nogi') || p.includes('no-gi')) return 'no-gi or no-gi BJJ / no-gi grappling';
    if (p.includes('muay') || p.includes('kick')) return 'Muay Thai, kickboxing, or striking';
    if (p.includes('wrestl')) return 'wrestling';
    if (p.includes('condition') || p.includes('kettle')) return 'kettlebell or conditioning';
    if (p.includes('bjj') || p.includes('jiu')) return 'that specific BJJ format';
    return a.cal;
}
