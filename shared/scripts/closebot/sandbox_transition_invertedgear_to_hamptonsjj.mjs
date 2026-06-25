// Sandbox transition: Inverted Gear Academy → Hamptons Jiu-Jitsu South
// Clean-slate: wipe ALL sandbox calendars before creating new gym's
import { appendFileSync, mkdirSync } from 'fs';
const K = process.env.CB_GS_API_KEY;
const GHL_T = process.env.GHL_GS_API_TOKEN;
const SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const SANDBOX_LOC = 'isGl70YkeLEAiVckMhgT';
const SANDBOX_TEAM = 'ZbB1wssFyfQtuLmcjdGb';

const PREV_BOT = 'bot_FIWVSZBWNX546KKA';
const PREV_KB_ID = 'file_AKJCQBGF2EBZEY46';

const NEW_BOT = 'bot_WWB97FEM611TC5SY';
const NEW_KB_ID = 'file_R2H1G3T1XFE4NRMR';
const NEW_CALS = [
  { name: 'Adult BJJ', slotMin: 60 },
  { name: 'Adult Muay Thai', slotMin: 60 },
  { name: 'Kids 4-7 BJJ', slotMin: 45 },
  { name: 'Kids 8-12 BJJ', slotMin: 45 },
];

mkdirSync('shared/logs', { recursive: true });
const log = (m) => { const l=`[${new Date().toISOString()}] ${m}`; console.log(l); appendFileSync('shared/logs/closebot_test.log', l+'\n'); };

const cbJH = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };
const ghlH = { Authorization: 'Bearer '+GHL_T, Version: '2021-07-28' };
const ghlJH = { ...ghlH, 'Content-Type': 'application/json' };

log('=== TRANSITION: Inverted Gear → Hamptons JJS ===');

log('Step 1: Detach previous bot (Inverted Gear) from sandbox');
const d1 = await fetch(`https://api.closebot.com/bot/${PREV_BOT}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
log(`  Detach previous bot → ${d1.status}`);

log('Step 2: Detach previous KB (Inverted Gear) from sandbox');
const d2 = await fetch(`https://api.closebot.com/library/files/${PREV_KB_ID}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
log(`  Detach previous KB ${PREV_KB_ID} → ${d2.status}`);

log('Step 3: Clean-slate wipe ALL sandbox calendars');
const cr0 = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${SANDBOX_LOC}`, { headers: ghlH });
const cj0 = await cr0.json();
const allCals = cj0.calendars || [];
log(`  ${allCals.length} calendars to wipe`);
for (const cal of allCals) {
  const d3 = await fetch(`https://services.leadconnectorhq.com/calendars/${cal.id}`, { method: 'DELETE', headers: ghlH });
  log(`  Delete "${cal.name}" (${cal.id}) → ${d3.status}`);
  await new Promise(r => setTimeout(r, 200));
}
log(`  Wipe complete`);

log('Step 4: Create Hamptons JJS calendars (fresh)');
const newCalIds = {};
for (const { name, slotMin } of NEW_CALS) {
  const cc = await fetch('https://services.leadconnectorhq.com/calendars/', { method: 'POST', headers: ghlJH,
    body: JSON.stringify({ name, locationId: SANDBOX_LOC, calendarType: 'round_robin',
      teamMembers: [{ userId: SANDBOX_TEAM, priority: 0, meetingLocationType: 'phone' }],
      slotDuration: slotMin, slotDurationUnit: 'mins' }) });
  const ccj = await cc.json();
  newCalIds[name] = ccj.calendar?.id;
  log(`  + created: ${name} → ${cc.status} | id=${ccj.calendar?.id||'ERR'}`);
  await new Promise(r => setTimeout(r, 200));
}

log('Step 5: Attach Hamptons JJS KB to sandbox');
const attK = await fetch(`https://api.closebot.com/library/files/${NEW_KB_ID}/source/${SANDBOX}`, { method: 'POST', headers: cbJH, body: '{}' });
log(`  Attach KB ${NEW_KB_ID} → ${attK.status}`);

log('Step 6: Attach new bot (Hamptons JJS) to sandbox');
const attB = await fetch(`https://api.closebot.com/bot/${NEW_BOT}/source/${SANDBOX}`, { method: 'POST', headers: cbJH, body: JSON.stringify({ tags: [], channels: [] }) });
log(`  Attach new bot → ${attB.status}`);

log('TRANSITION COMPLETE — sandbox ready for Hamptons JJS sweep');
log(`HAMPTONSJJ_KB_ID=${NEW_KB_ID}`);
log(`HAMPTONSJJ_CAL_IDS=${JSON.stringify(newCalIds)}`);
