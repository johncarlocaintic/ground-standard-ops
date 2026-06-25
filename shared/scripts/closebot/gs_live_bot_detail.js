/**
 * Pull full detail on the current live Vacaville bot for documentation.
 */
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
const LIVE = 'bot_GBIF5HQVM8FPQ0XJ';

(async () => {
  const r = await fetch(`https://api.closebot.com/bot/${LIVE}`, { headers: H });
  const j = await r.json();

  console.log('=== LIVE BOT DETAIL ===');
  console.log('name:        ', j.name);
  console.log('personaIds:  ', JSON.stringify(j.personaIds));
  console.log('sources:     ', (j.sources || []).map(s => `${s.name || s.id}`).join(', ') || 'none');
  console.log('versions:    ', (j.versions || []).length);
  const lastV = (j.versions || []).slice(-1)[0];
  if (lastV) {
    console.log('latestVer:   ', lastV.version || lastV.id, 'published:', lastV.published);
  }
  console.log('tools:       ', (j.tools || []).map(t => t.type + (t.name ? ':' + t.name : '')).join(', ') || 'none');
  console.log('topLevelKeys:', Object.keys(j).join(', '));

  if (j.personaIds && j.personaIds.length) {
    for (const pid of j.personaIds) {
      const pr = await fetch(`https://api.closebot.com/persona/${pid}`, { headers: H });
      if (pr.ok) {
        const pj = await pr.json();
        console.log('---');
        console.log(`persona ${pid}:`);
        console.log('  name:          ', pj.name);
        console.log('  description:   ', (pj.description || '').slice(0, 200));
      }
    }
  }
})();
