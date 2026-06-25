import { fileURLToPath } from 'url';

const CB_KEY      = process.env.CB_GS_API_KEY;
const GHL_TOKEN   = process.env.GHL_GS_API_TOKEN;

const BOT_ID      = 'bot_J56AWZ5TYQI9HKJS';
const SRC_VACAV   = 'src_GDKORXSW4Q8RQUQ8';
const GHL_VAC_LOC = 'JFnXPPTB9Rkgyi0KOUv8';

// IDs currently hardcoded in the bot KDL booking node
const KDL_ADULT = 'eP72M7eCi37bpN7Shg2a';
const KDL_KIDS  = '5BZ9V5do89DR1sKxXfrM';

async function cb(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: { 'X-CB-KEY': CB_KEY } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 300) }; }
}

async function ghl(ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, {
    headers: { 'Authorization': `Bearer ${GHL_TOKEN}`, 'Version': '2021-07-28' }
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 300) }; }
}

(async () => {
  // 1. CloseBot calendars on the Vacaville source
  console.log('\n── 1. Vacaville source calendars (CloseBot) ──');
  const srcCals = await cb(`/agency/source/${SRC_VACAV}/calendars`);
  const cals = srcCals.json?.calendars || srcCals.json?.data || (Array.isArray(srcCals.json) ? srcCals.json : []);
  if (cals.length) {
    cals.forEach(c => console.log(`  id="${c.id}"  name="${c.name}"`));
  } else {
    console.log(`  status ${srcCals.status}:`, JSON.stringify(srcCals.json).slice(0, 300));
  }

  // 2. GHL calendars at Vacaville location — cross-ref KDL IDs
  console.log('\n── 2. Vacaville GHL calendars vs KDL IDs ──');
  const ghlCals = await ghl(`/calendars/?locationId=${GHL_VAC_LOC}`);
  if (ghlCals.ok) {
    const list = ghlCals.json?.calendars || [];
    console.log(`  Total calendars in GHL: ${list.length}`);
    list.forEach(c => console.log(`  id="${c.id}"  name="${c.name}"`));
    const adult = list.find(c => c.id === KDL_ADULT);
    const kids  = list.find(c => c.id === KDL_KIDS);
    console.log(`\n  KDL Adult (${KDL_ADULT}): ${adult ? '✅ MATCH — "' + adult.name + '"' : '❌ NOT FOUND in GHL'}`);
    console.log(`  KDL Kids  (${KDL_KIDS}):  ${kids  ? '✅ MATCH — "' + kids.name  + '"' : '❌ NOT FOUND in GHL'}`);
  } else {
    console.log(`  GHL fetch failed: status ${ghlCals.status}`);
  }

  // 3. Bot record — check what source is attached
  console.log('\n── 3. Bot source attachment ──');
  const botInfo = await cb(`/bot/${BOT_ID}`);
  const src = botInfo.json?.sourceId || botInfo.json?.source?.id || botInfo.json?.source || null;
  if (src) {
    console.log(`  Attached source: ${src}`);
    console.log(`  Vacaville source: ${SRC_VACAV}`);
    console.log(`  Match: ${src === SRC_VACAV ? '✅ Correct' : '❌ WRONG source'}`);
  } else {
    console.log(`  sourceId not in bot record. Checking bot fields: ${Object.keys(botInfo.json || {}).join(', ')}`);
  }

  console.log('\n=== Done ===\n');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
