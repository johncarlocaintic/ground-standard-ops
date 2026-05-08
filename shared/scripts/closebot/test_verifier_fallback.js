// Backfill-test the new email-fingerprint fallback against a known morphed contact.
// Target: contact 2Ka23QapLlaco4qUuoQe ("testing null", email contains "s3lc")
// from earlier cooperative_scheduler run that the verifier missed.
import { runVerifier } from './eval/verifier.js';

const identity = {
  firstName: 'Tester',
  lastName: 'Lane',
  fullName: 'Tester Lane',
  email: 'tester.lane.s3lc@donotuse.com',
  phone: '+16505550118',
};

const score = { results: [], overall_verdict: 'pass', blocker_fails: 0, standard_fails: 0, flags: 0 };
const rubric = { checkpoints: [] };

const result = await runVerifier({
  identity,
  transcript: [],
  score,
  rubric,
  ghl: {
    token: process.env.GHL_GS_API_TOKEN,
    locationId: process.env.GHL_GS_LOCATION_ID,
  },
  opts: {
    onLog: (m) => console.log(m),
    runWindow: {
      start: new Date('2026-04-29T20:00:00Z').getTime(),
      end: new Date('2026-04-29T21:30:00Z').getTime(),
    },
  },
});

console.log('\n--- RESULT ---');
console.log('found:', result.ghl_facts.found);
console.log('contact_id:', result.ghl_facts.contact_id);
console.log('contact_email:', result.ghl_facts.contact_email);
console.log('contact_name:', result.ghl_facts.contact_name);
console.log('appointments:', result.ghl_facts.appointments.length);
