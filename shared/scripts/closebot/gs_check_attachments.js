/**
 * Pre-v3.17 deploy check: verify KB + Smart FAQ attachments on GS Ads and VGA sources.
 * For Vacaville-only test-env exception: KB needs to be on GS Ads (test source).
 * Smart FAQ: user wants on BOTH GS Ads AND VGA.
 */
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

async function api(method, ep, body) {
  const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
}

const GS_ADS = 'src_4R4DUIQTMMX2NFPU';
const VGA = 'src_GDKORXSW4Q8RQUQ8';

(async () => {
  // List all library files
  const all = await api('GET', '/library/files');
  if (!all.ok) { console.error('list files failed', all.status); process.exit(1); }
  const files = all.json.files || all.json.data || all.json;
  if (!Array.isArray(files)) { console.log('unexpected shape:', JSON.stringify(all.json).slice(0, 400)); return; }

  console.log(`Total library files: ${files.length}`);

  // Filter Vacaville-related
  const vacFiles = files.filter(f => /vacaville|coach nick|grappling/i.test((f.name || f.filename || f.fileName || '') + ' ' + (f.description || '')));
  console.log(`\nVacaville-related library files: ${vacFiles.length}`);
  for (const f of vacFiles) {
    console.log(`  - id=${f.id}  name="${f.name || f.filename || f.fileName}"  type="${f.type || f.fileType || '?'}"`);
  }

  // Pull each file's detail to get sources
  console.log('\n=== Source attachments per file ===');
  for (const f of vacFiles) {
    const d = await api('GET', `/library/files/${f.id}`);
    if (!d.ok) { console.log(`  ${f.id}: fetch failed (${d.status})`); continue; }
    const sources = d.json.sources || [];
    const srcIds = sources.map(s => s.id || s.sourceId || s);
    const onGsAds = srcIds.includes(GS_ADS);
    const onVga = srcIds.includes(VGA);
    console.log(`  ${f.id} "${(d.json.name || '').slice(0, 60)}"  GS_ADS=${onGsAds ? 'Y' : 'N'}  VGA=${onVga ? 'Y' : 'N'}  (${srcIds.length} total sources)`);
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
