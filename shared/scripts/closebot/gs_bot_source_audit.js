/**
 * READ-ONLY audit: enumerate every GS bot and the sources it is attached to.
 * No writes. Purpose: ground-truth which bots sit on which sources, and flag
 * anything attached to the known Vacaville prod source.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_bot_source_audit.js
 */
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

const VGA_PROD = 'src_GDKORXSW4Q8RQUQ8'; // Vacaville production (guardrail)
const GS_ADS   = 'src_4R4DUIQTMMX2NFPU'; // GS Ads eval sandbox

async function api(method, ep) {
  const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

(async () => {
  const list = await api('GET', '/bot');
  if (!list.ok) { console.error('GET /bot failed', list.status, list.raw || ''); process.exit(1); }
  const bots = list.json.bots || list.json.data || list.json;
  if (!Array.isArray(bots)) { console.log('unexpected /bot shape:', JSON.stringify(list.json).slice(0, 400)); return; }

  console.log(`Total bots: ${bots.length}`);
  console.log(`Legend: VGA_PROD=${VGA_PROD}  GS_ADS=${GS_ADS}\n`);

  const onProd = [];
  for (const b of bots) {
    const id = b.id || b._id;
    const name = b.name || '(unnamed)';
    const d = await api('GET', `/bot/${id}`);
    if (!d.ok) { console.log(`- ${name}  [${id}]  <detail fetch failed ${d.status}>`); continue; }
    const sources = d.json.sources || [];
    const srcIds = sources.map(s => s.id || s.sourceId || s);
    const tags = sources.map(s => ({ id: s.id || s.sourceId || s, name: s.name || '?' }));
    const flags = [];
    if (srcIds.includes(VGA_PROD)) { flags.push('*** ON VGA_PROD ***'); onProd.push(name); }
    if (srcIds.includes(GS_ADS)) flags.push('on GS_ADS sandbox');
    const srcDesc = srcIds.length
      ? tags.map(t => `${t.name}[${t.id}]`).join(', ')
      : '(no sources)';
    console.log(`- ${name}  [${id}]  sources: ${srcDesc}  ${flags.join(' ')}`);
    await new Promise(r => setTimeout(r, 150)); // pace; account is throttled
  }

  console.log(`\n=== Bots attached to VGA_PROD: ${onProd.length} ===`);
  for (const n of onProd) console.log(`  - ${n}`);
  console.log('\nNote: this only flags the ONE known prod source (VGA). Any other');
  console.log('gym sub-account prod source is not in this guardrail list yet.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
