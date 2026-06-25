// Creates 6 unique dummy team members in GS Ads and assigns one per BMA calendar.
// JC (ZbB1wssFyfQtuLmcjdGb) stays on Adult BJJ — already the "natural" primary.

const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION_ID = 'isGl70YkeLEAiVckMhgT';
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
const JC_USER_ID = 'ZbB1wssFyfQtuLmcjdGb';

// Calendar ID → which team member it should get
// JC keeps Adult BJJ. New dummies for the other 6.
const CALENDARS = [
  { id: 'zkw9aYNzHrFO1FiO8BFr', name: 'Adult BJJ',             keepJC: true },
  { id: '2XUrKQbGHRH6nqEDX4xd', name: 'Adult Kickboxing',      keepJC: false, dummyN: 1 },
  { id: 'b4gAVNdn97e2Nn3s7gS1', name: 'Kids 4-5 Kickboxing',   keepJC: false, dummyN: 2 },
  { id: 'k3zXosJgWZSzxeeUqmms', name: 'Kids 6-8 BJJ',          keepJC: false, dummyN: 3 },
  { id: '5NsNbMiiL6ulIWM2OwCY', name: 'Kids 6-11 Kickboxing',  keepJC: false, dummyN: 4 },
  { id: '7jljvIvAPTfIm5cFQ1lS', name: 'Kids 9-13 BJJ',         keepJC: false, dummyN: 5 },
  { id: 'ULWAPWFmb7IwEPmwmbRo', name: 'Kids 12-15 Kickboxing', keepJC: false, dummyN: 6 },
];

const DUMMIES = [
  { firstName: 'BMA', lastName: 'Instructor2', email: 'bma.instructor2@gs-sandbox.test' },
  { firstName: 'BMA', lastName: 'Instructor3', email: 'bma.instructor3@gs-sandbox.test' },
  { firstName: 'BMA', lastName: 'Instructor4', email: 'bma.instructor4@gs-sandbox.test' },
  { firstName: 'BMA', lastName: 'Instructor5', email: 'bma.instructor5@gs-sandbox.test' },
  { firstName: 'BMA', lastName: 'Instructor6', email: 'bma.instructor6@gs-sandbox.test' },
  { firstName: 'BMA', lastName: 'Instructor7', email: 'bma.instructor7@gs-sandbox.test' },
];

async function createUser(u) {
  const body = {
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    password: 'BmaTest2026!',
    phone: '+10000000000',
    role: 'user',
    type: 'account',
    locationIds: [LOCATION_ID],
    permissions: {
      campaignsEnabled: false,
      appointmentsEnabled: true,
      tagsEnabled: false,
    },
  };
  const r = await fetch('https://services.leadconnectorhq.com/users/', { method: 'POST', headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  let data; try { data = JSON.parse(txt); } catch { return { ok: false, raw: txt.slice(0, 300) }; }
  if (!r.ok) return { ok: false, status: r.status, err: data };
  return { ok: true, id: data.id || data.user?.id, email: u.email };
}

async function buildTeamMember(userId) {
  return {
    priority: 0,
    selected: true,
    userId,
    isZoomAdded: 'false',
    locationConfigurations: [{ kind: 'custom', location: '', position: 0, zoomOauthId: '', meetingId: 'custom_0' }],
  };
}

async function updateCalendarMember(calId, userId) {
  // First fetch current calendar to get full shape
  const r = await fetch(`https://services.leadconnectorhq.com/calendars/${calId}`, { headers: H });
  const txt = await r.text();
  let cal; try { cal = JSON.parse(txt); } catch { return { ok: false, raw: txt.slice(0, 200) }; }
  if (!r.ok) return { ok: false, status: r.status, err: cal };
  const calData = cal.calendar || cal;

  const body = { teamMembers: [await buildTeamMember(userId)] };
  const r2 = await fetch(`https://services.leadconnectorhq.com/calendars/${calId}`, {
    method: 'PUT', headers: H, body: JSON.stringify(body),
  });
  const txt2 = await r2.text();
  let data2; try { data2 = JSON.parse(txt2); } catch { return { ok: false, raw: txt2.slice(0, 200) }; }
  if (!r2.ok) return { ok: false, status: r2.status, err: data2 };
  return { ok: true };
}

async function main() {
  // Create 6 dummy users
  console.log('Creating 6 dummy team members...');
  const createdUsers = [];
  for (const d of DUMMIES) {
    const result = await createUser(d);
    if (result.ok) {
      console.log(`  ✓ Created: ${d.email} → ${result.id}`);
      createdUsers.push({ ...d, id: result.id });
    } else {
      console.log(`  ✗ Failed: ${d.email}`, JSON.stringify(result.err || result.raw).slice(0, 200));
      createdUsers.push({ ...d, id: null, failed: true });
    }
  }

  // Assign team members to calendars
  console.log('\nAssigning team members to calendars...');
  for (const cal of CALENDARS) {
    if (cal.keepJC) {
      console.log(`  ○ ${cal.name} — keeping JC (${JC_USER_ID})`);
      continue;
    }
    const dummy = createdUsers[cal.dummyN - 1];
    if (!dummy || !dummy.id) {
      console.log(`  ✗ ${cal.name} — skipped (user creation failed)`);
      continue;
    }
    const result = await updateCalendarMember(cal.id, dummy.id);
    if (result.ok) {
      console.log(`  ✓ ${cal.name} → ${dummy.email} (${dummy.id})`);
    } else {
      console.log(`  ✗ ${cal.name} — update failed`, JSON.stringify(result.err || result.raw).slice(0, 200));
    }
  }

  console.log('\nDone. Re-run gs_ads_ballantyne_calendar_members.js to verify.');
}

main().catch(e => { console.error(e); process.exit(1); });
