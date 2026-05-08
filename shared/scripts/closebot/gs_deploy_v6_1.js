// v6.1 — Source → Statement → Method (single Agent Node) → EOC
import fs from 'fs';
const CB_KEY = process.env.CB_GS_API_KEY;
const SOURCE = 'src_4R4DUIQTMMX2NFPU';

async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

(async () => {
  console.log('=== v6.1 deploy: Statement + Agent Node ===');
  const kdl = fs.readFileSync('shared/logs/vacaville_v6_1_statement_agent.kdl', 'utf8');
  console.log(`KDL: ${kdl.length} chars`);

  console.log('--- Detach v6.0 ---');
  const det = await api('DELETE', `/bot/bot_D36BVZIG5W4RIUY4/source/${SOURCE}`);
  console.log(`detach v6.0 → ${det.status}`);

  console.log('--- Create v6.1 ---');
  const c = await api('POST', '/bot', { name: `Vacaville v6.1 - Statement+Agent (${new Date().toISOString().slice(0,16)})`, importKdl: kdl });
  if (!c.ok) { console.log(`FAIL: ${c.status}`); process.exit(1); }
  const botId = c.json.id;
  console.log(`bot ID: ${botId}`);

  console.log('--- Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  console.log(`publish → ${pub.status}`);

  console.log('--- Attach ---');
  const att = await api('POST', `/bot/${botId}/source/${SOURCE}`, { tags: [], channels: ['Test Chat 12 [VACAVILLE ]'], enabled: true });
  console.log(`attach → ${att.status}`);

  console.log('--- Re-publish ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  console.log(`re-publish → ${pub2.status}`);

  console.log(`\nv6.1 bot ID: ${botId}`);
})();
