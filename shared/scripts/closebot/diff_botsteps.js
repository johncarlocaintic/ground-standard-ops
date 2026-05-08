/**
 * Diff botSteps between live launch bot and a fresh duplicate.
 *
 * Definitive answer to: does /duplicate actually copy the workflow content,
 * or is it making an empty shell?
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

(async () => {
  console.log(`=== botSteps diff: live launch vs fresh duplicate ===\n`);

  // 1. Get live launch latest version
  const liveDet = await req('GET', `/bot/${LAUNCH}`);
  const liveVer = (liveDet.json.versions || []).slice(-1)[0]?.version || '0.0.1';
  console.log(`[1] live launch latest version: ${liveVer}`);

  console.log(`[2] GET /bot/${LAUNCH}/steps?botVersion=${liveVer}`);
  const liveSteps = await req('GET', `/bot/${LAUNCH}/steps?botVersion=${liveVer}`);
  console.log(`    → ${liveSteps.status}, payload size: ${liveSteps.raw.length} chars`);
  if (!liveSteps.ok) { console.log(liveSteps.raw.slice(0, 300)); return; }
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/diff_live_steps.json'), JSON.stringify(liveSteps.json, null, 2));
  console.log(`    saved → shared/logs/diff_live_steps.json`);
  console.log(`    top-level keys: ${Object.keys(liveSteps.json).join(', ')}`);
  console.log(`    nodes: ${(liveSteps.json.nodes || []).length}`);
  console.log(`    edges: ${(liveSteps.json.edges || []).length}`);
  console.log(`    customTools: ${(liveSteps.json.customTools || []).length}`);
  console.log(`    enabledGlobalToolNames: ${JSON.stringify(liveSteps.json.enabledGlobalToolNames)}`);
  console.log('');

  // 3. Duplicate
  console.log(`[3] /duplicate`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  if (!dup.ok) { console.log(`duplicate failed: ${dup.status}`); return; }
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`    new bot: ${id}`);
  await req('PUT', `/bot/${id}`, { name: `[DIFF-DIAG] ${new Date().toISOString().slice(11, 19)}` });

  // 4. Get fresh duplicate's steps
  const freshDet = await req('GET', `/bot/${id}`);
  const freshVer = (freshDet.json.versions || []).slice(-1)[0]?.version || '0.0.1';
  console.log(`[4] fresh duplicate latest version: ${freshVer}`);

  console.log(`[5] GET /bot/${id}/steps?botVersion=${freshVer}`);
  const freshSteps = await req('GET', `/bot/${id}/steps?botVersion=${freshVer}`);
  console.log(`    → ${freshSteps.status}, payload size: ${freshSteps.raw.length} chars`);
  if (!freshSteps.ok) { console.log(freshSteps.raw.slice(0, 300)); return; }
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/diff_fresh_steps.json'), JSON.stringify(freshSteps.json, null, 2));
  console.log(`    saved → shared/logs/diff_fresh_steps.json`);
  console.log(`    top-level keys: ${Object.keys(freshSteps.json).join(', ')}`);
  console.log(`    nodes: ${(freshSteps.json.nodes || []).length}`);
  console.log(`    edges: ${(freshSteps.json.edges || []).length}`);
  console.log(`    customTools: ${(freshSteps.json.customTools || []).length}`);
  console.log(`    enabledGlobalToolNames: ${JSON.stringify(freshSteps.json.enabledGlobalToolNames)}`);
  console.log('');

  // 6. Side-by-side comparison
  console.log(`[6] Side-by-side comparison:`);
  console.log(`    payload size:           live=${liveSteps.raw.length}  fresh=${freshSteps.raw.length}  diff=${liveSteps.raw.length - freshSteps.raw.length}`);
  console.log(`    nodes count:            live=${(liveSteps.json.nodes || []).length}  fresh=${(freshSteps.json.nodes || []).length}`);
  console.log(`    edges count:            live=${(liveSteps.json.edges || []).length}  fresh=${(freshSteps.json.edges || []).length}`);
  console.log(`    customTools count:      live=${(liveSteps.json.customTools || []).length}  fresh=${(freshSteps.json.customTools || []).length}`);
  console.log(`    variables count:        live=${(liveSteps.json.variables || []).length}  fresh=${(freshSteps.json.variables || []).length}`);
  console.log(`    enabledGlobalToolNames: live=${JSON.stringify(liveSteps.json.enabledGlobalToolNames)}  fresh=${JSON.stringify(freshSteps.json.enabledGlobalToolNames)}`);
  console.log('');

  // 7. If structures match, sample a node title from both to verify content
  if ((liveSteps.json.nodes || []).length === (freshSteps.json.nodes || []).length && (liveSteps.json.nodes || []).length > 0) {
    console.log(`[7] First few node IDs/titles from each:`);
    const showLive = (liveSteps.json.nodes || []).slice(0, 3);
    const showFresh = (freshSteps.json.nodes || []).slice(0, 3);
    for (let i = 0; i < showLive.length; i++) {
      const ln = showLive[i], fn = showFresh[i];
      console.log(`    [${i}] live id=${ln.id} title="${ln.title || ln.Title || '?'}"`);
      console.log(`        fresh id=${fn.id} title="${fn.title || fn.Title || '?'}"`);
    }
    console.log('');
  }

  // 8. Verdict
  const sameNodes = JSON.stringify(liveSteps.json.nodes) === JSON.stringify(freshSteps.json.nodes);
  const sameEdges = JSON.stringify(liveSteps.json.edges) === JSON.stringify(freshSteps.json.edges);
  console.log(`[8] Verdict:`);
  console.log(`    nodes JSON equal:       ${sameNodes ? '✅' : '❌'}`);
  console.log(`    edges JSON equal:       ${sameEdges ? '✅' : '❌'}`);
  if (sameNodes && sameEdges) {
    console.log(`    → /duplicate IS copying the workflow content. Issue is elsewhere.`);
  } else {
    console.log(`    → /duplicate is NOT fully copying the workflow. Run a deeper diff to see what's missing.`);
  }

  console.log(`\nProbe bot: ${id}`);
})();
