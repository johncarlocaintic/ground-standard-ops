/**
 * sandbox_attach_gym.mjs <gym-slug>
 *
 * Generic idempotent sandbox attacher. Whatever gym is currently on the
 * GS Ads sandbox gets detached + wiped, and the target gym's bot + KB +
 * calendars are attached fresh.
 *
 * Run:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/sandbox_attach_gym.mjs <slug>
 *
 * Supported slugs: graciefv, hammer, invertedgear, hamptonsjj, masondixon, graciejjsj, allinjujitsu, royaljj
 */
import { appendFileSync, mkdirSync } from 'fs';

const SLUG = process.argv[2];
if (!SLUG) { console.error('Usage: sandbox_attach_gym.mjs <slug>'); process.exit(1); }

const K = process.env.CB_GS_API_KEY;
const GHL_T = process.env.GHL_GS_API_TOKEN;
const SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const SANDBOX_LOC = 'isGl70YkeLEAiVckMhgT';
const SANDBOX_TEAM = 'ZbB1wssFyfQtuLmcjdGb';

const GYMS = {
  royaljj:      { bot: 'bot_4N8WBIF210AU944O', kb: 'file_FUODHVT0SZTQEMA8',
                  cals: [{ name: 'Adult Fundamentals BJJ', slotMin: 60 }, { name: 'Kids BJJ', slotMin: 45 }] },
  allinjujitsu: { bot: 'bot_15WPBGYMS6HLGC5E', kb: 'file_SGIMS85LUBZWM456',
                  cals: [{ name: 'Adult Fundamentals BJJ', slotMin: 60 }, { name: 'Kids 5-12 BJJ', slotMin: 45 }] },
  graciefv:     { bot: 'bot_J7WW9BOARJK0NI9F', kb: 'file_Y12JSQXU63UJ9Z0N',
                  cals: [{ name: 'Adult Fundamentals BJJ', slotMin: 60 },
                         { name: 'Adult All Levels Cardio Kickboxing', slotMin: 60 },
                         { name: 'Kids 4-5 BJJ', slotMin: 45 }, { name: 'Kids 6-7 BJJ', slotMin: 45 },
                         { name: 'Kids 8-13 BJJ', slotMin: 45 }] },
  hammer:       { bot: 'bot_AFKR1QYFJ3VKYF3W', kb: 'file_2WNTLIZS3TRK33BF',
                  cals: [{ name: 'Adult Brazilian Jiu-Jitsu', slotMin: 60 },
                         { name: 'Adult No-Gi Brazilian Jiu-Jitsu', slotMin: 60 },
                         { name: 'Adult Muay Thai (Kickboxing)', slotMin: 60 },
                         { name: 'Adult Wrestling', slotMin: 60 },
                         { name: 'Kettle Bell Workout', slotMin: 60 },
                         { name: 'Youth Martial Arts', slotMin: 45 },
                         { name: 'Teen Martial Arts', slotMin: 45 }] },
  invertedgear: { bot: 'bot_FIWVSZBWNX546KKA', kb: 'file_AKJCQBGF2EBZEY46',
                  cals: [{ name: 'Adult Fundamentals BJJ', slotMin: 60 },
                         { name: 'Cubs 4-6 BJJ', slotMin: 45 }, { name: 'Juniors 7-12 BJJ', slotMin: 45 }] },
  hamptonsjj:   { bot: 'bot_WWB97FEM611TC5SY', kb: 'file_R2H1G3T1XFE4NRMR',
                  cals: [{ name: 'Adult BJJ', slotMin: 60 }, { name: 'Adult Muay Thai', slotMin: 60 },
                         { name: 'Kids 4-7 BJJ', slotMin: 45 }, { name: 'Kids 8-12 BJJ', slotMin: 45 }] },
  masondixon:   { bot: 'bot_0HQBLZA2NO9T1ZFM', kb: 'file_K8E6900W9STUOHBZ',
                  cals: [{ name: 'Adult Fundamentals BJJ', slotMin: 60 }, { name: 'Adult Striking', slotMin: 60 },
                         { name: 'Kids 4-7 Martial Arts', slotMin: 45 }, { name: 'Kids 8-13 Martial Arts', slotMin: 45 }] },
  graciejjsj:   { bot: 'bot_UMEBUHOW9YQOLIHU', kb: 'file_TVNOGGMULZXWL4L1',
                  cals: [{ name: 'Adult Gracie Combatives', slotMin: 60 }, { name: 'Kids 7-13 BJJ', slotMin: 45 }] },
};

