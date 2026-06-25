// cb_youth_nocal_gate_inject.js
// Closes the Vacaville-template architectural gap for gyms whose kids program
// caps BELOW the full 14-17 minor band — inserts a DOB-age Comparator before
// every kids-age AISwitch to catch the no-calendar age band.
//
// Usage:
//   node cb_youth_nocal_gate_inject.js <input.kdl> <output.kdl>             (default 14-17 band)
//   node cb_youth_nocal_gate_inject.js <input.kdl> <output.kdl> <spec.json> (spec-driven band)
//
// Spec-driven: reads flow.youthNoCalGate.band (e.g. "16-17") and
//   flow.calendars.kids[].ageMax to build the correct Statement/Expression.
//   Without a spec, defaults to "14-17" (original behavior — backward compatible).
//
// Pipeline order: substitute -> discipline_switch_inject -> THIS -> strip_zindex -> import

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const input = process.argv[2];
const output = process.argv[3];
const specPath = process.argv[4] || null;

if (!input || !output) {
    console.error('Usage: node cb_youth_nocal_gate_inject.js <input.kdl> <output.kdl> [spec.json]');
    process.exit(1);
}

// --- Determine no-cal band from spec or default ---
let nocalMinAge = 14;  // default: 14-17 (kids cap at 13)
let kidsMaxAge = 13;   // default: standard template

if (specPath) {
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));
    const band = spec.flow?.youthNoCalGate?.band; // e.g. "16-17"
    if (band) {
        const m = band.match(/^(\d+)/);
        if (m) nocalMinAge = parseInt(m[1], 10);
    }
    // Highest ageMax across all kids calendars
    const kidsMaxFromSpec = Math.max(
        ...((spec.calendars?.kids || []).map(k => k.ageMax || 0).filter(n => n > 0)),
        0
    );
    if (kidsMaxFromSpec > 0) kidsMaxAge = kidsMaxFromSpec;
    console.log(`Spec-driven: no-cal band starts at age ${nocalMinAge}, kids cap at ${kidsMaxAge}.`);
} else {
    console.log(`No spec provided — using default band: 14-17 (kids cap 13).`);
}

const nocalMaxAge = 17; // always gates up to (but not including) 18; adult path handles 18+
const bandLabel = `${nocalMinAge}-${nocalMaxAge}`;

// Build age list string: "16 or 17" or "14, 15, 16, or 17"
function ageListString(min, max) {
    const ages = [];
    for (let a = min; a <= max; a++) ages.push(a);
    if (ages.length === 1) return `${ages[0]}`;
    if (ages.length === 2) return `${ages[0]} or ${ages[1]}`;
    return ages.slice(0, -1).join(', ') + ', or ' + ages[ages.length - 1];
}
const ageList = ageListString(nocalMinAge, nocalMaxAge);

let kdl = readFileSync(input, 'utf8');

// Kids-age AISwitch family — main router + multi-enrollee variants.
const KIDS_AISWITCH_PREFIX = '44682e4d-95b3-4ee6-844a-39a09f00bdfc';

// Find every kids-age AISwitch node id (prefix + optional suffix).
const lines = kdl.split('\n');
const aiswitchIds = [];
for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const m = line.match(/^AISwitch id="(44682e4d-95b3-4ee6-844a-39a09f00bdfc[^"]*)" \{/);
    if (m) aiswitchIds.push(m[1]);
}

if (aiswitchIds.length === 0) {
    console.error('No kids-age AISwitch nodes found. Aborting.');
    process.exit(1);
}

// Sort shortest-first for readable logs
aiswitchIds.sort((a, b) => a.length - b.length);

console.log(`Found ${aiswitchIds.length} kids-age AISwitch node(s):`);
aiswitchIds.forEach((id, i) => console.log(`  ${i + 1}. ...${id.slice(-20)}`));
console.log('');

// One shared no-calendar Statement
const nocalStatementId = `youth-nocal-msg-${randomUUID()}`;
const nocalStatement = `Statement id="${nocalStatementId}" {
    Attachment ""
    MoveOn true
    UseAI "true"
    Title "${bandLabel} No Online Class"
    __dynamicVariables
    Statement "Let the contact know we do not have an online class to book for ages ${nocalMinAge} to ${nocalMaxAge} - our youth program ends at ${kidsMaxAge} and adult classes are 18 and over. Make sure we have a parent or guardian name, phone, and email on file, let them know our team will reach out directly to help get the teen started, and do not book any appointment."
    Next handle="EOC"
    __position 0.0 240.0
}`;

const appendNodes = [nocalStatement];

for (let i = 0; i < aiswitchIds.length; i++) {
    const aiswitchId = aiswitchIds[i];
    const idx = i + 1;
    const ts = Date.now() + idx * 100;
    const gateId = `${randomUUID()}-${ts}`;

    const oldH = `Next handle="${aiswitchId}"`;
    const newH = `Next handle="${gateId}"`;
    const hits = kdl.split(oldH).length - 1;
    kdl = kdl.split(oldH).join(newH);

    if (hits === 0) {
        console.warn(`  [WARN] no predecessor handle found for AISwitch ${idx}: ${aiswitchId}`);
    } else {
        console.log(`  AISwitch ${idx}: patched ${hits} predecessor handle(s) -> gate ${gateId.slice(-12)}`);
    }

    const gate = `Comparator id="${gateId}" {
    ExpressionOperator "GreaterThan"
    UseAI true
    __dynamicVariables
    AIExpression "The person being enrolled is aged ${ageList} years old based on their date of birth (${nocalMinAge} or older but under 18)"
    Title "Youth ${bandLabel} No-Calendar Gate"
    True handle="${nocalStatementId}"
    False handle="${aiswitchId}"
    __position 0.0 0.0
}`;

    appendNodes.push(gate);
}

const final = kdl.trimEnd() + '\n' + appendNodes.join('\n') + '\n';
writeFileSync(output, final, 'utf8');

console.log('');
console.log(`Youth ${bandLabel} no-calendar gate injection complete.`);
console.log(`New nodes appended: ${appendNodes.length} (1 Statement + ${aiswitchIds.length} Comparator gate(s))`);
console.log(`Output: ${output}`);
