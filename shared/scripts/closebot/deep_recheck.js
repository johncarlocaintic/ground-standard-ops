/**
 * Deep recheck of today's comprehensive_happy_path run.
 *
 * 1. Dump every UNIQUE event type from events.json
 * 2. Show ALL tool-related entries (not just my pattern match)
 * 3. Find ANY contact in Vacaville GHL created in the run window
 * 4. Cross-reference contact with appointments + custom fields
 */
import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const GHL_H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

async function ghl(ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { headers: GHL_H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  console.log(`=== Deep recheck: comprehensive_happy_path today ===\n`);

  const runDir = 'shared/logs/eval/vacaville-grappling_vac_comprehensive_happy_path_20260505_140532';
  const eventsPath = path.join(runDir, 'events.json');
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

  console.log(`Total events: ${events.length}\n`);

  // 1. Unique event types
  const types = {};
  for (const e of events) {
    types[e.type || '?'] = (types[e.type || '?'] || 0) + 1;
  }
  console.log(`Event type distribution:`);
  for (const [t, c] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`);
  }
  console.log('');

  // 2. ALL tool-related entries — more aggressive search
  console.log(`All entries containing "tool" or tool-call hints (case-insensitive):\n`);
  let toolCount = 0;
  for (const [i, e] of events.entries()) {
    const s = JSON.stringify(e).toLowerCase();
    if (s.includes('tool') || s.includes('update_contact') || s.includes('book_appointment') || s.includes('check_availability')) {
      toolCount++;
      // Print first 350 chars
      console.log(`  [evt ${i}, type=${e.type}] ${JSON.stringify(e).slice(0, 350)}`);
    }
  }
  console.log(`\nTotal tool-related events: ${toolCount}\n`);

  // 3. activity events specifically — those carry the new tool call format
  console.log(`All 'activity' events (new format for tool calls):\n`);
  for (const [i, e] of events.entries()) {
    if (e.type !== 'activity') continue;
    let body = e.activity;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
    const data = body?.data ? (typeof body.data === 'string' ? (() => { try { return JSON.parse(body.data); } catch { return body.data; } })() : body.data) : null;
    console.log(`  [evt ${i}] activity=${body?.activity || '?'}, toolName=${data?.toolName || '?'}, args=${(typeof data?.arguments === 'string' ? data.arguments : JSON.stringify(data?.arguments || '')).slice(0, 200)}`);
  }
  console.log('');

  // 4. Find ANY contact in Vacaville GHL created during run window
  // Run started 14:05:32 UTC, ended around 14:09 UTC
  const windowStart = new Date('2026-05-05T14:05:00Z');
  const windowEnd = new Date('2026-05-05T14:15:00Z');
  console.log(`Searching GHL for contacts in window [${windowStart.toISOString()} → ${windowEnd.toISOString()}]:`);
  const list = await ghl(`/contacts/?locationId=${LOC}&limit=30&order=desc`);
  if (!list.ok) { console.log(`fetch fail: ${list.status}`); return; }
  const contacts = list.json.contacts || [];
  const inWindow = contacts.filter(c => {
    const t = new Date(c.dateAdded);
    return t >= windowStart && t <= windowEnd;
  });
  console.log(`  found ${inWindow.length} contacts in window\n`);
  for (const c of inWindow) {
    console.log(`Contact ${c.id}:`);
    console.log(`  firstName: ${c.firstName} | lastName: ${c.lastName}`);
    console.log(`  email:     ${c.email}`);
    console.log(`  phone:     ${c.phone}`);
    console.log(`  dateOfBirth: ${c.dateOfBirth}`);
    console.log(`  tags:      ${(c.tags || []).join(', ') || '(none)'}`);
    console.log(`  dateAdded: ${c.dateAdded}`);

    // Pull full detail to get all custom fields
    const det = await ghl(`/contacts/${c.id}`);
    if (det.ok) {
      const dj = det.json.contact || det.json;
      const cf = (dj.customFields || []).filter(f => f.value);
      console.log(`  customFields populated: ${cf.length}`);
      for (const f of cf) console.log(`    ${f.id} = ${JSON.stringify(f.value)}`);
    }
    // Pull appointments
    const a = await ghl(`/contacts/${c.id}/appointments`);
    if (a.ok) {
      const appts = a.json.events || a.json.appointments || [];
      console.log(`  appointments: ${appts.length}`);
      for (const ap of appts) console.log(`    ${ap.id} | ${ap.startTime} | ${ap.title} | cal ${ap.calendarId}`);
    }
    console.log('');
  }
})().catch(e => console.log(`FATAL: ${e.message}\n${e.stack}`));
