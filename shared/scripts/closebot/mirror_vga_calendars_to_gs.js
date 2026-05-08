/**
 * Mirror VGA calendar availability (openHours, slotDuration, slotInterval)
 * into the GS Ads dummy calendars so the test environment matches prod reality.
 *
 * Maps 4 calendars by name. VGA also has "Adult Express No-Gi Fundamentals"
 * which is not present on GS Ads — skipped.
 */
import fs from 'fs';

const VGA_TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const GS_TOKEN = process.env.GHL_GS_API_TOKEN;
if (!VGA_TOKEN || !GS_TOKEN) { console.error('Missing GHL_VACAVILLE_API_TOKEN or GHL_GS_API_TOKEN'); process.exit(1); }

const vgaH = { Authorization: `Bearer ${VGA_TOKEN}`, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/json' };
const gsH = { Authorization: `Bearer ${GS_TOKEN}`, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/json' };

const MAPPING = [
  { name: 'Adult No-Gi Submission Grappling', vgaId: 'eP72M7eCi37bpN7Shg2a', gsId: 'KKR9rxFq16DS0fykxXMa' },
  { name: 'Kids 7-13 Jiu-Jitsu',              vgaId: '5BZ9V5do89DR1sKxXfrM', gsId: 'GWdabDvAgRFHZGsBN9Fq' },
  { name: 'Kids 3-5 BJJ',                     vgaId: 'rUNpciMLyI2VGHu6ONrq', gsId: 'VzusiMBZhpLauldz1Xcv' },
  { name: 'Kids 10-14 BJJ',                   vgaId: 'YdfBrZRJfzbuEcQiyLxU', gsId: 'W9sKR4wWzEGUw4zTzIZJ' },
];

async function fetchCal(label, id, H) {
  const r = await fetch(`https://services.leadconnectorhq.com/calendars/${id}`, { headers: H });
  const j = await r.json();
  if (!r.ok) throw new Error(`${label} fetch ${r.status}: ${JSON.stringify(j).slice(0,200)}`);
  return j.calendar || j;
}

async function updateCal(id, payload) {
  const r = await fetch(`https://services.leadconnectorhq.com/calendars/${id}`, { method: 'PUT', headers: gsH, body: JSON.stringify(payload) });
  const t = await r.text();
  return { status: r.status, ok: r.ok, body: t.slice(0, 400) };
}

const DAYS = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
function summarizeHours(openHours) {
  if (!openHours?.length) return 'none';
  return openHours.map(oh => {
    const days = oh.daysOfTheWeek.map(d => DAYS[d]).join(',');
    const slots = oh.hours.map(h => `${h.openHour}:${String(h.openMinute).padStart(2,'0')}-${h.closeHour}:${String(h.closeMinute).padStart(2,'0')}`).join(' & ');
    return `${days}[${slots}]`;
  }).join(' | ');
}

async function main() {
  const log = [];
  const out = (m) => { console.log(m); log.push(m); };
  out(`=== MIRROR VGA → GS Ads CALENDARS === ${new Date().toISOString()}`);

  for (const { name, vgaId, gsId } of MAPPING) {
    out(`\n[${name}]`);
    const vga = await fetchCal('VGA', vgaId, vgaH);
    const gsBefore = await fetchCal('GS-before', gsId, gsH);

    out(`  VGA:        openHours=${summarizeHours(vga.openHours)} | slot=${vga.slotDuration}${vga.slotDurationUnit} interval=${vga.slotInterval}${vga.slotIntervalUnit}`);
    out(`  GS before:  openHours=${summarizeHours(gsBefore.openHours)} | slot=${gsBefore.slotDuration}${gsBefore.slotDurationUnit} interval=${gsBefore.slotInterval}${gsBefore.slotIntervalUnit}`);

    const payload = {
      openHours: vga.openHours,
      slotDuration: vga.slotDuration,
      slotDurationUnit: vga.slotDurationUnit || 'mins',
      slotInterval: vga.slotInterval,
      slotIntervalUnit: vga.slotIntervalUnit || 'mins',
      slotBuffer: vga.slotBuffer || 0,
      slotBufferUnit: vga.slotBufferUnit || 'mins',
      preBuffer: vga.preBuffer || 0,
      preBufferUnit: vga.preBufferUnit || 'mins',
    };
    // Only include these if they're non-null numbers
    if (typeof vga.allowBookingAfter === 'number') { payload.allowBookingAfter = vga.allowBookingAfter; payload.allowBookingAfterUnit = vga.allowBookingAfterUnit || 'hours'; }
    if (typeof vga.allowBookingFor === 'number')   { payload.allowBookingFor   = vga.allowBookingFor;   payload.allowBookingForUnit   = vga.allowBookingForUnit   || 'days'; }

    const upd = await updateCal(gsId, payload);
    out(`  Update: ${upd.status} ${upd.ok ? 'OK' : 'FAIL'} ${upd.ok ? '' : '— ' + upd.body}`);

    if (upd.ok) {
      const gsAfter = await fetchCal('GS-after', gsId, gsH);
      out(`  GS after:   openHours=${summarizeHours(gsAfter.openHours)} | slot=${gsAfter.slotDuration}${gsAfter.slotDurationUnit} interval=${gsAfter.slotInterval}${gsAfter.slotIntervalUnit}`);
    }
  }

  out('\n=== DONE ===');
  fs.writeFileSync('shared/logs/mirror_calendars.log', log.join('\n'));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
