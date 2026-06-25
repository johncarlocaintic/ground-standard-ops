// Debug: probe Ray Longo calendars + events
const pit = 'pit-70da2aa1-2805-402b-8e98-33e6f8227097';
const loc = 'MPmczU9WX0pOwJwZGEff';
const GHL = 'https://services.leadconnectorhq.com';

async function ghl(ep) {
  const r = await fetch(GHL+ep, { headers: { Authorization: 'Bearer '+pit, Version: '2021-07-28' } });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  return { status: r.status, ok: r.ok, json: j };
}

const calR = await ghl('/calendars/?locationId='+loc);
console.log('Calendars status:', calR.status);
const cals = calR.json.calendars || calR.json.data || [];
console.log('Calendars found:', cals.length);
cals.forEach(c => console.log(' ', c.id, c.name));

if (cals.length) {
  const cal = cals[0];
  const startMs = Date.now() - 30*24*60*60*1000;
  const endMs   = Date.now() + 30*24*60*60*1000;
  const evR = await ghl('/calendars/events?calendarId='+cal.id+'&startTime='+startMs+'&endTime='+endMs);
  console.log('\nEvents status:', evR.status, '| cal:', cal.name);
  const events = evR.json.events || evR.json.appointments || evR.json.data || [];
  console.log('Events found:', events.length);
  if (events.length) {
    const e = events[0];
    console.log('First event fields:', Object.keys(e));
    console.log('Sample:', JSON.stringify(e).slice(0,600));
  } else {
    console.log('Raw response keys:', Object.keys(evR.json));
    console.log('Raw (500 chars):', JSON.stringify(evR.json).slice(0, 500));
  }
}
