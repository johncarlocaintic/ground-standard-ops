/**
 * Verifier — pulls GHL ground-truth facts for a test contact and overrides
 * QA verdicts that disagree with reality.
 *
 * Why: the QA agent scores transcripts in isolation. It can flag "false closure"
 * (bot said "you're all set") even when a real GHL appointment exists for that
 * contact. This step fetches what actually happened and corrects those flags.
 *
 * Inputs:
 *   - identity: { firstName, lastName, fullName, email, phone, ... } from tester
 *   - transcript: array of { sender, message }
 *   - score: QA agent output (will not be mutated; we return a verified copy)
 *   - ghl: { token, locationId, baseUrl? }
 *   - opts: { onLog?, runDate? }
 *
 * Output:
 *   {
 *     verified_score,        // clone of score with verifier overrides applied
 *     ghl_facts: {
 *       found, contact_id, contact_email, tags, custom_fields, appointments
 *     }
 *   }
 *
 * Override rules (only flip a verdict when the GHL fact directly contradicts it):
 *   - mnd_05 (false closure) fail → pass if any appointment exists for the contact
 *   - md_02 (DOB collected) fail → pass if any DOB-shaped custom field is populated
 */

const DEFAULT_BASE = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

function ghlHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Version': API_VERSION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

async function ghlGet(baseUrl, token, endpoint) {
  const res = await fetch(`${baseUrl}${endpoint}`, { headers: ghlHeaders(token) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

// Extract the unique random fragment from a tester-generated email.
// Format from tester.js: `tester.{lastname}.{rand4}@donotuse.com`
// The rand4 is the unique fingerprint per run.
function extractEmailFingerprint(email) {
  if (!email) return null;
  const m = email.match(/^tester\.[a-z]+\.([a-z0-9]{2,8})@/i);
  return m ? m[1].toLowerCase() : null;
}

// Resolve youth custom field IDs from the GHL location — IDs differ per account.
// Falls back to empty strings (override will simply never fire) if lookup fails.
async function resolveYouthFieldIds(baseUrl, token, locationId, log) {
  const r = await ghlGet(baseUrl, token, `/locations/${locationId}/customFields`);
  if (!r.ok) {
    log(`custom field lookup failed (${r.status}) — youth field IDs unresolved`);
    return { youthNameId: '', youthBirthdayId: '' };
  }
  const fields = r.json.customFields || [];
  const youthNameField = fields.find(f => f.fieldKey === 'contact.youth_name');
  const youthBirthdayField = fields.find(f => f.fieldKey === 'contact.youth_birthday');
  const ids = {
    youthNameId: youthNameField?.id || '',
    youthBirthdayId: youthBirthdayField?.id || '',
  };
  log(`resolved youth field IDs: youth_name=${ids.youthNameId}, youth_birthday=${ids.youthBirthdayId}`);
  return ids;
}

async function findContact(baseUrl, token, locationId, identity, log, runWindow, youthFieldIds = {}) {
  const fingerprint = extractEmailFingerprint(identity.email);

  // Primary: search by identity (synthetic test identity from tester.js).
  // Cross-run guard: lastName collisions are common (25-name pool), so a name query
  // can return a contact from a DIFFERENT recent run with the same lastName. Only
  // accept a match if the candidate's email contains either our exact email or
  // our unique rand4 fingerprint. Otherwise fall through to recency fallbacks.
  const queries = [identity.email, identity.phone, identity.fullName].filter(Boolean);
  for (const q of queries) {
    const r = await ghlGet(baseUrl, token, `/contacts/?locationId=${locationId}&query=${encodeURIComponent(q)}&limit=10`);
    if (!r.ok) {
      log(`contact lookup failed (${r.status}) for query="${q}"`);
      continue;
    }
    const list = r.json.contacts || [];
    if (list.length === 0) continue;
    const exact = list.find(c => (c.email || '').toLowerCase() === (identity.email || '').toLowerCase());
    if (exact) {
      log(`contact match via query="${q}" (exact email) → ${exact.id} (${exact.email || 'no email'})`);
      return exact;
    }
    if (fingerprint) {
      const fp = list.find(c => (c.email || '').toLowerCase().includes(fingerprint));
      if (fp) {
        log(`contact match via query="${q}" (email fingerprint "${fingerprint}") → ${fp.id} (${fp.email || 'no email'})`);
        return fp;
      }
    }
    // Got results but none belong to this run — keep trying the other query types.
    log(`contact lookup query="${q}" returned ${list.length} candidates but none match identity (likely cross-run collision)`);
  }

  // Fallback A — email-fingerprint scan within run window.
  // Why: the bot is non-deterministic about calling update_contact for first/last
  // name in n20_details. When it skips that call, the contact stays as the
  // CloseBot mimic placeholder ("Testing Null") and the primary identity search
  // (by name/email/phone) misses it because the search index doesn't yet contain
  // the persona's name. The email field, however, almost always lands correctly,
  // so we scan recent contacts and look for our unique 4-char fingerprint.
  if (runWindow && fingerprint) {
    log(`primary identity search empty; trying email-fingerprint fallback (fragment="${fingerprint}")`);
    const r = await ghlGet(baseUrl, token, `/contacts/?locationId=${locationId}&limit=50&order=desc`);
    if (r.ok) {
      const list = r.json.contacts || [];
      const matches = list.filter(c => {
        if (!c.dateAdded) return false;
        const added = new Date(c.dateAdded).getTime();
        if (added < runWindow.start || added > runWindow.end) return false;
        return (c.email || '').toLowerCase().includes(fingerprint);
      });
      if (matches.length >= 1) {
        const pick = matches[0];
        log(`email-fingerprint fallback matched: ${pick.id} (${pick.email || 'no email'}${matches.length > 1 ? `, ${matches.length} candidates — picked most recent` : ''})`);
        return pick;
      }
      log(`email-fingerprint fallback: no recent contacts with fragment "${fingerprint}"`);
    }
  }

  // Fallback B — kid-only persona ends with the contact morphed into the parent
  // (different email/phone than the tester identity). Use recency + minor tags.
  if (runWindow) {
    log('email-fingerprint fallback empty; trying recency+tag fallback (kid-only flow)');
    const r = await ghlGet(baseUrl, token, `/contacts/?locationId=${locationId}&limit=30&order=desc`);
    if (r.ok) {
      const list = r.json.contacts || [];
      const minorTags = ['unaccompanied_minor', 'parent referral lead'];
      const matches = list.filter(c => {
        if (!c.dateAdded) return false;
        const added = new Date(c.dateAdded).getTime();
        if (added < runWindow.start || added > runWindow.end) return false;
        const tags = c.tags || [];
        return minorTags.some(t => tags.includes(t));
      });
      if (matches.length === 1) {
        log(`tag+recency fallback matched: ${matches[0].id} (${matches[0].email || 'no email'}, tags=${(matches[0].tags || []).join(',')})`);
        return matches[0];
      }
      if (matches.length > 1) {
        const newest = matches[0];
        log(`tag+recency fallback found ${matches.length} candidates; picking most recent: ${newest.id}`);
        return newest;
      }
      log('tag+recency fallback: no contacts in run window with minor tags');
    }
  }

  // Fallback C — kid-only: the bot overwrites email+phone with parent info, clearing
  // all fingerprint trails, and may not add minor tags. Scan recent contacts in the
  // run window for a populated youth_name custom field — the one signal that survives
  // the parent-data overwrite.
  if (runWindow && youthFieldIds.youthNameId) {
    log('tag fallback empty; trying youth_name field scan (kid-only contact morphed to parent)');
    const YOUTH_NAME_FIELD = youthFieldIds.youthNameId;
    const r = await ghlGet(baseUrl, token, `/contacts/?locationId=${locationId}&limit=30&order=desc`);
    if (r.ok) {
      const recent = (r.json.contacts || []).filter(c => {
        if (!c.dateAdded) return false;
        const added = new Date(c.dateAdded).getTime();
        return added >= runWindow.start && added <= runWindow.end;
      });
      for (const candidate of recent) {
        const det = await ghlGet(baseUrl, token, `/contacts/${candidate.id}`);
        if (!det.ok) continue;
        const fields = det.json.contact?.customFields || [];
        if (fields.some(f => f.id === YOUTH_NAME_FIELD && f.value)) {
          log(`youth_name field scan matched: ${candidate.id} (${candidate.email || 'no email'})`);
          return candidate;
        }
      }
      log('youth_name field scan: no match found in run window');
    }
  }

  return null;
}

async function getContactDetails(baseUrl, token, contactId) {
  const r = await ghlGet(baseUrl, token, `/contacts/${contactId}`);
  return r.ok ? r.json.contact : null;
}

async function getAppointments(baseUrl, token, contactId) {
  const r = await ghlGet(baseUrl, token, `/contacts/${contactId}/appointments`);
  if (!r.ok) return [];
  return r.json.events || r.json.appointments || (Array.isArray(r.json) ? r.json : []);
}

function looksLikeDob(value) {
  if (typeof value !== 'string') return false;
  if (/\d{4}-\d{2}-\d{2}/.test(value)) return true;
  if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) return true;
  if (/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(value) && /\d{4}/.test(value)) return true;
  return false;
}

function applyOverrides(score, ghlFacts, log, youthFieldIds = {}) {
  const verified = JSON.parse(JSON.stringify(score));
  verified.verifier_overrides = [];

  if (!ghlFacts.found) {
    log('no GHL contact found — no overrides applied');
    return verified;
  }

  const aptCount = ghlFacts.appointments.length;
  const dobFields = (ghlFacts.custom_fields || []).filter(f => looksLikeDob(f.value));
  const youthName = (ghlFacts.custom_fields || []).find(f => f.id === youthFieldIds.youthNameId);
  const youthBirthday = (ghlFacts.custom_fields || []).find(f => f.id === youthFieldIds.youthBirthdayId);
  const minorReferralComplete = aptCount === 0 && youthName?.value && youthBirthday?.value;

  for (const r of verified.results) {
    if (r.checkpoint_id === 'mnd_05' && r.verdict === 'fail' && aptCount > 0) {
      const before = r.verdict;
      r.verdict = 'pass';
      r.notes = `verifier override: ${aptCount} appointment(s) exist in GHL — closure was real, not false`;
      verified.verifier_overrides.push({ checkpoint_id: 'mnd_05', from: before, to: 'pass', reason: `${aptCount} GHL appointment(s)` });
      log(`override mnd_05: ${before} → pass (${aptCount} GHL appts)`);
    }
    if (r.checkpoint_id === 'md_02' && r.verdict === 'fail' && dobFields.length > 0) {
      const before = r.verdict;
      r.verdict = 'pass';
      r.notes = `verifier override: ${dobFields.length} DOB-shaped custom field(s) populated`;
      verified.verifier_overrides.push({ checkpoint_id: 'md_02', from: before, to: 'pass', reason: `${dobFields.length} DOB field(s) in GHL` });
      log(`override md_02: ${before} → pass (${dobFields.length} DOB fields)`);
    }
    if (r.checkpoint_id === 'md_06' && (r.verdict === 'fail' || r.verdict === 'flag') && minorReferralComplete) {
      const before = r.verdict;
      r.verdict = 'pass';
      r.notes = `verifier override: GHL shows minor referral completed — youth_name="${youthName.value}", youth_birthday="${youthBirthday.value}", 0 appointments`;
      verified.verifier_overrides.push({ checkpoint_id: 'md_06', from: before, to: 'pass', reason: 'minor referral data persisted in GHL' });
      log(`override md_06: ${before} → pass (minor referral persisted)`);
    }
  }

  return verified;
}

function recomputeTotals(verifiedScore, rubric) {
  const levelById = Object.fromEntries(rubric.checkpoints.map(c => [c.id, c.level]));
  let blocker_fails = 0, standard_fails = 0, flags = 0;
  for (const r of verifiedScore.results) {
    const level = levelById[r.checkpoint_id] || 'standard';
    if (r.verdict === 'fail' && level === 'blocker') blocker_fails++;
    else if (r.verdict === 'fail') standard_fails++;
    else if (r.verdict === 'flag') flags++;
  }
  verifiedScore.blocker_fails = blocker_fails;
  verifiedScore.standard_fails = standard_fails;
  verifiedScore.flags = flags;
  verifiedScore.overall_verdict = blocker_fails === 0 ? 'pass' : 'fail';
  return verifiedScore;
}

export async function runVerifier({ identity, transcript: _transcript, score, rubric, ghl, opts = {} }) {
  const log = opts.onLog || (() => {});
  const baseUrl = ghl.baseUrl || DEFAULT_BASE;
  const runWindow = opts.runWindow || null;

  log(`Verifier start: locationId=${ghl.locationId}, lookup by email="${identity.email}" / phone="${identity.phone}"${runWindow ? ` (run window: ${new Date(runWindow.start).toISOString()} → ${new Date(runWindow.end).toISOString()})` : ''}`);

  const youthFieldIds = await resolveYouthFieldIds(baseUrl, ghl.token, ghl.locationId, log);

  // Retry-with-backoff: GHL's contact search index can lag a contact's creation
  // by 30-60s. Without retry, we false-negative when the contact actually exists.
  // (See tasks/test_methodology_issues.md Issue 7.)
  let contact = null;
  const retrySchedule = [0, 15_000, 30_000]; // attempts at +0s, +15s, +45s
  for (let i = 0; i < retrySchedule.length; i++) {
    if (retrySchedule[i] > 0) {
      log(`Verifier retry ${i + 1}/${retrySchedule.length - 1}: waiting ${retrySchedule[i] / 1000}s for GHL eventual consistency`);
      await new Promise(r => setTimeout(r, retrySchedule[i]));
    }
    contact = await findContact(baseUrl, ghl.token, ghl.locationId, identity, log, runWindow, youthFieldIds);
    if (contact) break;
  }

  const ghlFacts = {
    found: !!contact,
    contact_id: contact?.id || null,
    contact_email: contact?.email || null,
    contact_name: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : null,
    tags: [],
    custom_fields: [],
    appointments: [],
  };

  if (contact) {
    const details = await getContactDetails(baseUrl, ghl.token, contact.id);
    if (details) {
      ghlFacts.tags = details.tags || [];
      ghlFacts.custom_fields = (details.customFields || []).map(f => ({ id: f.id, value: f.value }));
    }
    ghlFacts.appointments = await getAppointments(baseUrl, ghl.token, contact.id);
    log(`GHL facts: ${ghlFacts.tags.length} tags, ${ghlFacts.custom_fields.length} custom fields, ${ghlFacts.appointments.length} appointments`);
  }

  let verifiedScore = applyOverrides(score, ghlFacts, log, youthFieldIds);
  verifiedScore = recomputeTotals(verifiedScore, rubric);
  verifiedScore.ghl_verified = ghlFacts.found;
  verifiedScore.ghl_appointment_count = ghlFacts.appointments.length;

  return { verified_score: verifiedScore, ghl_facts: ghlFacts };
}

// ─── Date-math helper for QA enrichment ─────────────────────────────────────

const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

function parseDob(text) {
  // YYYY-MM-DD
  let m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  // MM/DD/YYYY
  m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (m) return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2]));
  // Month DD, YYYY  (or "Month DD YYYY")
  m = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (m) return new Date(Date.UTC(+m[3], MONTHS[m[1].slice(0,3).toLowerCase()], +m[2]));
  return null;
}

function ageOn(dob, refDate) {
  let age = refDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = refDate.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

/**
 * Scans lead messages for DOBs and returns a metadata block listing computed
 * ages. Caller prepends the block to the transcript before sending to QA.
 */
export function computeAgeAnnotations(transcript, runDate = new Date()) {
  const refIso = runDate.toISOString().slice(0, 10);
  const annotations = [];
  for (let i = 0; i < transcript.length; i++) {
    const m = transcript[i];
    if (m.sender !== 'lead') continue;
    const dob = parseDob(m.message);
    if (!dob) continue;
    const age = ageOn(dob, runDate);
    annotations.push({
      turn: i + 1,
      dob_iso: dob.toISOString().slice(0, 10),
      age_as_of: refIso,
      age,
      excerpt: m.message.length > 80 ? m.message.slice(0, 80) + '…' : m.message,
    });
  }
  return annotations;
}
