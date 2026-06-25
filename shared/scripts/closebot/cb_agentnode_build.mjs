/**
 * cb_agentnode_build.mjs — Agent Node scaffold-and-fill builder.
 * NOT a substitution engine. Deterministically fills the 4 mechanical tokens
 * (CONFIG x3 + signup scenario). For the 2 prose regions it writes a
 * spec-derived DRAFT wrapped in <<<REVIEW>>> markers and emits a worksheet —
 * the skill operator MUST hand-author/review those two regions per the
 * worksheet before the bot is considered built (this is the "semi-hand-
 * authored" guarantee; blind substitution here is what caused the classic
 * false-closure bugs).
 *
 * Usage:
 *   node shared/scripts/closebot/cb_agentnode_build.mjs <specPath> <outKdl> <outWorksheet>
 */
import { readFileSync, writeFileSync } from 'fs';
import { classifyKdl } from './cb_assert_agentnode.mjs';

const [specPath, outKdl, outWs] = process.argv.slice(2);
if (!specPath || !outKdl || !outWs) {
  console.error('usage: cb_agentnode_build.mjs <specPath> <outKdl> <outWorksheet>'); process.exit(2);
}
const TPL = 'D:/CLAUDE/Work/shared/sops/closebot-bot-build/agentnode-base-template.kdl';
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
let kdl = readFileSync(TPL, 'utf8');

// KDL string escape: real newlines -> \n, double-quote -> \"
const esc = s => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');

const adult = Array.isArray(spec.calendars?.adult) ? spec.calendars.adult
  : (spec.calendars?.adult ? [{ calendarName: spec.calendars.adult }] : []);
const kids = Array.isArray(spec.calendars?.kids) ? spec.calendars.kids : [];
const nonBook = spec.nonBookablePrograms || [];
const ageRouting = spec.flow?.ageRouting || {};
const discSwitch = !!spec.flow?.requiresDisciplineSwitch;

// ---- DETERMINISTIC tokens ----
kdl = kdl.replace('[CONVERSATION_REASON]', esc(spec.gym.conversationReason));
kdl = kdl.replace('[BUSINESS_INFORMATION]', esc(spec.gym.businessInformation));
// prohibitedWords: empty by default; only emit if spec carries explicit ones
const pw = (spec.gym?.prohibitedWords || []).join(' ');
kdl = kdl.replace('[PROHIBITED_WORDS]', pw ? esc(pw) : '');
kdl = kdl.replace('[SIGNUP_SCENARIO_DESCRIPTION]', esc(spec.scenarios?.[0]?.description
  || 'Contact shows interest in signing up and is giving information like date of birth or name of applicant'));

// ---- DRAFT: Push Toward Booking (semi-hand-authored) ----
const disciplineLine = discSwitch
  ? `We offer multiple disciplines: ${adult.map(a => a.program || a.calendarName).join(', ')}. Ask which the lead wants; if none stated, default to the primary/intro discipline.`
  : `We offer one discipline. Ask: 'And just to set you up right — is this class for yourself, your child, or both?'`;
const nonBookLine = nonBook.length
  ? `IMPORTANT — programs we do NOT book online: ${nonBook.join('; ')}. ${spec.nonBookableHandling || "If a lead asks to book one of those, say plainly it isn't available to book online — new students start with a free trial in our bookable class. Do not offer a coach discussion, do not route to a different class — steer back to a free trial."}`
  : `Only the bookable trial calendars below may be offered. Do not invent or offer any other program.`;
const pushDraft =
  `<<<REVIEW: hand-author per worksheet — verify against spec.gym.rules + spec.nonBookablePrograms>>> ` +
  `The goal of this node is to see if the contact has interest in getting a class. ${disciplineLine}\\n\\n` +
  `${nonBookLine}\\n\\n` +
  `When the contact confirms they want to sign up for THEMSELVES (alone or with a child), exit with @@@[Interested]. ` +
  `When the contact confirms they want to sign up a CHILD ONLY and they are the parent or guardian doing so, exit with @@@[Parent for Child]. ` +
  `DO NOT DISCUSS BOOKING, AVAILABLE SLOTS, OR CAPTURE CONTACT INFORMATION IN THIS NODE.`;
kdl = kdl.replace('[PUSH_TOWARD_BOOKING_BODY]', esc(pushDraft).replace(/\\\\n/g, '\\n'));

// ---- DRAFT: Booking routing (semi-hand-authored, fills BOTH places) ----
const adultLines = adult.map(a => `- ${a.calendarName}${a.program ? ` (${a.program})` : ''}${a.ageMin ? ` — ages ${a.ageMin}+` : ''}`).join('\\n');
const kidLines = kids.map(k => `age ${k.ageMin}-${k.ageMax} → "${k.calendarName}"`).join('; ');
const routeExtra = Object.entries(ageRouting)
  .filter(([band]) => !/^1[89]|^[2-9][0-9]|adult/i.test(band))
  .map(([band, beh]) => `- Age band ${band}: ${beh}`).join('\\n');
