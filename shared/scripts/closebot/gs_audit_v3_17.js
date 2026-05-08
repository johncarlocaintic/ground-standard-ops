/**
 * Comprehensive v3.17 audit - enumerate EVERY AI-evaluated or instructional field
 * across the deployed v3.16.2 bot. Writes a full catalog with content + length
 * per field, ready for per-field decision making.
 *
 * Captured fields per node type:
 *   __CONFIG__         : conversationReason, businessInformation, prohibitedWords
 *   MultiObjective/_   : Prompt, Title, Description
 *   Booking            : Title, Description, Prompt (legacy), FailedTag, CalendarName
 *   Statement          : Title, Statement, UseAI
 *   Conversation       : Title, ExtraPrompt
 *   Comparator         : Title, AIExpression, UseAI, ExpressionOperator
 *   AISwitch           : Title, Description, UseAI, AiCases[].CaseName
 *   AILogic            : Title, AiDescription, Variable
 *   ScenarioCustom     : Title, Description, Priority, Threshold
 *   ModifyTags         : Title, TagsToAdd[].Tag
 *   Source/End/etc.    : Title (for context)
 *
 * Output: shared/logs/gs_audit_v3_17_FULL.txt
 */
import fs from 'fs';

const BOT = process.env.AUDIT_BOT_ID || 'bot_S3O4305FQ3GE1AYO';
const OUT = process.env.AUDIT_OUT || 'shared/logs/gs_audit_v3_17_FULL.txt';
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: { 'X-CB-KEY': key } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, raw: t }; }
}

