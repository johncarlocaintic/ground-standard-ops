// Sandbox deep-clean: detach stale bots, wipe extra calendars
// Run while CURRENT gym sweep is active — only touches stale bots and non-current calendars.
// Set CURRENT_BOT + CURRENT_CAL_NAMES to match the bot/cals being swept right now.
import { appendFileSync, mkdirSync } from 'fs';

const K = process.env.CB_GS_API_KEY;
const GHL_T = process.env.GHL_GS_API_TOKEN;
const SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const SANDBOX_LOC = 'isGl70YkeLEAiVckMhgT';

// Current gym under test — DO NOT TOUCH these
const CURRENT_BOT = process.env.CURRENT_BOT || 'bot_15WPBGYMS6HLGC5E'; // All In v3.0
const CURRENT_CAL_NAMES = (process.env.CURRENT_CALS || 'Adult Fundamentals BJJ,Kids 5-12 BJJ').split(',');

mkdirSync('shared/logs', { recursive: true });
const log = (m) => { const l=`[${new Date().toISOString()}] ${m}`; console.log(l); appendFileSync('shared/logs/closebot_test.log', l+'\n'); };

const cbH = { 'X-CB-KEY': K };
const cbJH = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };
const ghlH = { Authorization: 'Bearer '+GHL_T, Version: '2021-07-28' };

log('=== SANDBOX CLEANUP ===');
log('Protecting bot: ' + CURRENT_BOT);
log('Protecting cals: ' + CURRENT_CAL_NAMES.join(', '));

// Step 1: List all bots on sandbox and detach all except CURRENT_BOT
log('\nStep 1: Detach stale bots from sandbox');
const br = await fetch('https://api.closebot.com/bot?page=1&pageSize=200', { headers: cbH });
const bj = await br.json();
const allBots = Array.isArray(bj) ? bj : (bj.bots || bj.data || []);
const sandboxBots = allBots.filter(b => {
  const srcs = b.sources || [];
  return srcs.some(s => (typeof s === 'string' ? s : s.id || s.sourceId) === SANDBOX);
});
log(`  ${sandboxBots.length} bots on sandbox`);
for (const bot of sandboxBots) {
  if (bot.id === CURRENT_BOT) {
    log(`  KEEP: ${bot.id} ${bot.name}`);
    continue;
  }
  const d = await fetch(`https://api.closebot.com/bot/${bot.id}/source/${SANDBOX}`, { method: 'DELETE', headers: cbJH });
  log(`  DETACH: ${bot.id} ${bot.name.slice(0,50)} → ${d.status}`);
}

// Step 2: Delete all sandbox calendars except the current gym's
log('\nStep 2: Wipe accumulated sandbox calendars (keep current gym only)');
const cr = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${SANDBOX_LOC}`, { headers: ghlH });
const cj = await cr.json();
const allCals = cj.calendars || [];
log(`  ${allCals.length} calendars in sandbox`);
const keepSet = new Set(CURRENT_CAL_NAMES.map(n => n.trim()));
let deleted = 0, kept = 0;
for (const cal of allCals) {
  if (keepSet.has(cal.name)) {
    log(`  KEEP: [${cal.id}] ${cal.name}`);
    kept++;
    continue;
  }
  const d = await fetch(`https://services.leadconnectorhq.com/calendars/${cal.id}`, { method: 'DELETE', headers: ghlH });
  log(`  DELETE: [${cal.id}] ${cal.name} → ${d.status}`);
  deleted++;
  // small delay to avoid rate-limiting
  await new Promise(r => setTimeout(r, 200));
}
log(`\nCleanup complete. Kept ${kept} cals, deleted ${deleted} cals.`);

// Step 3: Verify
log('\nStep 3: Verify sandbox state');
const vr = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${SANDBOX_LOC}`, { headers: ghlH });
const vj = await vr.json();
const remaining = vj.calendars || [];
log(`Remaining calendars (${remaining.length}):`);
remaining.forEach(c => log(`  [${c.id}] ${c.name}`));
