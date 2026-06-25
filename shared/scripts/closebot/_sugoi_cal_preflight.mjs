const T = process.env.GHL_GS_API_TOKEN;
const LOC = 'isGl70YkeLEAiVckMhgT';
const TEAM = 'ZbB1wssFyfQtuLmcjdGb';
const want = ['Adult Fundamentals BJJ', 'Kids 4-8 Fundamentals Jiu-Jitsu', 'Teens 9-15 Fundamentals Jiu-Jitsu'];
const H = { Authorization: 'Bearer ' + T, Version: '2021-07-28', 'Content-Type': 'application/json' };

let r = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${LOC}`, { headers: H });
let cals = (await r.json()).calendars || [];
const have = new Set(cals.map(c => c.name));

for (const name of want) {
  if (have.has(name)) { console.log('HAVE:', name); continue; }
  const body = { name, locationId: LOC, calendarType: 'round_robin', teamMembers: [{ userId: TEAM, priority: 0, meetingLocationType: 'phone' }] };
  const cr = await fetch('https://services.leadconnectorhq.com/calendars/', { method: 'POST', headers: H, body: JSON.stringify(body) });
  const cj = await cr.json();
  console.log((cr.ok ? 'CREATED' : 'FAIL ' + cr.status) + ': ' + name + ' -> ' + (cj.calendar?.id || JSON.stringify(cj).slice(0, 120)));
}
// re-verify
r = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${LOC}`, { headers: H });
cals = (await r.json()).calendars || [];
const now = new Set(cals.map(c => c.name));
console.log('FINAL:', want.map(w => (now.has(w) ? 'OK' : 'MISSING') + ' ' + w).join(' | '));