const G = GYMS[SLUG];
if (!G) { console.error('Unknown slug: ' + SLUG + '. Known: ' + Object.keys(GYMS).join(', ')); process.exit(1); }

mkdirSync('shared/logs', { recursive: true });
const log = (m) => { const l=`[${new Date().toISOString()}] ${m}`; console.log(l); appendFileSync('shared/logs/closebot_test.log', l+'\n'); };

const cbH = { 'X-CB-KEY': K };
const cbJH = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };
const ghlH = { Authorization: 'Bearer '+GHL_T, Version: '2021-07-28' };
const ghlJH = { ...ghlH, 'Content-Type': 'application/json' };

log('=== SANDBOX ATTACH: ' + SLUG + ' ===');

// 1. Detach ALL bots currently on sandbox
log('Step 1: Detach all bots from sandbox');
const br = await fetch('https://api.closebot.com/bot?page=1&pageSize=200', { headers: cbH });
const bj = await br.json();
const allBots = Array.isArray(bj) ? bj : (bj.bots || bj.data || []);
const sandboxBots = allBots.filter(b => (b.sources||[]).some(s => (typeof s==='string'?s:s.id||s.sourceId) === SANDBOX));
log(`  ${sandboxBots.length} bots on sandbox`);
for (const bot of sandboxBots) {
  const d = await fetch(`https://api.closebot.com/bot/${bot.id}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
  log(`  DETACH bot ${bot.id} → ${d.status}`);
}

// 2. Detach ALL KBs from sandbox (best-effort)
log('Step 2: Detach all KBs from sandbox');
const kr = await fetch('https://api.closebot.com/library/files', { headers: cbH });
const kj = await kr.json();
const files = Array.isArray(kj) ? kj : (kj.files || []);
const sandboxKbs = files.filter(f => (f.sources||[]).some(s => (typeof s==='string'?s:s.id||s.sourceId) === SANDBOX));
log(`  ${sandboxKbs.length} KBs on sandbox`);
for (const f of sandboxKbs) {
  const d = await fetch(`https://api.closebot.com/library/files/${f.fileId}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
  log(`  DETACH KB ${f.fileId} → ${d.status}`);
}

// 3. Wipe ALL sandbox calendars
log('Step 3: Wipe all sandbox calendars');
const cr0 = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${SANDBOX_LOC}`, { headers: ghlH });
const cj0 = await cr0.json();
const allCals = cj0.calendars || [];
log(`  ${allCals.length} calendars to wipe`);
for (const cal of allCals) {
  const d3 = await fetch(`https://services.leadconnectorhq.com/calendars/${cal.id}`, { method: 'DELETE', headers: ghlH });
  log(`  DEL ${cal.name} (${cal.id}) → ${d3.status}`);
  await new Promise(r => setTimeout(r, 200));
}

// 4. Create gym's calendars
log('Step 4: Create ' + SLUG + ' calendars');
const newCalIds = {};
for (const { name, slotMin } of G.cals) {
  const cc = await fetch('https://services.leadconnectorhq.com/calendars/', { method: 'POST', headers: ghlJH,
    body: JSON.stringify({ name, locationId: SANDBOX_LOC, calendarType: 'round_robin',
      teamMembers: [{ userId: SANDBOX_TEAM, priority: 0, meetingLocationType: 'phone' }],
      slotDuration: slotMin, slotDurationUnit: 'mins' }) });
  const ccj = await cc.json();
  newCalIds[name] = ccj.calendar?.id;
  log(`  + ${name} → ${cc.status} | ${ccj.calendar?.id||'ERR'}`);
  await new Promise(r => setTimeout(r, 200));
}

// 5. Attach KB
log('Step 5: Attach ' + SLUG + ' KB');
const attK = await fetch(`https://api.closebot.com/library/files/${G.kb}/source/${SANDBOX}`, { method: 'POST', headers: cbJH, body: '{}' });
log(`  Attach KB ${G.kb} → ${attK.status}`);

// 6. Attach bot
log('Step 6: Attach ' + SLUG + ' bot');
const attB = await fetch(`https://api.closebot.com/bot/${G.bot}/source/${SANDBOX}`, { method: 'POST', headers: cbJH, body: JSON.stringify({ tags: [], channels: [] }) });
log(`  Attach bot ${G.bot} → ${attB.status}`);

log('ATTACH COMPLETE — sandbox ready for ' + SLUG);
