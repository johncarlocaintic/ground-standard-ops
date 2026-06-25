/**
 * List all CloseBot bots in Bobby's GS account with source attachments.
 * Output: bot id | source IDs (or NONE) | name
 */
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };

(async () => {
  const r = await fetch('https://api.closebot.com/bot', { headers: H });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { console.log('NON-JSON:', t.slice(0, 500)); process.exit(1); }
  const bots = j.bots || j.data || j;
  console.log('TOTAL BOTS:', bots.length);
  console.log('---');
  for (const b of bots) {
    const sources = (b.sources || []).map(s => s.id || s.sourceId || s).join(',') || 'NONE';
    console.log(`${b.id} | sources=[${sources}] | "${b.name}"`);
  }
})();
