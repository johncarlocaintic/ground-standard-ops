// Sandbox transition: Royal JJ → All In Jiu-Jitsu
// Ensures the GS Ads sandbox contains ONLY the next gym's bot + KB + calendars at any moment.
// NOTE: Royal KB id + Royal sandbox cal ids will be present at runtime via the Royal transition's
// log output. If they differ from what's hard-coded here, this script will gracefully fall through
// (deletes will 4xx but won't block the rest).

import { readFileSync, appendFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

const K = process.env.CB_GS_API_KEY;
const GHL_T = process.env.GHL_GS_API_TOKEN;
const SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const SANDBOX_LOC = 'isGl70YkeLEAiVckMhgT';
const SANDBOX_TEAM = 'ZbB1wssFyfQtuLmcjdGb';

const PREV_BOT = 'bot_4N8WBIF210AU944O';        // Royal JJ
const PREV_KB_NAME = 'royaljj-kb-v1.0.0.txt';   // resolve fileId from KB list
const NEW_BOT = 'bot_15WPBGYMS6HLGC5E';         // All In v3.0
const NEW_KB_PATH = 'clients/ground-standard/closebot/allinjujitsu-kb-v1.0.0.txt';
const NEW_KB_NAME = 'allinjujitsu-kb-v1.0.0.txt';
const NEW_CALS = [
  { name: 'Adult Fundamentals BJJ', slotMin: 60 },
  { name: 'Kids 5-12 BJJ', slotMin: 45 },
];

mkdirSync('shared/logs', { recursive: true });
const log = (m) => {
  const l = `[${new Date().toISOString()}] ${m}`;
  console.log(l);
  appendFileSync('shared/logs/closebot_test.log', l + '\n');
};

const cbH = { 'X-CB-KEY': K };
const cbJH = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };
const ghlH = { Authorization: 'Bearer ' + GHL_T, Version: '2021-07-28' };
const ghlJH = { ...ghlH, 'Content-Type': 'application/json' };

log('Step 1: Detach previous bot (Royal JJ) from sandbox');
const d1 = await fetch(`https://api.closebot.com/bot/${PREV_BOT}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
log(`  Detach previous bot → ${d1.status}`);

log('Step 2: Detach previous KB (royaljj) from sandbox');
const kbList = await fetch('https://api.closebot.com/library/files', { headers: cbH });
const kj = await kbList.json();
const files = Array.isArray(kj) ? kj : (kj.files || kj.results || []);
const prevKb = files.find(f => (f.fileName || f.name) === PREV_KB_NAME);
if (prevKb) {
  const d2 = await fetch(`https://api.closebot.com/library/files/${prevKb.fileId}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
  log(`  Detach previous KB ${prevKb.fileId} → ${d2.status}`);
} else {
  log('  WARN: previous KB not found in library list');
}

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

log('Step 4: Create All In calendars (fresh)');
const newCalIds = {};
for (const { name, slotMin } of NEW_CALS) {
  const cc = await fetch('https://services.leadconnectorhq.com/calendars/', {
    method: 'POST', headers: ghlJH,
    body: JSON.stringify({
      name, locationId: SANDBOX_LOC, calendarType: 'round_robin',
      teamMembers: [{ userId: SANDBOX_TEAM, priority: 0, meetingLocationType: 'phone' }],
      slotDuration: slotMin, slotDurationUnit: 'mins',
    })
  });
  const ccj = await cc.json();
  newCalIds[name] = ccj.calendar?.id;
  log(`  + created: ${name} → ${cc.status} | id=${ccj.calendar?.id || 'ERR'}`);
  await new Promise(r => setTimeout(r, 200));
}

log('Step 5: Upload + index new KB');
const kb = readFileSync(NEW_KB_PATH);
const form = new globalThis.FormData();
form.append('file', new Blob([kb], { type: 'text/plain' }), NEW_KB_NAME);
const up = await fetch('https://api.closebot.com/library/files', { method: 'POST', headers: cbH, body: form });
const uj = await up.json();
const newKbId = uj.fileId || uj.id || uj.file?.fileId;
log(`  Upload → ${up.status} | id=${newKbId}`);

const form2 = new globalThis.FormData();
form2.append('newFile', new Blob([kb], { type: 'text/plain' }), NEW_KB_NAME);
const put = await fetch(`https://api.closebot.com/library/files/${newKbId}`, { method: 'PUT', headers: cbH, body: form2 });
log(`  PUT content-replace → ${put.status}`);

for (let i = 0; i < 50; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const s = await fetch(`https://api.closebot.com/library/files/${newKbId}`, { headers: cbH });
  const sj = await s.json();
  const status = sj.fileStatus || sj.status;
  log(`  poll ${i+1}: status=${status}`);
  if (status === 'indexed') break;
}

const attK = await fetch(`https://api.closebot.com/library/files/${newKbId}/source/${SANDBOX}`, { method: 'POST', headers: cbJH, body: '{}' });
log(`  Attach new KB to sandbox → ${attK.status}`);

log('Step 6: Attach new bot to sandbox');
const attB = await fetch(`https://api.closebot.com/bot/${NEW_BOT}/source/${SANDBOX}`, {
  method: 'POST', headers: cbJH,
  body: JSON.stringify({ tags: [], channels: [] })
});
log(`  Attach new bot → ${attB.status}`);

log('TRANSITION COMPLETE — sandbox ready for All In sweep');
log(`ALLIN_KB_ID=${newKbId}`);
log(`ALLIN_CAL_IDS=${JSON.stringify(newCalIds)}`);
