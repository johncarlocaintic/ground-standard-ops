import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');

const botId = 'bot_W7ZC8X7DD98QMDA6';

function getEnv(k) {
  if (!process.env[k]) { console.error('FATAL: missing ' + k); process.exit(1); }
  return process.env[k];
}

const r = await fetch('https://api.closebot.com/bot/' + botId + '/export', {
  headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY') }
});
const t = await r.text();
const j = JSON.parse(t);
if (j.kdl) {
  const out = path.join(logDir, 'vacaville_v4.2_live_export.kdl');
  fs.writeFileSync(out, j.kdl);
  console.log('OK — exported to ' + out + ' (' + j.kdl.length + ' chars)');
} else {
  console.log('FAIL: ' + JSON.stringify(j).slice(0, 500));
}
