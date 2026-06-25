/**
 * cb_sandbox_cal_preflight.mjs — /closebot-test Phase 2, spec-driven.
 * Ensures every bookable calendar in a gym spec (adult + kids, by exact
 * calendarName) exists in the GS Ads sandbox GHL location. Creates any
 * missing one as a round_robin phone-meeting calendar. Idempotent.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_sandbox_cal_preflight.mjs <specPath>
 *
 * Exit 0 only if ALL spec bookable calendar names are present afterwards.
 */
import { readFileSync } from 'fs';

const SPEC = process.argv[2];
if (!SPEC) { console.error('usage: cb_sandbox_cal_preflight.mjs <specPath>'); process.exit(2); }
const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const T = process.env.GHL_GS_API_TOKEN;
const LOC = 'isGl70YkeLEAiVckMhgT';
const TEAM = 'ZbB1wssFyfQtuLmcjdGb';
const H = { Authorization: 'Bearer ' + T, Version: '2021-07-28', 'Content-Type': 'application/json' };

// Collect every bookable calendar NAME from the spec (adult[] + kids[]).
const adult = Array.isArray(spec.calendars?.adult) ? spec.calendars.adult : (spec.calendars?.adult ? [{ calendarName: spec.calendars.adult }] : []);
const kids = Array.isArray(spec.calendars?.kids) ? spec.calendars.kids : [];
const want = [...new Set([...adult, ...kids].map(c => c.calendarName).filter(Boolean))];
if (!want.length) { console.error('FATAL: no bookable calendar names in spec'); process.exit(2); }

async function listNames() {
  const r = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${LOC}`, { headers: H });
  const j = await r.json();
  return new Set((j.calendars || []).map(c => c.name));
}

let have = await listNames();
console.log(`Spec bookable calendars (${want.length}): ${want.join(' | ')}`);
for (const name of want) {
  if (have.has(name)) { console.log(`HAVE: ${name}`); continue; }
  const body = { name, locationId: LOC, calendarType: 'round_robin', teamMembers: [{ userId: TEAM, priority: 0, meetingLocationType: 'phone' }] };
  const cr = await fetch('https://services.leadconnectorhq.com/calendars/', { method: 'POST', headers: H, body: JSON.stringify(body) });
  const cj = await cr.json();
  console.log(`${cr.ok ? 'CREATED' : 'FAIL ' + cr.status}: ${name} -> ${cj.calendar?.id || JSON.stringify(cj).slice(0, 120)}`);
}
have = await listNames();
const missing = want.filter(n => !have.has(n));
if (missing.length) { console.error(`PREFLIGHT FAILED — still missing: ${missing.join(', ')}`); process.exit(1); }
console.log(`PREFLIGHT OK — all ${want.length} spec calendars present in sandbox.`);
