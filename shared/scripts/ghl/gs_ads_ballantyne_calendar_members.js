import { readFileSync } from 'fs';

const TOKEN = process.env.GHL_GS_ADS_PIT;
const LOCATION_ID = 'isGl70YkeLEAiVckMhgT';
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

// Known Ballantyne calendar names in GS Ads
const BMA_NAMES = [
  'Adult BJJ',
  'Adult Kickboxing',
  'Kids 4-5 Kickboxing',
  'Kids 6-8 BJJ',
  'Kids 6-11 Kickboxing',
  'Kids 9-13 BJJ',
  'Kids 12-15 Kickboxing',
];

async function main() {
  // 1. List all calendars in GS Ads
  const r = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${LOCATION_ID}`, { headers: H });
  const txt = await r.text();
  let data;
  try { data = JSON.parse(txt); } catch { console.error('Parse fail:', txt.slice(0, 500)); process.exit(1); }
  if (!r.ok) { console.error('Error:', r.status, JSON.stringify(data)); process.exit(1); }

  const cals = data.calendars || [];
  console.log(`Total calendars in GS Ads: ${cals.length}`);

  const bma = cals.filter(c => BMA_NAMES.includes(c.name));
  console.log(`\nBallantyne calendars found (${bma.length}):`);

  for (const cal of bma) {
    console.log(`\n  ${cal.name} [${cal.id}]`);
    console.log(`    teamMembers: ${JSON.stringify(cal.teamMembers || [])}`);
    console.log(`    type: ${cal.calendarType}`);
    console.log(`    appointmentPerSlot: ${cal.appointmentPerSlot}`);
  }

  if (bma.length < 7) {
    console.log('\nMissing Ballantyne calendars:');
    const found = new Set(bma.map(c => c.name));
    BMA_NAMES.filter(n => !found.has(n)).forEach(n => console.log(`  - ${n}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
