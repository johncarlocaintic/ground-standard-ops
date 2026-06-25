// Audit script: for every session run that claimed a booking,
// query GHL directly to confirm whether the appointment actually exists.
// Reveals verifier flaws (wrong contact lookup) vs real platform bugs.
//
// Usage: node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/audit_bookings.mjs

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const T = process.env.GHL_GS_API_TOKEN;
const LOC = 'isGl70YkeLEAiVckMhgT';
const GHL = 'https://services.leadconnectorhq.com';
const H = { Authorization: `Bearer ${T}`, Version: '2021-07-28' };

const EVAL = 'shared/logs/eval';

// Get all sandbox calendars (id → name)
async function getSandboxCalendars() {
  const r = await fetch(`${GHL}/calendars/?locationId=${LOC}`, { headers: H });
  const j = await r.json();
  const byId = {};
  const byName = {};
  for (const c of (j.calendars || [])) {
    byId[c.id] = c.name;
    byName[c.name] = c.id;
  }
  return { byId, byName };
}

// Get all events in date range across all sandbox calendars
async function getAllEvents(calendars, startMs, endMs) {
  const all = [];
  for (const calId of Object.keys(calendars.byId)) {
    const r = await fetch(`${GHL}/calendars/events?locationId=${LOC}&calendarId=${calId}&startTime=${startMs}&endTime=${endMs}`, { headers: H });
    if (!r.ok) continue;
    const j = await r.json();
    for (const e of (j.events || [])) {
      all.push({ ...e, calendarName: calendars.byId[calId] });
    }
  }
  return all;
}

// Parse run metadata
function readRunMeta(runDir) {
  const reportPath = join(runDir, 'report.md');
  const ghlPath = join(runDir, 'ghl_facts.json');
  if (!existsSync(reportPath)) return null;

  const report = readFileSync(reportPath, 'utf8');
  const ghl = existsSync(ghlPath) ? JSON.parse(readFileSync(ghlPath, 'utf8')) : {};

  // Extract test identity name
  const identityMatch = report.match(/\*\*Test identity:\*\*\s*([^|]+)\s*\|/);
  const identityName = identityMatch ? identityMatch[1].trim() : null;
  const [firstName, lastName] = (identityName || '').split(/\s+/);

  // Termination
  const termMatch = report.match(/\*\*Termination:\*\*\s*(.+)/);
  const termination = termMatch ? termMatch[1].trim() : '';

  // Overall
  const overallMatch = report.match(/## Overall:\s*(\w+)/);
  const overall = overallMatch ? overallMatch[1] : '';

  // mnd_05 result
  const mnd05Match = report.match(/\| mnd_05[^|]*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/);
  const mnd05Verdict = mnd05Match ? mnd05Match[1].replace(/\*/g, '').trim() : '';

  // Bot
  const botMatch = report.match(/\*\*Bot:\*\*\s*`(bot_[A-Z0-9]+)`/);
  const botId = botMatch ? botMatch[1] : '';

  return {
    runDir,
    runId: runDir.replace(/.*[\/\\]/, ''),
    firstName,
    lastName,
    identityName,
    termination,
    overall,
    mnd05Verdict,
    botId,
    verifierContactId: ghl.contact_id || null,
    verifierContactName: ghl.contact_name || null,
    verifierAppts: (ghl.appointments || []).length,
  };
}

async function main() {
  const calendars = await getSandboxCalendars();
  console.log(`Loaded ${Object.keys(calendars.byId).length} sandbox calendars.`);

  // All events in the booking window (2026-05-19 → 2026-08-01)
  const start = new Date('2026-05-19T00:00:00Z').getTime();
  const end = new Date('2026-08-01T23:59:59Z').getTime();
  const allEvents = await getAllEvents(calendars, start, end);
  console.log(`Loaded ${allEvents.length} total GHL events in window.`);

  // All session run dirs (this session's gyms only)
  const sessionGyms = ['logica', 'paragonsimi', 'ombjj', 'sugoi', 'raylongo', 'universalmma', 'montgomery', 'signature', 'roberts', 'simpleman', 'killerb'];
  const allDirs = readdirSync(EVAL).filter(d => {
    if (!d.includes('20260519_') && !d.includes('20260520_')) return false;
    return sessionGyms.some(g => d.startsWith(g + '_'));
  });

  const results = {
    bookingClaimVerified: 0,        // bot claimed + GHL has matching appt → bot correct
    bookingClaimMissing: 0,         // bot claimed + no GHL appt → real platform bug
    verifierFalseFAIL: 0,           // verifier said 0 appts but GHL actually has one → verifier flaw
    verifierFalsePASS: 0,           // verifier said 1 appt but GHL has none for this lead → verifier picked wrong contact
    noBookingExpected: 0,           // SSE fail / no booking attempted
    booked: [],
    falseFails: [],
    realPlatformBugs: [],
  };

  for (const d of allDirs) {
    const meta = readRunMeta(join(EVAL, d));
    if (!meta || !meta.firstName) continue;

    // Match GHL events by appointment title containing the test identity's last name
    // (titles are formatted like "Trial Class - Hayden Lane" or "Wesley Yates - Adult Fundamentals BJJ Trial")
    const matched = allEvents.filter(e => {
      const t = (e.title || '').toLowerCase();
      return t.includes(meta.lastName.toLowerCase()) && t.includes(meta.firstName.toLowerCase());
    });

    const truelyHasBooking = matched.length > 0;
    const verifierThinksBooked = meta.verifierAppts > 0;

    if (meta.termination.includes('send failed at turn 1') || meta.termination.includes('bot timeout at turn 1')) {
      results.noBookingExpected++;
      continue;
    }

    if (truelyHasBooking && verifierThinksBooked) {
      results.bookingClaimVerified++;
      results.booked.push({ run: meta.runId, ghlEvents: matched.length, verifierSays: meta.verifierAppts });
    } else if (truelyHasBooking && !verifierThinksBooked) {
      results.verifierFalseFAIL++;
      results.falseFails.push({
        run: meta.runId,
        identity: meta.identityName,
        overall: meta.overall,
        mnd05: meta.mnd05Verdict,
        verifierContact: meta.verifierContactId,
        ghlEvents: matched.map(e => ({ title: e.title, cal: e.calendarName, start: e.startTime }))
      });
    } else if (!truelyHasBooking && verifierThinksBooked) {
      results.verifierFalsePASS++;
    } else {
      // No booking expected this run (either persona didn't book or sse failed mid-flow)
      results.noBookingExpected++;
    }
  }

  console.log('');
  console.log('=== AUDIT RESULTS ===');
  console.log('Total runs analyzed:', allDirs.length);
  console.log('Booking claim VERIFIED in GHL:', results.bookingClaimVerified);
  console.log('VERIFIER FALSE FAIL (bot booked, verifier missed it):', results.verifierFalseFAIL);
  console.log('VERIFIER FALSE PASS (verifier saw appt, GHL has nothing for this lead):', results.verifierFalsePASS);
  console.log('No booking expected:', results.noBookingExpected);

  console.log('');
  console.log('=== FALSE FAILS (bot booked correctly, verifier missed) ===');
  for (const f of results.falseFails) {
    console.log(`  ${f.run}`);
    console.log(`    Identity: ${f.identity}`);
    console.log(`    Reported: ${f.overall} | mnd_05: ${f.mnd05}`);
    console.log(`    Verifier looked at: ${f.verifierContact} (likely wrong/phantom)`);
    for (const e of f.ghlEvents) {
      console.log(`    REAL GHL appt: ${e.cal} | "${e.title}" | ${e.start}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });

// Re-run with detailed false-pass output (skipped first time)
