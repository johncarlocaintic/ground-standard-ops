/**
 * Full methodology check — single persona run + deep verification report.
 *
 * Steps:
 *   1. Run eval orchestrator with comprehensive_happy_path (full parent + kid + booking)
 *   2. Pull events.json to extract every tool call the bot made
 *   3. Re-query Vacaville GHL for the contact + appointments + custom fields
 *   4. Side-by-side: what bot said it did vs what GHL actually has
 *   5. Print structured report
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const GHL_H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

async function ghl(ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { headers: GHL_H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  console.log(`=== Full methodology check ===\n`);
  console.log(`Persona: comprehensive_happy_path`);
  console.log(`Bot: bot_J56AWZ5TYQI9HKJS (Vacaville PROD - Launch v1.0)`);
  console.log(`Source: src_GDKORXSW4Q8RQUQ8 (Vacaville prod)`);
  console.log(`GHL location: Vacaville (${LOC})\n`);

  // STEP 1: Run eval orchestrator
  console.log(`[STEP 1] Running eval orchestrator...`);
  const startAt = new Date();
  const env = {
    ...process.env,
    CB_TEST_BOT_ID: 'bot_J56AWZ5TYQI9HKJS',
    PERSONA: 'shared/scripts/closebot/personas/vacaville/comprehensive_happy_path.json',
    RUBRIC: 'shared/scripts/closebot/rubrics/vacaville.json',
    MIMIC_SOURCE_ID: 'src_GDKORXSW4Q8RQUQ8',
    ALLOW_PROD_MIMIC: 'true',
  };
  const r = spawnSync('node', [
    '--env-file=.env', '--env-file=clients/ground-standard/.env',
    'shared/scripts/closebot/eval/orchestrator.js',
  ], { env, encoding: 'utf8' });

  if (r.status !== 0) {
    console.log(`orchestrator failed (exit ${r.status}). stderr:`);
    console.log(r.stderr?.slice(0, 1000));
  }

  // Find the latest run dir
  const evalDir = 'shared/logs/eval';
  const runs = fs.readdirSync(evalDir).filter(d => d.includes('comprehensive_happy_path')).sort();
  const latest = runs[runs.length - 1];
  const runDir = path.join(evalDir, latest);
  console.log(`run dir: ${runDir}\n`);

  // STEP 2: Parse events.json for bot tool calls
  const eventsPath = path.join(runDir, 'events.json');
  if (!fs.existsSync(eventsPath)) {
    console.log(`events.json missing — orchestrator never wrote it`);
    return;
  }
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  console.log(`[STEP 2] Bot tool calls extracted from events.json (${events.length} events):`);

  const toolCalls = [];
  for (const e of events) {
    if (e.type === 'logs' && Array.isArray(e.logs)) {
      for (const lg of e.logs) {
        const msg = lg.message || '';
        if (msg.startsWith('Tool ') && msg.includes(' executed: ')) {
          const m = msg.match(/^Tool (\S+) args: (.+) executed: (.+)$/);
          if (m) toolCalls.push({ tool: m[1], args: m[2], result: m[3] });
        }
      }
    }
  }
  for (const tc of toolCalls) {
    console.log(`  ${tc.tool}: ${tc.args.slice(0, 100)} → ${tc.result.slice(0, 100)}`);
  }
  if (toolCalls.length === 0) {
    console.log(`  (no Tool ... executed log entries found)`);
    // Try alternate detection: activity events with agent_tool_use
    const altCalls = [];
    for (const e of events) {
      if (e.type === 'activity' && e.activity) {
        const inner = typeof e.activity === 'string' ? JSON.parse(e.activity) : e.activity;
        if (inner.activity === 'agent_tool_use' && inner.data) {
          const data = typeof inner.data === 'string' ? JSON.parse(inner.data) : inner.data;
          if (data.toolName && data.arguments) altCalls.push({ tool: data.toolName, args: data.arguments, result: data.fullResult || data.result || '' });
        }
      }
    }
    console.log(`  (via activity events: ${altCalls.length})`);
    for (const tc of altCalls.slice(0, 30)) {
      console.log(`    ${tc.tool}: ${tc.args.slice(0, 100)} → ${(tc.result || '').slice(0, 80)}`);
    }
  }
  console.log('');

  // STEP 3: Pull verified score + GHL facts from orchestrator
  let ghlFacts = null;
  const factsPath = path.join(runDir, 'ghl_facts.json');
  if (fs.existsSync(factsPath)) {
    ghlFacts = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
  }
  console.log(`[STEP 3] GHL facts (from orchestrator verifier):`);
  if (ghlFacts) {
    console.log(`  found:        ${ghlFacts.found}`);
    console.log(`  contact_id:   ${ghlFacts.contact_id || '(none)'}`);
    console.log(`  contact_name: ${ghlFacts.contact_name || '(none)'}`);
    console.log(`  contact_email:${ghlFacts.contact_email || '(none)'}`);
    console.log(`  tags:         ${(ghlFacts.tags || []).join(', ') || '(none)'}`);
    console.log(`  custom_fields: ${(ghlFacts.custom_fields || []).length}`);
    for (const f of ghlFacts.custom_fields || []) console.log(`    ${f.id} = ${JSON.stringify(f.value)}`);
    console.log(`  appointments: ${(ghlFacts.appointments || []).length}`);
    for (const a of ghlFacts.appointments || []) console.log(`    ${a.id} | ${a.startTime} | ${a.title} | cal ${a.calendarId}`);
  }
  console.log('');

  // STEP 4: Independent re-query of GHL (catch any race / stale read)
  if (ghlFacts?.contact_id) {
    console.log(`[STEP 4] Independent re-query of GHL contact:`);
    const c = await ghl(`/contacts/${ghlFacts.contact_id}`);
    if (c.ok) {
      const cc = c.json.contact || c.json;
      console.log(`  firstName:    ${cc.firstName}`);
      console.log(`  lastName:     ${cc.lastName}`);
      console.log(`  email:        ${cc.email}`);
      console.log(`  phone:        ${cc.phone}`);
      console.log(`  dateOfBirth:  ${cc.dateOfBirth}`);
      console.log(`  tags:         ${(cc.tags || []).join(', ')}`);
      console.log(`  customFields: ${(cc.customFields || []).filter(f => f.value).length} populated`);
      for (const f of (cc.customFields || []).filter(f => f.value)) console.log(`    ${f.id} = ${JSON.stringify(f.value)}`);
    }
    const a = await ghl(`/contacts/${ghlFacts.contact_id}/appointments`);
    if (a.ok) {
      const appts = a.json.events || a.json.appointments || [];
      console.log(`  appointments: ${appts.length}`);
      for (const ap of appts) console.log(`    ${ap.id} | ${ap.startTime} | ${ap.title} | cal ${ap.calendarId}`);
    }
  }
  console.log('');

  // STEP 5: Side-by-side
  console.log(`[STEP 5] SIDE-BY-SIDE: what bot's tool calls claimed vs what GHL actually has`);
  console.log(`  (full report in ${runDir}/report.md)`);
})().catch(e => console.log(`FATAL: ${e.message}\n${e.stack}`));
