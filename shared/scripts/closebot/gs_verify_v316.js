/**
 * Verify the deployed v3.16 bot actually has the trimmed conversationReason
 * and empty n81 ExtraPrompt. Pull from API, dump, compare.
 */
import fs from 'fs';
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const BOT = 'bot_OMZ0C13BAHR82UIY';

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: { 'X-CB-KEY': key } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
}

(async () => {
  // Dump full bot
  const b = await api(`/bot/${BOT}`);
  fs.writeFileSync('shared/logs/gs_verify_v316_bot.json', JSON.stringify(b.json, null, 2));
  console.log(`bot status=${b.status} keys=${Object.keys(b.json || {}).join(',')}`);

  // Try export KDL
  const k = await api(`/bot/${BOT}/export`);
  if (k.ok) {
    const kdl = typeof k.json === 'string' ? k.json : (k.json.kdl || k.json.exportKdl || JSON.stringify(k.json));
    fs.writeFileSync('shared/logs/gs_verify_v316_export.kdl', kdl);
    console.log(`export status=${k.status} size=${kdl.length} → shared/logs/gs_verify_v316_export.kdl`);

    // Extract conversationReason
    const cr = kdl.match(/conversationReason\s+"([^"]*(?:\\"[^"]*)*)"/);
    if (cr) {
      console.log(`\nconversationReason length: ${cr[1].length} chars`);
      console.log('--- conversationReason (first 400 chars) ---');
      console.log(cr[1].slice(0, 400));
    } else console.log('\nconversationReason not parsed');

    // Extract n81 ExtraPrompt
    const n81 = kdl.match(/id="n81_openqa"[\s\S]*?ExtraPrompt\s+"([^"]*)"/);
    if (n81) console.log(`\nn81 ExtraPrompt: "${n81[1]}" (length=${n81[1].length})`);
    else console.log('\nn81 ExtraPrompt field not present');
  } else {
    console.log(`export status=${k.status} — trying alt endpoint`);
    const k2 = await api(`/bot/${BOT}/kdl`);
    console.log(`  /kdl status=${k2.status}`);
    if (k2.raw) fs.writeFileSync('shared/logs/gs_verify_v316_export.kdl', k2.raw);
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
