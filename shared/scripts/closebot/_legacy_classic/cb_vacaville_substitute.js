/**
 * cb_vacaville_substitute.js — canon /closebot-build Phase 2 substitution.
 * Adapts the Vacaville classic template to a gym spec by exact string
 * substitution. No regex on structure; calendar/gym tokens only.
 *
 * Usage:
 *   node shared/scripts/closebot/cb_vacaville_substitute.js \
 *     shared/sops/closebot-bot-build/vacaville-bot-template.kdl \
 *     clients/ground-standard/closebot/allinjujitsu-bot-spec.json \
 *     clients/ground-standard/closebot/allinjujitsu-bot-raw.kdl
 */
import { readFileSync, writeFileSync } from 'fs';

const [tplPath, specPath, outPath] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
let kdl = readFileSync(tplPath, 'utf8');

// 1. Drop the comment header — keep from the first __CONFIG__ line on.
const cfgIdx = kdl.indexOf('__CONFIG__ {');
if (cfgIdx === -1) { console.error('FATAL: __CONFIG__ not found'); process.exit(1); }
kdl = kdl.slice(cfgIdx);

// KDL string-escape: backslash, double-quote. Spec values may contain real
// newlines — keep them literal inside the quoted KDL value (template uses \n
// escape sequences as literal text, but a verbatim spec string is single-line).
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');

// 2. KEEP the template's NATIVE conversationReason / businessInformation.
//    Do NOT wholesale-replace with spec.gym.conversationReason — that value is
//    authored for the lean Agent-Node bot and, dropped into the classic flow,
//    makes the LLM treat booking as its own conversational job instead of
//    routing into the Booking node (root cause of the v2.0 false-closure,
//    audited 2026-05-18). The classic template's native conversationReason +
//    flow graph enforce the Booking-node handoff. Substitute only the gym
//    tokens it was designed for: [GYM_NAME] [GYM_WEBSITE] [GYM_SPECIFIC_RULES].

// Build a compact [GYM_SPECIFIC_RULES] string from spec.gym.rules (kept tight —
// it embeds inside the classic conversationReason which has a char budget).
const rules = (spec.gym.rules || [])
  .filter(r => !/never identify as ai|free .*class for|single discipline.*no discipline confirmation/i.test(r))
  .map(r => '- ' + r.replace(/\s+/g, ' ').trim())
  .join('\\n');
const gymRules = rules ? `Hard rules:\\n${rules}` : '';

// 3a. Kids-band mapping. Template has 3 youth bands (slots, youngest→oldest):
//   KIDS_3_5 (slot0) | KIDS_7_13 (slot1) | KIDS_10_14 (slot2)
// routed by an AISwitch with 3 consistent CaseName strings, replicated across
// every flow branch. Map the gym's kids calendars (sorted by ageMin) onto the
// slots. <3 kids → the extra slot(s) duplicate-route to the OLDEST kids
// calendar (no node deletion → zero orphan risk). Retitle each band's
// CaseName to the real age range so the AI routes correctly.
const kidsSorted = [...spec.calendars.kids].sort((a, b) => (a.ageMin || 0) - (b.ageMin || 0));
const pick = i => kidsSorted[Math.min(i, kidsSorted.length - 1)]; // <3 → clamp to oldest
const slot = [pick(0), pick(1), pick(2)];
const caseName = c => `Ages ${c.ageMin} to ${c.ageMax} years old`;
// Distinct CaseNames per slot; if a slot duplicates an older one, append a
// disambiguator so the AISwitch still has 3 syntactically-distinct cases
// (CloseBot requires unique case strings) all routing to the correct calendar.
const seenCase = new Set();
const uniqCase = c => { let n = caseName(c); while (seenCase.has(n)) n += ' '; seenCase.add(n); return n; };

const adult = spec.calendars.adult[0].calendarName;
const subs = [
  ['[GYM_NAME]', spec.gym.name],
  ['[GYM_WEBSITE]', spec.gym.website],
  ['[GYM_SPECIFIC_RULES]', gymRules],
  ['[CALENDAR_ADULT]', adult],
  ['[CALENDAR_KIDS_3_5]', slot[0].calendarName],
  ['[CALENDAR_KIDS_7_13]', slot[1].calendarName],
  ['[CALENDAR_KIDS_10_14]', slot[2].calendarName],
  // AISwitch CaseName retitling (template strings → real age ranges)
  ['Age Range 3 to 5 years old', uniqCase(slot[0])],
  ['Age range 7 to 13 years old', uniqCase(slot[1])],
  ['Age range 10 to 14 years old', uniqCase(slot[2])],
  // Booking Description age-range normalization (lowercase, inside Description).
  // Vacaville hardcodes "age range 3 to 5 years old" / "7 to 13" / "10 to 14"
  // inside some Booking Descriptions, mainly the multi-enrollee path. For
  // single-kids-cal gyms (Bodega) these stale ranges contradict the calendar
  // and removed the only scope guard the AI had — root cause of multi-enrollee
  // parent-on-kid-cal mis-route, audited 2026-05-18.
  ['age range 3 to 5 years old', `ages ${slot[0].ageMin} to ${slot[0].ageMax}`],
  ['age range 7 to 13 years old', `ages ${slot[1].ageMin} to ${slot[1].ageMax}`],
  ['age range 10 to 14 years old', `ages ${slot[2].ageMin} to ${slot[2].ageMax}`],
];
for (const [tok, val] of subs) kdl = kdl.split(tok).join(val);

// 3c. Multi-enrollee scope guard — append a one-line constraint to every
//     Booking Description so the AI's 15 tool iterations cannot greedily book
//     a second enrollee on the same node's hard-bound calendar. Without this,
//     when a single-kids-cal gym hits an adult+kid lead, the kid Booking
//     books BOTH on the kid calendar (audit 2026-05-18, act_S3Y... on
//     bot_ENNVPB9HV6R8TOPN). The downstream Adult Booking then no-ops.
//     Idempotent: skips Descriptions already carrying the marker.
const SCOPE_GUARD = '. Book one trial only - additional enrollees are handled in a separate step';
kdl = kdl.replace(
  /(^[ \t]+Description ")(Book a free trial class for [^"]+?)(\s*)(")/gm,
  (m, pre, desc, trail, post) => desc.includes('Book one trial only') ? m : pre + desc + SCOPE_GUARD + trail + post
);

writeFileSync(outPath, kdl, 'utf8');

// 4. Verify no build tokens remain.
const leftover = kdl.match(/\[(GYM_[A-Z_]*|CALENDAR_[A-Z0-9_]*|PERSONA_NAME|PLACEHOLDER)\]/g);
console.log('Wrote', outPath, '| bytes', kdl.length);
console.log('Adult cal:', adult);
console.log('Kids bands:', slot.map((c, i) => `slot${i}=${c.calendarName}(${c.ageMin}-${c.ageMax})`).join(' | '));
console.log('Leftover build tokens:', leftover ? [...new Set(leftover)].join(',') : 'NONE ✅');
if (leftover) process.exit(2);
