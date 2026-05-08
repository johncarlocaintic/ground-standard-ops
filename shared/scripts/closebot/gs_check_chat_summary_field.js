/**
 * Check GS Ads source for a chat-summary-capable field (LARGE_TEXT type).
 * Looking for anything equivalent to VGA's contact.concierge_conversation.
 * If none exists, we'll need to create one via GHL before ns07 can ship.
 */
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: { 'X-CB-KEY': key } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
}

(async () => {
  const GS_ADS = 'src_4R4DUIQTMMX2NFPU';
  const r = await api(`/agency/source/${GS_ADS}/fields`);
  if (!r.ok) { console.error('status', r.status); process.exit(1); }
  const fields = r.json.fields || r.json.data || r.json;
  console.log(`GS Ads source has ${Array.isArray(fields) ? fields.length : '?'} custom fields`);
  if (!Array.isArray(fields)) { console.log(JSON.stringify(r.json).slice(0, 1000)); return; }

  // Print large-text candidates (anything with concierge, summary, conversation, note, log in the name)
  const candidates = fields.filter(f => {
    const name = (f.name || f.fieldKey || '').toLowerCase();
    const type = (f.dataType || f.type || '').toUpperCase();
    return /concierge|summary|conversation|note|log|chat|context/.test(name) || type === 'LARGE_TEXT' || type === 'TEXTAREA';
  });

  console.log(`\nChat-summary candidates (${candidates.length}):`);
  for (const f of candidates) {
    console.log(`  - name="${f.name}"  key="${f.fieldKey || f.key}"  type="${f.dataType || f.type}"  id="${f.id}"`);
  }

  console.log('\nAll field names (for reference):');
  for (const f of fields) {
    console.log(`  - ${f.name || f.fieldKey} (${f.dataType || f.type || '?'})`);
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
