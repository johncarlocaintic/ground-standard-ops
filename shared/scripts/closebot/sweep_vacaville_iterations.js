/**
 * Sweep all Vacaville bot iterations EXCEPT the two we want to keep:
 *   - bot_J56AWZ5TYQI9HKJS  ("Vacaville PROD - Launch v1.0 (2026-05-04)") — current launch
 *   - bot_DR18GF3ZG7IH5QOM  ("Vacaville PROD - v4.1 reverted 2026-04-27")  — 2nd-latest fallback
 *   - bot_9SWB45KI6PAJMX4Y  (DEMO template) — never touch
 *
 * For everything else with a Vacaville-ish name:
 *   1. Detach all sources (so it can't fire)
 *   2. Rename with [LEGACY] prefix (or [BROKEN-API-...] for known-bad ones)
 *
 * NOTE: DELETE /bot/{id} returns 500 across the board (vendor bug). All cleanup
 *       is rename+detach only. User must delete via UI to truly remove.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/sweep_vacaville_iterations.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const KEEP = new Set([
  'bot_J56AWZ5TYQI9HKJS',  // current launch (renamed from EDIT TARGET)
  'bot_DR18GF3ZG7IH5QOM',  // 2nd-latest version-history fallback
  'bot_9SWB45KI6PAJMX4Y',  // DEMO template — never touch any DEMO
]);

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function main() {
  log('=== Sweep Vacaville iterations ===');
  log(`Keeping: ${[...KEEP].join(', ')}`);
  log('');

  // Pull all bots
  const list = await req('GET', '/bot');
  const bots = list.json.bots || list.json.data || (Array.isArray(list.json) ? list.json : []);
  log(`Total bots: ${bots.length}`);

  // Find Vacaville-ish, excluding DEMO and KEEP
  const targets = bots.filter(b => {
    const n = (b.name || '');
    if (KEEP.has(b.id)) return false;
    if (/DEMO/i.test(n)) return false;
    if (/Membership Qualification/i.test(n)) return false; // any client DEMO
    // Catch Vacaville iterations + the cfg/fb/nb test artifacts created during the bug bisects
    return /vacaville|VGA|vaca|cfg_vacav|cfg_all_vacav|cfg_minimal_config|fb_minimal_source|fb_plus_|fb_sTP_|fb_all_no_|nb_baseline|smoketest|bisect|api-check|v4\.1 dupe|Agent Node TEST|REF —/i.test(n);
  });
  log(`Sweep targets (Vacaville iterations + bug bisect artifacts, excluding DEMOs and KEEP set): ${targets.length}`);
  log('');

  const results = [];
  for (const b of targets) {
    log(`-- ${b.id} | "${b.name}"`);
    // Get full detail to find sources
    const det = await req('GET', `/bot/${b.id}`);
    const detached = [];
    if (det.ok) {
      for (const s of (det.json.sources || [])) {
        const dr = await req('DELETE', `/bot/${b.id}/source/${s.id}`);
        detached.push(`${s.id}→${dr.status}`);
      }
    }

    // Compute new name: don't double-prefix
    let newName = b.name;
    if (!/^\[LEGACY\]/i.test(b.name) && !/^\[BROKEN/i.test(b.name)) {
      newName = `[LEGACY] ${b.name}`.slice(0, 200);
    }
    let renamed = 'skipped (already prefixed)';
    if (newName !== b.name) {
      const rn = await req('PUT', `/bot/${b.id}`, { name: newName });
      renamed = String(rn.status);
    }

    log(`     detached: [${detached.join(',') || 'none'}]`);
    log(`     rename: ${renamed} → "${newName.slice(0, 80)}..."`);
    results.push({ id: b.id, oldName: b.name, newName, detached, renamed });
  }

  // Try DELETE on each (we expect 500s) and record undeletables for the user
  log('');
  log('=== Attempting DELETE on each (vendor DELETE is broken; capturing 500s for UI cleanup list) ===');
  const undeletable = [];
  for (const r of results) {
    const d = await req('DELETE', `/bot/${r.id}`);
    log(`  DELETE /bot/${r.id} → ${d.status}`);
    if (!d.ok) undeletable.push(r);
  }

  // Final report
  const reportPath = path.join(REPO_ROOT, 'shared/logs/sweep_vacaville_report.md');
  const lines = [
    '# Vacaville sweep report',
    '',
    `Run: ${new Date().toISOString()}`,
    `Bots renamed/detached: ${results.length}`,
    `Bots undeletable via API (need UI cleanup): ${undeletable.length}`,
    '',
    '## Kept',
    '- `bot_J56AWZ5TYQI9HKJS` "Vacaville PROD - Launch v1.0 (2026-05-04)" (current launch)',
    '- `bot_DR18GF3ZG7IH5QOM` "Vacaville PROD - v4.1 reverted 2026-04-27" (2nd-latest fallback)',
    '- `bot_9SWB45KI6PAJMX4Y` "Vacaville Grappling Academy Membership Qualification (DEMO)" (DEMO, untouched)',
    '',
    '## Renamed + detached (need UI delete)',
    '',
    '| Bot ID | Old name | New name | Detached |',
    '|---|---|---|---|',
    ...results.map(r => `| \`${r.id}\` | ${r.oldName.slice(0, 60).replace(/\|/g, '\\|')} | ${r.newName.slice(0, 70).replace(/\|/g, '\\|')} | ${r.detached.join(' ') || 'none'} |`),
  ];
  fs.writeFileSync(reportPath, lines.join('\n'));
  log(`\nWrote sweep report → ${reportPath}`);
}

main().catch(e => log(`FATAL: ${e.message}`));
