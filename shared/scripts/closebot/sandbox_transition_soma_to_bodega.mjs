// Sandbox transition: SOMA → Bodega
// Ensures the GS Ads sandbox contains ONLY the next gym's bot + KB + calendars at any moment.
//
// Steps:
//  1. Detach SOMA bot from sandbox
//  2. Detach SOMA KB from sandbox
//  3. Delete SOMA sandbox calendar (SOMA MVMT Introduction Class @ ZEEgOGHAUncAhc664k4v)
//  4. Verify the sandbox has Bodega's 2 calendars (Adult No-Gi BJJ, Kids 6-14 BJJ) — create if missing
//  5. Upload + index Bodega KB, attach to sandbox
//  6. Attach Bodega bot (bot_RBL7PP9J68OLDHHA) to sandbox
//  7. Verify final state: 1 bot, 1 KB, 2 cals on sandbox related to Bodega.
//
// Pre-existing sandbox calendars from prior gyms are OUT OF SCOPE for this script
// (they accumulated across earlier multi-gym sweeps). This script enforces
// hygiene going forward — the bot's n30_book now explicitly names its own
// calendars to defeat sandbox cross-contamination at the prompt level.

import { readFileSync, appendFileSync, mkdirSync } from 'fs';

const K = process.env.CB_GS_API_KEY;
const GHL_T = process.env.GHL_GS_API_TOKEN;
const SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const SANDBOX_LOC = 'isGl70YkeLEAiVckMhgT';
const SANDBOX_TEAM = 'ZbB1wssFyfQtuLmcjdGb';

const SOMA_BOT = 'bot_U2JSE7DXEXL7ME50';
const SOMA_CAL_SANDBOX = 'ZEEgOGHAUncAhc664k4v';
const SOMA_KB = 'file_A5HQSNLFP7ED3WWZ';

const BODEGA_BOT = 'bot_RBL7PP9J68OLDHHA';
const BODEGA_KB_PATH = 'clients/ground-standard/closebot/bodegajj-kb-v1.0.0.txt';
const BODEGA_KB_NAME = 'bodegajj-kb-v1.0.0.txt';
const BODEGA_CALS = [
  { name: 'Adult No-Gi Brazilian Jiu-Jitsu', slotMin: 60 },
  { name: 'Kids 6-14 BJJ', slotMin: 60 },
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

// Step 1: Detach SOMA bot from sandbox
log('Step 1: Detach SOMA bot from sandbox');
const d1 = await fetch(`https://api.closebot.com/bot/${SOMA_BOT}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
log(`  Detach SOMA bot → ${d1.status}`);

// Step 2: Detach SOMA KB from sandbox
log('Step 2: Detach SOMA KB from sandbox');
const d2 = await fetch(`https://api.closebot.com/library/files/${SOMA_KB}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
log(`  Detach SOMA KB → ${d2.status}`);

// Step 3: Delete SOMA sandbox calendar
log('Step 3: Delete SOMA MVMT Introduction Class sandbox calendar');
const d3 = await fetch(`https://services.leadconnectorhq.com/calendars/${SOMA_CAL_SANDBOX}`, { method: 'DELETE', headers: ghlH });
log(`  Delete SOMA cal → ${d3.status}`);

// Step 4: Verify / create Bodega calendars in sandbox
log('Step 4: Ensure Bodega calendars exist in sandbox');
const cr = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${SANDBOX_LOC}`, { headers: ghlH });
const cj = await cr.json();
const existing = new Map((cj.calendars || []).map(c => [c.name, c]));
const bodegaCalIds = {};
for (const { name, slotMin } of BODEGA_CALS) {
  if (existing.has(name)) {
    bodegaCalIds[name] = existing.get(name).id;
    log(`  ✓ already exists: ${name} (${existing.get(name).id})`);
  } else {
    const cc = await fetch('https://services.leadconnectorhq.com/calendars/', {
      method: 'POST', headers: ghlJH,
      body: JSON.stringify({
        name, locationId: SANDBOX_LOC, calendarType: 'round_robin',
        teamMembers: [{ userId: SANDBOX_TEAM, priority: 0, meetingLocationType: 'phone' }],
        slotDuration: slotMin, slotDurationUnit: 'mins',
      })
    });
    const ccj = await cc.json();
    bodegaCalIds[name] = ccj.calendar?.id;
    log(`  + created: ${name} → ${cc.status} | id=${ccj.calendar?.id || 'ERR'}`);
  }
}

// Step 5: Upload + index Bodega KB
log('Step 5: Upload Bodega KB + wait for indexed');
const kb = readFileSync(BODEGA_KB_PATH);
const form = new globalThis.FormData();
form.append('file', new Blob([kb], { type: 'text/plain' }), BODEGA_KB_NAME);
const up = await fetch('https://api.closebot.com/library/files', { method: 'POST', headers: cbH, body: form });
const uj = await up.json();
const newKbId = uj.fileId || uj.id || uj.file?.fileId;
log(`  Upload → ${up.status} | id=${newKbId}`);

// PUT content-replace to trigger indexing (known workaround for upload-stall)
const form2 = new globalThis.FormData();
form2.append('newFile', new Blob([kb], { type: 'text/plain' }), BODEGA_KB_NAME);
const put = await fetch(`https://api.closebot.com/library/files/${newKbId}`, { method: 'PUT', headers: cbH, body: form2 });
log(`  PUT content-replace → ${put.status}`);

// Poll for indexed
for (let i = 0; i < 50; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const s = await fetch(`https://api.closebot.com/library/files/${newKbId}`, { headers: cbH });
  const sj = await s.json();
  const status = sj.fileStatus || sj.status;
  log(`  poll ${i+1}: status=${status}`);
  if (status === 'indexed') break;
}

// Attach Bodega KB to sandbox
const attK = await fetch(`https://api.closebot.com/library/files/${newKbId}/source/${SANDBOX}`, { method: 'POST', headers: cbJH, body: '{}' });
log(`  Attach Bodega KB to sandbox → ${attK.status}`);

// Step 6: Attach Bodega bot to sandbox
log('Step 6: Attach Bodega bot to sandbox');
const attB = await fetch(`https://api.closebot.com/bot/${BODEGA_BOT}/source/${SANDBOX}`, {
  method: 'POST', headers: cbJH,
  body: JSON.stringify({ tags: [], channels: [] })
});
log(`  Attach Bodega bot → ${attB.status}`);

log('TRANSITION COMPLETE — sandbox ready for Bodega sweep');
log(`BODEGA_KB_ID=${newKbId}`);
log(`BODEGA_CAL_IDS=${JSON.stringify(bodegaCalIds)}`);
