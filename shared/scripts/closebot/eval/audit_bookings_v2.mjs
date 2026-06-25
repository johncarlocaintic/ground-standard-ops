// Definitive booking audit v2: queries each appointment by ID (returns even deleted ones).
// Cross-references the verifier's contact_id and appointments against the actual GHL truth.
// Catches both:
//   - Verifier false FAIL (booked, verifier missed)
//   - Verifier false PASS (verifier saw appt under wrong contact)

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const T = process.env.GHL_GS_API_TOKEN;
const H = { Authorization: `Bearer ${T}`, Version: '2021-07-28' };
const GHL = 'https://services.leadconnectorhq.com';
const EVAL = 'shared/logs/eval';

async function getAppt(apptId) {
  const r = await fetch(`${GHL}/calendars/events/appointments/${apptId}`, { headers: H });
  if (!r.ok) return { status: r.status, missing: true };
  const j = await r.json();
  return { ...j.appointment, status: 200 };
}

async function getContact(contactId) {
  const r = await fetch(`${GHL}/contacts/${contactId}`, { headers: H });
  if (!r.ok) return { status: r.status, missing: true };
  const j = await r.json();
  return { ...j.contact, status: 200 };
}

function readMeta(runDir) {
  const reportPath = join(runDir, 'report.md');
  const ghlPath = join(runDir, 'ghl_facts.json');
  if (!existsSync(reportPath)) return null;
  const report = readFileSync(reportPath, 'utf8');
  const ghl = existsSync(ghlPath) ? JSON.parse(readFileSync(ghlPath, 'utf8')) : {};
  const id = report.match(/\*\*Test identity:\*\*\s*([^|]+)/);
  const overall = report.match(/## Overall:\s*(\w+)/);
  const mnd05 = report.match(/\| mnd_05[^|]*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/);
  return {
    runId: runDir.replace(/.*[\/\\]/, ''),
    identityName: id ? id[1].trim() : null,
    overall: overall ? overall[1] : '',
    mnd05: mnd05 ? mnd05[1].replace(/\*/g, '').trim() : '',
    verifierContactId: ghl.contact_id || null,
    verifierAppointments: ghl.appointments || [],
  };
}

async function main() {
  const sessionGyms = ['logica', 'paragonsimi', 'ombjj', 'sugoi', 'raylongo', 'universalmma', 'montgomery', 'signature', 'roberts', 'simpleman', 'killerb'];
  const allDirs = readdirSync(EVAL).filter(d => {
    if (!d.includes('20260519_') && !d.includes('20260520_')) return false;
    return sessionGyms.some(g => d.startsWith(g + '_'));
  });

  const results = {
    totalRuns: allDirs.length,
    verifierAppointmentVerified: 0,        // verifier appt id exists in GHL (even if deleted)
    verifierAppointmentNotInGHL: 0,        // verifier reported appt id that GHL doesn't recognize
    verifierContactMismatch: 0,            // appt exists but contactId doesn't match verifier's contact_id
    verifierContactExisted: 0,             // verifier's contact_id still resolves to a real contact
    verifierContactPhantom: 0,             // verifier's contact_id doesn't exist (or no name)
    issues: [],
  };

  for (const d of allDirs) {
    const m = readMeta(join(EVAL, d));
    if (!m) continue;

    // Skip if no verifier data
    if (!m.verifierContactId && m.verifierAppointments.length === 0) continue;

    // Check verifier's claimed contact
    let contactPhantom = false;
    if (m.verifierContactId) {
      const c = await getContact(m.verifierContactId);
      if (c.missing || !c.firstName) {
        contactPhantom = true;
        results.verifierContactPhantom++;
      } else {
        results.verifierContactExisted++;
      }
    }

    // Check each appt
    const apptResults = [];
    for (const a of m.verifierAppointments) {
      if (!a.id) continue;
      const ap = await getAppt(a.id);
      apptResults.push({
        apptId: a.id,
        verifierCal: a.calendar_name || a.calendarId,
        actualTitle: ap.title,
        actualCalId: ap.calendarId,
        actualContactId: ap.contactId,
        deleted: ap.deleted || false,
        missing: ap.missing || false,
      });
      if (ap.missing) {
        results.verifierAppointmentNotInGHL++;
      } else {
        results.verifierAppointmentVerified++;
        if (m.verifierContactId && ap.contactId !== m.verifierContactId) {
          results.verifierContactMismatch++;
        }
      }
    }

    // Flag interesting cases
    const allApptsBadContactMatch = apptResults.length > 0 && apptResults.every(a => a.actualContactId !== m.verifierContactId);
    if (contactPhantom || allApptsBadContactMatch) {
      results.issues.push({
        runId: m.runId,
        identity: m.identityName,
        overall: m.overall,
        mnd05: m.mnd05,
        verifierContactId: m.verifierContactId,
        contactPhantom,
        appts: apptResults,
      });
    }
  }

  console.log('=== AUDIT v2 RESULTS ===');
  console.log('Total runs scanned:', results.totalRuns);
  console.log('');
  console.log('VERIFIER CONTACTS:');
  console.log('  Phantom (verifier contact id does not exist in GHL):', results.verifierContactPhantom);
  console.log('  Real (verifier contact id resolves correctly):       ', results.verifierContactExisted);
  console.log('');
  console.log('VERIFIER APPOINTMENTS:');
  console.log('  Verified (exist in GHL, even if since deleted):', results.verifierAppointmentVerified);
  console.log('  Not in GHL (verifier reported phantom appt):   ', results.verifierAppointmentNotInGHL);
  console.log('  Contact mismatch (appt contactId != verifier contact_id):', results.verifierContactMismatch);
  console.log('');
  console.log('ISSUES TO REVIEW:', results.issues.length);
  for (const i of results.issues.slice(0, 25)) {
    console.log('  ' + i.runId);
    console.log('    Identity: ' + i.identity + ' | Reported: ' + i.overall + ' | mnd_05: ' + i.mnd05);
    console.log('    Verifier contact id: ' + i.verifierContactId + (i.contactPhantom ? ' (PHANTOM)' : ''));
    for (const a of i.appts) {
      const flag = a.missing ? ' MISSING' : a.deleted ? ' (deleted by cleanup)' : '';
      console.log(`      appt ${a.apptId} → "${a.actualTitle}"${flag} | contactId: ${a.actualContactId}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