const bookDraft =
  `<<<REVIEW: hand-author per worksheet — validate EVERY line against spec.flow.ageRouting + spec.calendars; this region's blind substitution caused the classic false-closures>>> ` +
  `Use the program preference and enrollment type from conversation context to determine the correct calendar.\\n\\n` +
  `ADULTS:\\n${adultLines || '- (none — define from spec.calendars.adult)'}\\n\\n` +
  `YOUTH — MANDATORY STEP ORDER:\\n` +
  `1. Compute the child's age in years from {{contact.youth_birthday}} as of today. Do this explicitly. Do NOT infer age/age-group from earlier conversation.\\n` +
  `2. Select the calendar STRICTLY by that computed age: ${kidLines || '(define from spec.calendars.kids)'}.\\n` +
  `3. Never pick a calendar whose age range does not contain the computed age.\\n` +
  `${routeExtra ? routeExtra + '\\n' : ''}` +
  `\\nNever route anyone into a calendar that does not match their age. Never substitute a different program's calendar.\\n\\n` +
  `For multi-enrollee, check each calendar separately and quote specific slot pairs (e.g. "Tue: kid 5:15 PM + adult 6:30 PM"). Never describe slots vaguely as "morning"/"evening" — quote the exact tool-returned time.\\n\\n` +
  `Find open slots with @@[Check Appointment Availability]. Quote 2-3 real slots exactly as returned, let them pick. Book with @@[Book Appointments] using their EXACT slot — never substitute a different day. Pass the time exactly as returned including AM/PM; trial slots are afternoon/evening PM, never send a PM slot as AM. If SUCCESS, confirm the booked date/time. If it fails, tell them, re-check, offer 2-3 fresh options. After a second failure, @@[Update Tags] add 'alert' and hand off.\\n\\n` +
  `After all bookings succeed, @@[Update Tags] add 'booked' and confirm location from the knowledge base.`;
const bookEsc = esc(bookDraft).replace(/\\\\n/g, '\\n');
kdl = kdl.split('[BOOKING_ROUTING_BODY]').join(bookEsc); // both places (Sections Body + flat Instructions)

// ---- guard: never ship classic ----
const c = classifyKdl(kdl);
if (!c.ok) { console.error(`BUILD ABORT — output not Agent Node (agentSig=${c.agentSig}, classicNodes=${c.classicNodes})`); process.exit(1); }
if (kdl.includes('[') && /\[(CONVERSATION_REASON|BUSINESS_INFORMATION|PROHIBITED_WORDS|SIGNUP_SCENARIO_DESCRIPTION|PUSH_TOWARD_BOOKING_BODY|BOOKING_ROUTING_BODY)\]/.test(kdl)) {
  console.error('BUILD ABORT — unfilled token remains'); process.exit(1);
}

// ---- per-block __zIndex dedup (CloseBot EXPORT artifact — architecture-
// independent; the canonical template is itself an export and carries 2
// __zIndex per block. Re-import 500s on the duplicate. Strip inline so the
// builder always emits import-ready KDL — do NOT rely on a separate step). ----
{
  const lines = kdl.split('\n');
  const out = [];
  const stack = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.includes('{')) stack.push(new Set());
    if (t.startsWith('__zIndex') && stack.length) {
      const f = stack[stack.length - 1];
      if (f.has('z')) continue; // duplicate within this block — drop
      f.add('z');
    }
    out.push(line);
    if (t.includes('}') && stack.length) stack.pop();
  }
  kdl = out.join('\n');
}
writeFileSync(outKdl, kdl);

// ---- worksheet ----
const ws = `# Instruction Worksheet — ${spec.gym.name}

The build wrote spec-derived DRAFTS into the 2 prose regions of \`${outKdl}\`,
each wrapped in \`<<<REVIEW...>>>\`. You MUST hand-author/verify both, then
remove the \`<<<REVIEW...>>>\` marker, before the bot is considered built.
Authoritative sources are this gym's spec + verified KB. Do not blind-trust the draft.

## 1. n10_intro "Push Toward Booking"
Authoritative: spec.gym.rules, spec.nonBookablePrograms, spec.nonBookableHandling, discipline (requiresDisciplineSwitch=${discSwitch}).
- Discipline statement correct? ${discSwitch ? 'MULTI — confirm the disciplines + default' : 'SINGLE'}
- Non-bookable programs listed verbatim + exact deflection (no coach-redirect, no substitute calendar)?
- Exits kept verbatim: @@@[Interested] / @@@[Parent for Child]; "DO NOT DISCUSS BOOKING ... IN THIS NODE" kept?

## 2. n30_book "Booking" routing (BOTH the Sections Body and the flat Instructions — keep them identical)
Authoritative: spec.flow.ageRouting (line by line), spec.calendars (exact GHL names), spec.flow.minorGate, spec.flow.youthNoCalGate.
- Every bookable calendar present by EXACT name → correct age band?
- Every no-calendar band → no-book + exact spec behavior (team follow-up / phone referral ${ageRouting['under-min'] || ''}) + correct tag?
- "compute age as of today, do NOT infer" kept? multi-enrollee slot-pair rule kept? AM/PM guard kept? booked/alert tagging kept?

spec.flow.ageRouting for reference:
\`\`\`json
${JSON.stringify(ageRouting, null, 2)}
\`\`\`
calendars:
\`\`\`json
${JSON.stringify(spec.calendars, null, 2)}
\`\`\`
`;
writeFileSync(outWs, ws);
console.log(`OK — ${outKdl} (${kdl.length}b, agentSig=${c.agentSig}, classic=${c.classicNodes})`);
console.log(`Worksheet: ${outWs} — hand-author the 2 <<<REVIEW>>> regions before import.`);