(async () => {
  const k = await api(`/bot/${BOT}/export`);
  if (!k.ok) { console.error('export failed', k.status); process.exit(1); }
  const kdl = typeof k.json === 'string' ? k.json : (k.json.kdl || k.json.exportKdl);
  fs.writeFileSync(`shared/logs/gs_audit_v3_17_kdl_${BOT}.kdl`, kdl);

  const lines = kdl.split('\n');
  const findings = [];
  const nodeStack = []; // track current node id + type
  let inObjective = false;
  let objectiveParent = null;
  let inAiCases = false;

  const push = (category, field, nodeId, nodeType, content, lineNum) => {
    findings.push({ category, field, nodeId, nodeType, content, length: content.length, lineNum });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // __CONFIG__ root fields
    const crMatch = line.match(/^\s*conversationReason\s+"((?:[^"\\]|\\.)*)"/);
    if (crMatch) { push('CONFIG', 'conversationReason', '__CONFIG__', 'config', crMatch[1], lineNum); continue; }
    const biMatch = line.match(/^\s*businessInformation\s+"((?:[^"\\]|\\.)*)"/);
    if (biMatch) { push('CONFIG', 'businessInformation', '__CONFIG__', 'config', biMatch[1], lineNum); continue; }

    // Node opener: "NodeType id=\"...\" {"
    const nodeMatch = line.match(/^([A-Z][A-Za-z]+)\s+id="([^"]+)"\s*\{/);
    if (nodeMatch) {
      nodeStack.push({ type: nodeMatch[1], id: nodeMatch[2] });
      inObjective = false;
      inAiCases = false;
      continue;
    }
    // Close brace - pop
    if (trimmed === '}') {
      if (inAiCases) { inAiCases = false; continue; }
      if (inObjective) { inObjective = false; continue; }
      nodeStack.pop();
      continue;
    }
    // MultiObjective Objectives inner blocks: { on its own line
    if (trimmed === 'Objectives {') { continue; }
    if (trimmed === '_ {' || trimmed === 'AiCases {') {
      if (trimmed === 'AiCases {') inAiCases = true;
      else inObjective = true;
      if (inObjective) objectiveParent = nodeStack[nodeStack.length - 1];
      continue;
    }
    if (trimmed === 'TagsToAdd {' || trimmed === 'TagsToRemove {') { continue; }

    const currentNode = nodeStack[nodeStack.length - 1];
    if (!currentNode) continue;

    // Generic string field capture - matches "FieldName \"content\""
    const fieldMatch = line.match(/^\s+([A-Z][A-Za-z]+)\s+"((?:[^"\\]|\\.)*)"\s*$/);
    if (fieldMatch) {
      const [, fieldName, content] = fieldMatch;
      // Classify by field relevance to over-prompting audit
      if (['Prompt', 'Description', 'Title', 'Statement', 'ExtraPrompt', 'AIExpression', 'AiDescription', 'CaseName', 'CalendarName', 'FailedTag', 'Variable', 'Tag'].includes(fieldName)) {
        const ctx = inObjective ? `${currentNode.id} (Objective inside ${objectiveParent?.id || currentNode.id})` : currentNode.id;
        push(fieldName, fieldName, ctx, currentNode.type, content, lineNum);
      }
    }
  }

  // Write the full audit
  const out = [];
  out.push(`=== VACAVILLE v3.17 AUDIT - ALL AI-EVALUATED + INSTRUCTIONAL FIELDS ===`);
  out.push(`Bot: ${BOT}`);
  out.push(`Pulled: ${new Date().toISOString()}`);
  out.push(`KDL size: ${kdl.length} chars`);
  out.push(`Total fields captured: ${findings.length}`);
  out.push('');

  // Summary by category
  const byCategory = {};
  for (const f of findings) {
    byCategory[f.category] = byCategory[f.category] || [];
    byCategory[f.category].push(f);
  }
  out.push('=== COUNT BY FIELD TYPE ===');
  for (const [cat, arr] of Object.entries(byCategory).sort()) {
    const filled = arr.filter(f => f.length > 0).length;
    const empty = arr.length - filled;
    const totalChars = arr.reduce((s, f) => s + f.length, 0);
    out.push(`  ${cat.padEnd(20)} : ${arr.length} fields (${filled} filled, ${empty} empty, ${totalChars} total chars)`);
  }
  out.push('');

  // Group by node type for the table
  out.push('=== FULL CATALOG (ordered by line in KDL) ===');
  out.push('');
  out.push('line | node_type         | node_id                                  | field           | len  | content (first 120 chars)');
  out.push('-----+-------------------+------------------------------------------+-----------------+------+----------------------------');
  for (const f of findings) {
    const preview = f.content.length > 120 ? f.content.slice(0, 120) + '...' : f.content;
    const previewSafe = preview.replace(/\n/g, ' ').replace(/\|/g, '/');
    out.push(`${String(f.lineNum).padStart(4)} | ${(f.nodeType || '?').padEnd(17)} | ${(f.nodeId || '?').padEnd(40)} | ${f.field.padEnd(15)} | ${String(f.length).padStart(4)} | ${previewSafe}`);
  }
  out.push('');

  // Section per field category with full content
  const prioritySections = ['CONFIG', 'AIExpression', 'AiDescription', 'ExtraPrompt', 'Prompt', 'Statement', 'Description', 'CaseName', 'Title', 'CalendarName', 'FailedTag', 'Variable', 'Tag'];
  out.push('=== FULL CONTENT BY FIELD TYPE ===');
  for (const cat of prioritySections) {
    const items = byCategory[cat];
    if (!items || items.length === 0) continue;
    out.push('');
    out.push(`--- ${cat} (${items.length} fields) ---`);
    for (const f of items) {
      out.push('');
      out.push(`[line ${f.lineNum}] ${f.nodeType} ${f.nodeId} - ${f.field} (${f.length} chars)`);
      out.push(f.content || '(empty)');
    }
  }

  fs.writeFileSync(OUT, out.join('\n'));
  console.log(`Wrote ${findings.length} findings -> ${OUT}`);
  console.log('');
  console.log('COUNT BY FIELD TYPE:');
  for (const [cat, arr] of Object.entries(byCategory).sort()) {
    const filled = arr.filter(f => f.length > 0).length;
    console.log(`  ${cat.padEnd(20)} : ${arr.length} (${filled} filled)`);
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
