/**
 * gs_bot_booked_tag_inject.mjs
 * Appends "After booking confirmed, use @@[Update Tags] to add 'bot booked' tag"
 * to n30_book.Instructions + Sections[0].Body on all live GS bots.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_bot_booked_tag_inject.mjs
 */

const CB_KEY = process.env.CB_GS_API_KEY;
const BASE = 'https://api.closebot.com';
const SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const TAG_APPEND = '\n\nAfter the booking is confirmed successfully, use @@[Update Tags] to add the \'bot booked\' tag to this contact.';

async function cb(method, ep, body) {
  const r = await fetch(BASE + ep, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { ok: r.ok, status: r.status, json: j };
}

// Get all bots
const botsRes = await cb('GET', '/bot?page=1&limit=200');
const allBots = Object.values(botsRes.json).filter(b => b && typeof b === 'object' && b.id);

// Filter to live (non-sandbox, non-test)
const liveBots = allBots.filter(b => {
  if (!b.name || b.name.startsWith('[TEST]')) return false;
  const srcs = b.sources || [];
  return srcs.some(s => s.id && s.id !== SANDBOX);
});

console.log(`Live bots to patch: ${liveBots.length}`);

let passed = 0, failed = 0;

for (const bot of liveBots) {
  const { id, name } = bot;
  process.stdout.write(`\n[${name}] `);

  // Get latest version
  const botInfo = await cb('GET', `/bot/${id}`);
  const versions = botInfo.json.versions || [];
  if (!versions.length) { console.log('SKIP — no versions'); failed++; continue; }
  const latest = versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0].version;

  // Get steps
  const steps = await cb('GET', `/bot/${id}/steps?botVersion=${latest}`);
  if (!steps.ok) { console.log(`SKIP — steps ${steps.status}`); failed++; continue; }

  const nodes = steps.json.nodes || [];
  const n30 = nodes.find(n => n.id === 'n30_book');
  if (!n30) { console.log('SKIP — no n30_book'); failed++; continue; }

  // Check if already patched
  if ((n30.data.Instructions || '').includes('bot booked')) {
    console.log('SKIP — already has bot booked tag');
    passed++;
    continue;
  }

  // Append instruction
  const orig = n30.data.Instructions || '';
  n30.data.Instructions = orig + TAG_APPEND;

  // Also update Sections[0].Body if it mirrors Instructions
  const sec = n30.data.Sections?.[0];
  if (sec) sec.Body = (sec.Body || '') + TAG_APPEND;

  // Ensure EnableAddTag is on
  n30.data.EnableAddTag = true;

  // POST /save
  const saveBody = {
    botSteps: {
      nodes: steps.json.nodes,
      edges: steps.json.edges,
      variables: steps.json.variables,
      customTools: steps.json.customTools,
      enabledGlobalToolNames: steps.json.enabledGlobalToolNames,
    },
    layoutOnly: false,
  };

  const save = await cb('POST', `/bot/${id}/save`, saveBody);
  if (!save.ok) {
    console.log(`SAVE FAIL ${save.status} — ${JSON.stringify(save.json).slice(0, 150)}`);
    failed++;
    continue;
  }

  // Publish
  const pub = await cb('POST', `/bot/${id}/publish`, {});
  if (!pub.ok) {
    console.log(`PUBLISH FAIL ${pub.status} — ${JSON.stringify(pub.json).slice(0, 150)}`);
    failed++;
    continue;
  }

  const newVer = pub.json.version || save.json.version || '?';
  console.log(`PASS → v${newVer}`);
  passed++;

  // Brief pause to avoid hammering
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\n=== Done: ${passed} passed, ${failed} failed ===`);
