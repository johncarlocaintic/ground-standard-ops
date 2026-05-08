/**
 * KDL import 500 investigation.
 *
 * Hypothesis ladder:
 *   H1: dupe __zIndex within blocks breaks import.
 *   H2: globalAgentTools block breaks import.
 *   H3: __position / __zIndex UI metadata in general breaks import.
 *   H4: ScenarioCustom or shared-id Statement nodes break import.
 *
 * Strategy: take launch_kdl.kdl as baseline, apply progressively-more-aggressive
 * normalizations, and POST each variant. First one that returns 200 tells us
 * the trigger.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/investigate_kdl_500.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

async function tryCreate(label, kdl) {
  log(`\n--- VARIANT: ${label} ---`);
  log(`  KDL length: ${kdl.length}`);
  const r = await fetch(`${BASE}/bot`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ name: `bisect-${label}-${Date.now()}`, importKdl: kdl }),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  log(`  POST /bot → ${r.status} ${r.ok ? '✅' : '❌'}`);
  if (!r.ok) log(`  body: ${t.slice(0, 300)}`);
  if (r.ok) {
    const id = j.id || j.bot?.id;
    log(`  CREATED bot ${id} — note this for cleanup later`);
    return { ok: true, id };
  }
  return { ok: false };
}

// Normalizations
function stripDupeZIndex(kdl) {
  // Within each `{ ... }` block, keep only first `__zIndex N` line.
  // Operates line-by-line tracking brace depth.
  const lines = kdl.split('\n');
  const stack = [false]; // bool: zIndex seen at this depth
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    if (/^__zIndex\s/.test(trimmed)) {
      const top = stack.length - 1;
      if (stack[top]) continue; // skip duplicate
      stack[top] = true;
    }

    out.push(line);

    // adjust stack
    for (let i = 0; i < opens; i++) stack.push(false);
    for (let i = 0; i < closes; i++) {
      stack.pop();
      if (stack.length === 0) stack.push(false);
    }
  }
  return out.join('\n');
}

function stripGlobalAgentTools(kdl) {
  // Remove the `globalAgentTools { ... }` block from anywhere in the KDL.
  return kdl.replace(/^\s*globalAgentTools\s*\{[^}]*\}\s*$/gm, '');
}

function stripUiMetadata(kdl) {
  // Remove __zIndex and __position lines entirely.
  return kdl.replace(/^\s*__zIndex\s.*$/gm, '').replace(/^\s*__position\s.*$/gm, '');
}

async function main() {
  const baseline = fs.readFileSync(path.join(REPO_ROOT, 'shared/logs/launch_kdl.kdl'), 'utf8');
  log(`=== KDL 500 INVESTIGATION ===`);
  log(`baseline length: ${baseline.length}`);

  // V0: baseline (control)
  await tryCreate('V0_baseline', baseline);

  // V1: strip dupe __zIndex
  const v1 = stripDupeZIndex(baseline);
  const removed1 = baseline.split('\n').length - v1.split('\n').length;
  log(`\n  V1 prep: removed ${removed1} duplicate __zIndex lines (delta length ${baseline.length - v1.length})`);
  const r1 = await tryCreate('V1_dedupe_zIndex', v1);
  if (r1.ok) { log('\n  ✅ ROOT CAUSE: duplicate __zIndex within blocks'); return; }

  // V2: also strip globalAgentTools
  const v2 = stripGlobalAgentTools(v1);
  log(`\n  V2 prep: stripped globalAgentTools block (delta length ${v1.length - v2.length})`);
  const r2 = await tryCreate('V2_no_globalAgentTools', v2);
  if (r2.ok) { log('\n  ✅ ROOT CAUSE: globalAgentTools block (after dedupe)'); return; }

  // V3: strip ALL UI metadata
  const v3 = stripUiMetadata(v2);
  log(`\n  V3 prep: stripped all __zIndex + __position (delta length ${v2.length - v3.length})`);
  const r3 = await tryCreate('V3_no_ui_metadata', v3);
  if (r3.ok) { log('\n  ✅ ROOT CAUSE: UI metadata (additional)'); return; }

  // V4: same as V3 with explicit \r\n normalization
  const v4 = v3.replace(/\r\n/g, '\n');
  if (v4 !== v3) {
    log(`\n  V4 prep: normalized line endings`);
    const r4 = await tryCreate('V4_lf_normalized', v4);
    if (r4.ok) { log('\n  ✅ ROOT CAUSE: line endings'); return; }
  }

  log('\n  ❌ All four normalizations failed. Issue is deeper (likely Scenario or duplicate-id node).');

  // Save the cleaned versions for further bisect
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/launch_kdl_v1_dedupe.kdl'), v1);
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/launch_kdl_v3_clean.kdl'), v3);
  log('  saved → shared/logs/launch_kdl_v1_dedupe.kdl, launch_kdl_v3_clean.kdl');
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
