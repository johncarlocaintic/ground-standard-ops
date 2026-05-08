// Cancel test bookings sitting in Vacaville production GHL.
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const APPTS = [
  { id: 'cjjk9K2cji9d1JQJiRQg', label: 'Tester Marsh — Adult No-Gi — TONIGHT 2026-04-29 19:00' },
  { id: 'Xmm9Yv7QsCof5AU9SWy0', label: 'Gavin Marsh — Kids 7-13 — 2026-05-04 17:15' },
  { id: 'Q0uaZkYqz8Uq4nRdMlWa', label: 'Tester Zane — Trial Class — 2026-05-04 18:30' },
];

for (const a of APPTS) {
  const res = await fetch(`https://services.leadconnectorhq.com/calendars/events/${a.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  const text = await res.text();
  console.log(`${a.id}  ${res.status}  ${a.label}`);
  if (!res.ok) console.log(`  body: ${text.slice(0, 300)}`);
}
