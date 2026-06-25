import { writeFileSync } from 'fs';
const K = process.env.CB_GS_API_KEY;
const r = await fetch('https://api.closebot.com/bot/bot_F0VNPTPCIW88YI3J/export', { headers: { 'X-CB-KEY': K } });
const t = await r.text();
let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
if (!j.kdl) { console.log('NO KDL:', r.status, JSON.stringify(j).slice(0, 300)); process.exit(1); }
writeFileSync('D:/CLAUDE/Work/shared/logs/_vacaville_PROD_v46_export.kdl', j.kdl);
console.log('Exported', j.kdl.length, 'chars');
