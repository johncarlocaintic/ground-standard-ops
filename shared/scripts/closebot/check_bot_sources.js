// Check what sources are currently attached to the test bench bot.
const KEY = process.env.CB_GS_API_KEY;
const BOT = 'bot_J56AWZ5TYQI9HKJS';

async function cb(method, path, body) {
  const res = await fetch(`https://api.closebot.com${path}`, {
    method,
    headers: { 'X-CB-KEY': KEY, 'Accept': 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json, text };
}

console.log(`=== GET /bot/${BOT} ===`);
const r1 = await cb('GET', `/bot/${BOT}`);
console.log(`status: ${r1.status}`);
if (r1.ok) {
  const b = r1.json;
  console.log(`name: ${b.name}`);
  console.log(`version: ${b.version}`);
  console.log(`sourceIds:`, b.sourceIds || b.sources || '(none in this field)');
  console.log(`active sources field check:`);
  console.log(JSON.stringify(b, null, 2).slice(0, 1500));
}

console.log(`\n=== Try /bot/${BOT}/sources ===`);
const r2 = await cb('GET', `/bot/${BOT}/sources`);
console.log(`status: ${r2.status}`);
if (r2.ok) console.log(JSON.stringify(r2.json, null, 2).slice(0, 1000));
else console.log(`response: ${r2.text.slice(0, 300)}`);

// Also try the agency-source-side: list bots attached to known sources
console.log(`\n=== GET /agency/source/src_4R4DUIQTMMX2NFPU ===`);
const r3 = await cb('GET', `/agency/source/src_4R4DUIQTMMX2NFPU`);
console.log(`status: ${r3.status}`);
if (r3.ok) console.log(JSON.stringify(r3.json, null, 2).slice(0, 1500));
else console.log(`response: ${r3.text.slice(0, 300)}`);
