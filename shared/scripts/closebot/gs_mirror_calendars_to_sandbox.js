/**
 * gs_mirror_calendars_to_sandbox.js
 * Simulate a gym's prod calendars onto the GS Ads sandbox GHL location so the
 * eval books against realistic, name-matched calendars (documented test
 * protocol: clean sandbox -> mirror calendars -> attach -> test).
 *
 * Reads prod calendars via the gym PIT, creates name-matched twins in the
 * GS Ads sandbox location with the sandbox team member, copying availability.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_mirror_calendars_to_sandbox.js <gymPIT> <calId1,calId2,...>
 */
import { appendFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(__dirname, '../../../shared/logs'), { recursive: true });
const logFile = path.join(__dirname, '../../../shared/logs/closebot_test.log');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); appendFileSync(logFile, l + '\n'); }

const GYM_PIT = process.argv[2];
const CAL_IDS = (process.argv[3] || '').split(',').filter(Boolean);
if (!GYM_PIT || CAL_IDS.length === 0) { log('ERROR: usage: <gymPIT> <calId1,calId2,...>'); process.exit(1); }

const SANDBOX_LOC = 'isGl70YkeLEAiVckMhgT';
const SANDBOX_TEAM_MEMBER = 'ZbB1wssFyfQtuLmcjdGb';
const SANDBOX_TOKEN = process.env.GHL_GS_API_TOKEN;
if (!SANDBOX_TOKEN) { log('ERROR: GHL_GS_API_TOKEN missing'); process.exit(1); }

const gymH = { Authorization: `Bearer ${GYM_PIT}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
const sbH = { Authorization: `Bearer ${SANDBOX_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
const GHL = 'https://services.leadconnectorhq.com';

async function jget(url, H) { const r = await fetch(url, { headers: H }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; } return { status: r.status, ok: r.ok, j }; }

async function main() {
  // PURGE: delete every existing sandbox calendar first so the sandbox only
  // ever holds the gym-under-test's calendars (stale prior-gym calendars in
  // list_calendars cause booking mis-routes — proven on Eden Prairie v1.0/v1.1).
  const ex = await jget(`${GHL}/calendars/?locationId=${SANDBOX_LOC}`, sbH);
  const prior = ex.j.calendars || [];
  log(`Purging ${prior.length} pre-existing sandbox calendar(s).`);
  for (const c of prior) {
    const d = await fetch(`${GHL}/calendars/${c.id}`, { method: 'DELETE', headers: sbH });
    log(`  purge "${c.name}" ${c.id} -> ${d.status}`);
    await new Promise(z => setTimeout(z, 120));
  }
  const existing = new Set(); // sandbox is now empty

  for (const id of CAL_IDS) {
    const g = await jget(`${GHL}/calendars/${id}`, gymH);
    if (!g.ok) { log(`  ✗ fetch prod cal ${id} -> ${g.status}`); continue; }
    const c = g.j.calendar || g.j;
    if (existing.has(c.name)) { log(`  = "${c.name}" already in sandbox — skip`); continue; }

    const payload = {
      locationId: SANDBOX_LOC,
      name: c.name,
      description: `Test twin of ${c.name} (mirrored from prod for eval)`,
      calendarType: c.calendarType || 'round_robin',
      // Test env only needs bookable slots to EXIST. Prod calendars sometimes
      // pair a 60-min slotDuration with sub-60-min open windows; GHL prod's
      // slot engine still yields slots, but a freshly-created sandbox twin
      // does not. Force 30/30 so slots always generate (Eden Prairie 2026-05-17).
      slotDuration: 30,
      slotDurationUnit: 'mins',
      slotInterval: 30,
      slotIntervalUnit: 'mins',
      openHours: c.openHours || [],
      autoConfirm: c.autoConfirm ?? true,
      allowReschedule: c.allowReschedule ?? true,
      allowCancellation: c.allowCancellation ?? true,
      teamMembers: [{ userId: SANDBOX_TEAM_MEMBER, priority: 0, meetingLocationType: 'custom', meetingLocation: '' }],
    };
    const r = await fetch(`${GHL}/calendars/`, { method: 'POST', headers: sbH, body: JSON.stringify(payload) });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
    if (r.ok) {
      const newId = (j.calendar || j).id;
      log(`  ✓ created "${c.name}" -> ${newId} (${(c.openHours || []).length} open-day blocks)`);
    } else {
      log(`  ✗ create "${c.name}" -> ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
    }
    await new Promise(z => setTimeout(z, 200));
  }

  const after = await jget(`${GHL}/calendars/?locationId=${SANDBOX_LOC}`, sbH);
  log(`\nSandbox now has ${(after.j.calendars || []).length} calendars:`);
  (after.j.calendars || []).forEach(c => log(`  • "${c.name}" ${c.id}`));
}
main().catch(e => { log(`FATAL: ${e.stack || e.message}`); process.exit(1); });
