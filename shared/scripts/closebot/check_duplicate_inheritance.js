/**
 * Check whether /duplicate inherits persona and SmartFAQ from the source bot.
 * Cleanest test: pull detail on the isolation-probe bot bot_7AY6CXAOWHG5DM7O which
 * was created via /duplicate alone (no saveTools, no save) — and which we proved
 * responds at runtime.
 *
 * If personaIds is populated and tools includes SmartFAQ → /duplicate carries them.
 * If empty → the responding-bot phenomenon was caused by something else (default
 * persona fallback?).
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY };
const BASE = 'https://api.closebot.com';

const BOTS = [
  { id: 'bot_7AY6CXAOWHG5DM7O', label: 'duplicate-only probe (responded ✅)' },
  { id: 'bot_KWRC17PKPJZQMGP7', label: 'probe B / save round-trip (responded ✅)' },
  { id: 'bot_7W4DF48K4RMTHZ2V', label: 'probe A / saveTools (silent ❌)' },
  { id: 'bot_J56AWZ5TYQI9HKJS', label: 'launch bot (live, golden template)' },
];

(async () => {
  for (const b of BOTS) {
    const r = await fetch(`${BASE}/bot/${b.id}`, { headers: H });
    if (!r.ok) { console.log(`${b.id} (${b.label}) → ${r.status} fetch failed`); continue; }
    const j = await r.json();
    console.log(`\n${b.id} (${b.label})`);
    console.log(`  name:       ${j.name}`);
    console.log(`  versions:   ${(j.versions || []).length}`);
    console.log(`  personaIds: ${JSON.stringify(j.personaIds)}`);
    console.log(`  tools:      ${(j.tools || []).map(t => `${t.type}(enabled=${t.enabled})`).join(', ') || 'none'}`);
    console.log(`  sources:    ${(j.sources || []).map(s => s.name).join(', ') || 'none'}`);
  }
})();
