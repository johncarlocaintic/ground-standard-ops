const TOKEN = process.env.GHL_GS_ADS_PIT;
const LOCATION_ID = 'isGl70YkeLEAiVckMhgT';
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

const r = await fetch(`https://services.leadconnectorhq.com/users/?locationId=${LOCATION_ID}`, { headers: H });
const txt = await r.text();
let data;
try { data = JSON.parse(txt); } catch { console.error('Parse fail:', txt.slice(0, 500)); process.exit(1); }
if (!r.ok) { console.error('Error:', r.status, JSON.stringify(data)); process.exit(1); }

const users = data.users || [];
console.log(`Users in GS Ads (${users.length}):`);
users.forEach(u => console.log(`  ${u.id} | ${u.name} | ${u.email} | ${u.roles?.type}`));
