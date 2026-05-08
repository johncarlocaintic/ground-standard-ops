/**
 * Enumerate every "Extra Prompt"-class field across the deployed v3.16 bot.
 * Pulls live KDL from the API and lists: node ID, node type, field name, length, full content.
 * Writes before/after snapshots we can diff.
 */
import fs from 'fs';
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const BOT = process.env.AUDIT_BOT_ID || 'bot_OMZ0C13BAHR82UIY';
const OUT = process.env.AUDIT_OUT || 'shared/logs/gs_audit_prompts_before.txt';

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: { 'X-CB-KEY': key } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, raw: t }; }
}

(async () => {
  const k = await api(`/bot/${BOT}/export`);
  if (!k.ok) { console.error('export failed', k.status); process.exit(1); }
  const kdl = typeof k.json === 'string' ? k.json : (k.json.kdl || k.json.exportKdl);
  fs.writeFileSync(`shared/logs/gs_audit_kdl_${BOT}.kdl`, kdl);

  const out = [];
  out.push(`=== EXTRA-PROMPT-CLASS FIELD AUDIT — ${BOT} ===`);
  out.push(`Pulled: ${new Date().toISOString()}`);
  out.push(`KDL size: ${kdl.length} chars`);
  out.push('');

  // Walk the KDL line by line tracking current node context
  const lines = kdl.split('\n');
  let currentNode = { type: null, id: null, line: 0 };
  let depth = 0;
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Detect node headers: "NodeType id=\"...\" {"
    const nodeMatch = line.match(/^([A-Z][A-Za-z]+)\s+id="([^"]+)"\s*\{/);
    if (nodeMatch) { currentNode = { type: nodeMatch[1], id: nodeMatch[2], line: i + 1 }; continue; }

    // Fields of interest
    //   Prompt "..."        (Objective, Statement-AI, Tool nodes)
    //   ExtraPrompt "..."   (Conversation)
    //   followUpExtraPrompt (bot root — pulled separately)
    const fieldMatch = line.match(/^\s+(Prompt|ExtraPrompt)\s+"((?:[^"\\]|\\.)*)"/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const content = fieldMatch[2];
      findings.push({
        line: i + 1,
        nodeType: currentNode.type,
        nodeId: currentNode.id,
        field: fieldName,
        length: content.length,
        content,
      });
    }
  }

  out.push(`Total "Extra-Prompt-class" fields found: ${findings.length}`);
  out.push(`  Prompt fields: ${findings.filter(f => f.field === 'Prompt').length}`);
  out.push(`  ExtraPrompt fields: ${findings.filter(f => f.field === 'ExtraPrompt').length}`);
  out.push('');
  out.push('--- SUMMARY TABLE ---');
  out.push('line | node_type          | node_id                        | field        | len  | content (first 100)');
  out.push('-----+--------------------+--------------------------------+--------------+------+------------------');
  for (const f of findings) {
    const preview = f.content.length > 100 ? f.content.slice(0, 100) + '...' : f.content;
    const previewSafe = preview.replace(/\n/g, ' ').replace(/"/g, '\\"');
    out.push(`${String(f.line).padStart(4)} | ${(f.nodeType || '?').padEnd(18)} | ${(f.nodeId || '?').padEnd(30)} | ${f.field.padEnd(12)} | ${String(f.length).padStart(4)} | ${previewSafe}`);
  }
  out.push('');
  out.push('--- FULL CONTENT ---');
  for (const f of findings) {
    out.push('');
    out.push(`[line ${f.line}] ${f.nodeType} ${f.nodeId} — ${f.field} (${f.length} chars)`);
    out.push(f.content);
  }

  fs.writeFileSync(OUT, out.join('\n'));
  console.log(`Wrote ${findings.length} findings → ${OUT}`);
  console.log('');
  // Echo summary to stdout so it's visible without a Read call
  console.log(out.slice(0, 15 + findings.length).join('\n'));
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
