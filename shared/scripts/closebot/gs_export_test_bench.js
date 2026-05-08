// Export current test bench KDL for routing analysis.
import fs from 'fs';

const BOT = 'bot_J56AWZ5TYQI9HKJS';
const KEY = process.env.CB_GS_API_KEY;
if (!KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

const res = await fetch(`https://api.closebot.com/bot/${BOT}/export`, {
  headers: { 'X-CB-KEY': KEY },
});
const text = await res.text();
const json = JSON.parse(text);
const kdl = json.kdl || json.exportKdl || JSON.stringify(json);
const out = 'shared/logs/test_bench_post_events_capture.kdl';
fs.writeFileSync(out, kdl);
console.log(`exported ${kdl.length} chars to ${out}, version ${json.version}`);
