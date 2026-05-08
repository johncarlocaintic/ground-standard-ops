// Detach all bots from src_4R4DUIQTMMX2NFPU EXCEPT the keep-list.
// Keeps the agency tidy. Per the iteration archival rule.
const CB_KEY = process.env.CB_GS_API_KEY;
const SOURCE = 'src_4R4DUIQTMMX2NFPU';

// Active bot to keep attached (v5.1 - the current iteration under test).
// Add more here if needed.
const KEEP = new Set([
  'bot_PS2AE0BPP2WKCUBC', // v5.1 - Statement preamble + Agent Node chain
]);

async function api(method, ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
  });
  return { status: r.status };
}

(async () => {
  // Get all bots
  const r = await fetch('https://api.closebot.com/bot', { headers: { 'X-CB-KEY': CB_KEY } });
  const allBots = await r.json();

  // Find bots that have the source attached
  const attached = [];
  for (const b of allBots) {
    if (KEEP.has(b.id)) continue;
    // Need full bot detail to see sources
    const dr = await fetch(`https://api.closebot.com/bot/${b.id}`, { headers: { 'X-CB-KEY': CB_KEY } });
    const detail = await dr.json();
    if (detail.sources?.some(s => s.id === SOURCE)) {
      attached.push({ id: b.id, name: b.name });
    }
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`Found ${attached.length} bots attached to ${SOURCE} that should be detached:`);
  for (const b of attached) console.log(`  ${b.id} - ${b.name.slice(0, 80)}`);
  console.log('');

  // Detach each
  let success = 0, fail = 0;
  for (const b of attached) {
    const res = await api('DELETE', `/bot/${b.id}/source/${SOURCE}`);
    if (res.status >= 200 && res.status < 300) {
      console.log(`[${res.status}] detached ${b.id}`);
      success++;
    } else {
      console.log(`[${res.status}] FAILED to detach ${b.id}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('');
  console.log(`=== DONE ===`);
  console.log(`Detached: ${success}, Failed: ${fail}`);
  console.log(`Kept attached: ${[...KEEP].join(', ')}`);
})();
