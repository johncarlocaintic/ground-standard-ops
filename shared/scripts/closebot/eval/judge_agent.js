/**
 * Judge Agent v2 — holistic LLM cross-reference of a bot test run.
 *
 * Methodology principle: each test run has a UNIQUE KEY (the email fingerprint, a
 * 4-char random embedded in the test identity's email). The judge cross-references
 * artifacts from BOTH systems using that key:
 *
 *   ─ CloseBot side ───────────────────────────────────────
 *   - run_id              (orchestrator's identifier)
 *   - leadId              (CloseBot test session ID)
 *   - transcript          (lead/bot messages)
 *   - tool_call_log       (every tool the bot called, with args + result + node)
 *   - frontend_nodes      (which n10/n20/n30 nodes the bot actually touched)
 *
 *   ─ GHL side ──────────────────────────────────────────
 *   - contact             (firstName, lastName, email, phone, DOB, tags, dateAdded, dateUpdated)
 *   - custom_fields_named (resolved with human-readable field names)
 *   - appointments        (id, calendar_name, title, start/end, status)
 *
 *   ─ Persona ──────────────────────────────────────────
 *   - persona_id, opening_message, brief
 *
 * The judge cross-references claim-by-claim:
 *   - "Bot said X in conversation" → "Tool log shows the actual call" → "GHL has the result?"
 *   - Discrepancies between any of these layers ARE the bug.
 *
 * Output: judge_assessment.json with per-claim consistency, data gaps,
 *         scenario misfires, behavioral issues, and a production-safety verdict.
 */
import fs from 'fs';

function getEnv(k) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
  return process.env[k];
}

function buildPrompt({ test_key, closebot, ghl, persona, rubric }) {
  const transcriptBlock = closebot.transcript.map((m, i) =>
    `[T${i + 1}] ${m.sender.toUpperCase()}: ${m.message}`
  ).join('\n');

  const toolCallBlock = closebot.tool_call_log.length
    ? closebot.tool_call_log.map(tc => `  • [node:${tc.frontend_node_id || '?'}] ${tc.tool}(${tc.args.slice(0, 220)}) → ${(tc.result || '').slice(0, 100)}`).join('\n')
    : '  (none)';

  const nodesBlock = closebot.frontend_nodes_touched.length
    ? closebot.frontend_nodes_touched.join(', ')
    : '(none recorded)';

  const customFieldsBlock = (ghl?.custom_fields_named || []).length
    ? ghl.custom_fields_named.map(f => `  • "${f.name}" (${f.id}) = ${JSON.stringify(f.value)}`).join('\n')
    : '  (none populated)';

  const appointmentsBlock = (ghl?.appointments || []).length
    ? ghl.appointments.map(a => `  • id=${a.id}, calendar="${a.calendar_name || a.calendarId}", title="${a.title}", start=${a.startTime}, end=${a.endTime}, status=${a.appointmentStatus || a.status}`).join('\n')
    : '  (none)';

  const ghlBlock = ghl?.contact ? `GHL CONTACT (the truth from the CRM):
  - id:           ${ghl.contact.id}
  - firstName:    ${ghl.contact.firstName ?? '(empty)'}
  - lastName:     ${ghl.contact.lastName ?? '(empty)'}
  - email:        ${ghl.contact.email ?? '(empty)'}
  - phone:        ${ghl.contact.phone ?? '(empty — always null in test sessions by design; CloseBot intentionally does not write phone for lead_test_* leads)'}
  - dateOfBirth:  ${ghl.contact.dateOfBirth ?? '(empty)'}
  - tags:         ${(ghl.contact.tags || []).join(', ') || '(none)'}
  - dateAdded:    ${ghl.contact.dateAdded ?? '?'}
  - dateUpdated:  ${ghl.contact.dateUpdated ?? '?'}
  - customFields:
${customFieldsBlock}
GHL APPOINTMENTS:
${appointmentsBlock}` : `GHL CONTACT: NOT FOUND in CRM (lookup tried email-fingerprint "${test_key.email_fingerprint}" with retries; either contact creation failed or eventual-consistency lag exceeded retry window — the bot may have actually booked correctly; we just couldn't verify)`;

  return `You are a strict judge cross-referencing a CloseBot AI agent's behavior against the actual CRM (GHL) state. Your job is to find DISCREPANCIES between what the bot said in chat, what it actually did via tool calls, and what landed in the CRM.

UNIQUE TEST KEY (use this to identify what's relevant to this run):
  - run_id:             ${test_key.run_id}
  - email_fingerprint:  ${test_key.email_fingerprint}  (4-char random, embedded in test email)
  - lead_id (CloseBot): ${test_key.lead_id}
  - test_identity:      ${test_key.test_identity_summary}

PERSONA EXPECTED:
  - id: ${persona.persona_id}
  - opener: "${persona.opening_message}"
  - brief: ${persona.brief}

═══════════════════════════════════════════════════════════
CLOSEBOT SIDE (what the bot SAID and what it ACTUALLY DID)
═══════════════════════════════════════════════════════════

TRANSCRIPT (${closebot.transcript.length} messages):
${transcriptBlock}

BOT'S TOOL CALLS (server-side, what fired):
${toolCallBlock}

FRONTEND NODES THE BOT TOUCHED:
  ${nodesBlock}

═══════════════════════════════════════════════════════════
GHL SIDE (what landed in the CRM)
═══════════════════════════════════════════════════════════

${ghlBlock}

═══════════════════════════════════════════════════════════
ANALYSIS GUIDELINES
═══════════════════════════════════════════════════════════

For every concrete claim the bot made (booking confirmed, info captured, slot picked), check it against BOTH:
  1. The tool call log — did the corresponding tool actually fire? With what args? With what result?
  2. The GHL state — does the resulting state match the claim?

Common discrepancies to surface:
  - **Fabrication**: bot says "you're booked Tuesday 6:30 PM" but no appointment in GHL OR appointment is for a different date/time.
  - **Field gap (chat → tool)**: bot collected email/phone/DOB; but no update_contact fired in tool log. Bot didn't actually save what it received.
  - **Field gap (tool → GHL)**: bot called update_contact with success result; but GHL contact has empty field. (This is a downstream GHL workflow issue, not a bot issue. Surface it but classify correctly.) EXCEPTION: phone is always null in GHL for test sessions — CloseBot intentionally does not set phone on lead_test_* leads. Do NOT flag missing phone as a field gap.
  - **Slot mismatch**: bot says "Tuesday 5/5 at 6:30 PM" but book_appointment tool returned a different slot AND the GHL appointment is for a different time. Bot didn't catch the mismatch in the tool result.
  - **Scenario misfire**: bot triggered "Self-Enrolling Minor" on a 32-year-old. Wrong scenario.
  - **Node skipping/stuck**: bot's frontend_nodes_touched should include n10_intro, n20_details, n30_book in sequence for a happy-path booking. Skipping nodes or staying stuck in n10_intro for the entire conversation signals a routing bug.

APPROVED BEHAVIORS — do NOT flag these as issues:
  - **Persistent required-field collection**: Bot repeating a required-field ask (DOB, name, phone, email) multiple times when the lead refuses is CORRECT behavior. The bot must collect the info or the lead quits — there is no fallback. Do not classify as a behavioral issue.
  - **Phone null in GHL**: GHL contact.phone is always null for test sessions. CloseBot intentionally does not write phone on lead_test_* leads (confirmed by CloseBot dev 2026-05-12). Never flag this as a field gap, fabrication, or data quality issue.
  - **Email +alias suffix in GHL**: CloseBot intentionally appends a numeric alias suffix to all emails it processes (e.g. lead said "jane@example.com", GHL shows "jane+12345678@example.com"). This applies to both test emails and real emails including parent emails in kid-only flows. The base address matches — the suffix is a CloseBot platform behavior, not a bot error. Never flag this as a field gap, fabrication, or data quality issue.
  - **Bot silence after hostile escalation = handoff success**: If the lead was hostile or aggressive and the bot stops responding (no further messages), that IS the correct behavior — the Aggression scenario fired Stop Responding. Do not flag as "failed to trigger handoff" or "conversation continued without handoff." Silence after hostility = handoff succeeded.

Severity calibration:
  - **critical**: customer would experience this directly (fake booking, wrong appointment time, lost contact info)
  - **moderate**: data quality issue not immediately customer-visible (e.g. DOB saved in wrong format but appointment booked correctly)
  - **minor**: cosmetic (bot said "see you tonight" when booking is tomorrow morning)

If GHL contact was NOT FOUND despite retries, do NOT assume fabrication. Set verdict = "production_safety_unknown".

Return ONLY valid JSON in this exact shape:

{
  "test_key": {
    "run_id": "${test_key.run_id}",
    "email_fingerprint": "${test_key.email_fingerprint}",
    "lead_id": "${test_key.lead_id}"
  },
  "verdict": "pass" | "fail" | "warning" | "production_safety_unknown",
  "severity": "critical" | "moderate" | "minor" | null,
  "summary": "<one-sentence diagnosis>",
  "bot_claims": [
    {
      "claim": "<text the bot said>",
      "tool_call_evidence": "<tool that should have fired and its result, or null>",
      "ghl_evidence": "<what GHL has, or null/not-found>",
      "consistent": true | false,
      "discrepancy_type": "fabrication" | "field_gap_chat_to_tool" | "field_gap_tool_to_ghl" | "slot_mismatch" | null,
      "notes": "<why or why not>"
    }
  ],
  "data_consistency": {
    "collected_in_chat": ["<field>"],
    "tool_call_succeeded_for": ["<field>"],
    "persisted_to_ghl": ["<field>"],
    "gaps_chat_to_tool": ["<field bot collected but never called update_contact for>"],
    "gaps_tool_to_ghl": ["<field tool succeeded but GHL is empty>"]
  },
  "tool_call_health": {
    "expected_based_on_conversation": ["<tool>"],
    "actually_called": ["<tool>"],
    "missing": ["<tool>"],
    "redundant_or_unexpected": ["<tool>"]
  },
  "node_routing": {
    "expected_node_sequence": ["n10_intro", "n20_details", "n30_book"],
    "actual_nodes_touched": ["<node>"],
    "skipped": ["<node>"],
    "stuck_in_node": "<node or null>"
  },
  "scenarios_fired": [
    { "name": "<scenario name>", "fired_correctly": true | false, "reason": "<why>" }
  ],
  "bot_behavioral_issues": [
    { "issue": "<short description>", "evidence": "<turn ref or quote>", "severity": "critical | moderate | minor" }
  ],
  "production_safety": {
    "safe_for_real_customers": true | false | null,
    "reasons": ["<concrete reason>"],
    "ghl_lookup_succeeded": ${!!(ghl?.contact)}
  }
}

Be precise. Quote turns or specific GHL fields. If you can't verify a claim because of missing data, say so explicitly — don't assume fabrication.`;
}

/**
 * Extract bot tool calls and frontend nodes from events.json.
 * Handles both legacy (tool_use, logs with "Tool ... executed") and new (activity) formats.
 */
export function extractClosebotData(events, transcript, leadId) {
  const calls = [];
  const seenIds = new Set();
  const nodesTouched = new Set();

  for (const e of events || []) {
    if (e.type === 'tool_use') {
      const id = `${e.toolName}|${e.arguments?.slice(0, 50)}`;
      if (e.frontendNodeId) nodesTouched.add(e.frontendNodeId);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      calls.push({
        tool: e.toolName,
        args: typeof e.arguments === 'string' ? e.arguments : JSON.stringify(e.arguments || {}),
        result: e.result || '',
        frontend_node_id: e.frontendNodeId || null,
      });
    }
    if (e.type === 'action' && e.action?.frontendNodeId) {
      nodesTouched.add(e.action.frontendNodeId);
    }
    if (e.type === 'logs' && Array.isArray(e.logs)) {
      for (const lg of e.logs) {
        const m = (lg.message || '').match(/^Tool (\S+) args: (.+) executed: (.+)$/);
        if (m) {
          const id = `${m[1]}|${m[2].slice(0, 50)}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          calls.push({ tool: m[1], args: m[2], result: m[3], frontend_node_id: null });
        }
      }
    }
  }

  return {
    transcript,
    tool_call_log: calls,
    frontend_nodes_touched: Array.from(nodesTouched),
    lead_id: leadId,
  };
}

/**
 * Resolve custom field IDs to their human-readable names.
 */
export async function resolveCustomFieldNames(customFields, ghlToken, locationId) {
  if (!customFields?.length) return [];
  const r = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields`, {
    headers: {
      'Authorization': `Bearer ${ghlToken}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  if (!r.ok) return customFields.map(f => ({ ...f, name: '?' }));
  const j = await r.json();
  const nameMap = Object.fromEntries((j.customFields || []).map(f => [f.id, f.name]));
  return customFields
    .filter(f => f.value !== null && f.value !== undefined && f.value !== '')
    .map(f => ({ id: f.id, name: nameMap[f.id] || '?', value: f.value }));
}

/**
 * Resolve calendar IDs in appointments to readable names.
 */
export async function resolveAppointmentCalendars(appointments, ghlToken, locationId) {
  if (!appointments?.length) return [];
  const r = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${locationId}`, {
    headers: {
      'Authorization': `Bearer ${ghlToken}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  if (!r.ok) return appointments.map(a => ({ ...a, calendar_name: a.calendarId }));
  const j = await r.json();
  const calMap = Object.fromEntries((j.calendars || []).map(c => [c.id, c.name]));
  return appointments.map(a => ({ ...a, calendar_name: calMap[a.calendarId] || a.calendarId }));
}

/**
 * Extract email fingerprint from a tester-generated email.
 */
export function extractFingerprint(email) {
  if (!email) return null;
  const m = email.match(/^tester\.[a-z]+\.([a-z0-9]{2,8})@/i);
  return m ? m[1].toLowerCase() : null;
}

export async function runJudge({ test_key, closebot, ghl, persona, rubric }) {
  const prompt = buildPrompt({ test_key, closebot, ghl, persona, rubric });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getEnv('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a strict judge cross-referencing a CloseBot conversation against actual CRM (GHL) state. Find discrepancies between what the bot said, what it actually did via tools, and what landed in GHL. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Judge API returned non-JSON: ${text.slice(0, 400)}`); }

  if (!res.ok) {
    throw new Error(`Judge API error ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error(`Judge API returned no content`);

  let assessment;
  try { assessment = JSON.parse(raw); }
  catch { throw new Error(`Judge agent returned non-JSON: ${raw.slice(0, 400)}`); }

  return { assessment, prompt_chars: prompt.length };
}

// Legacy export name for back-compat with the orchestrator's previous import.
export { resolveCustomFieldNames as enrichContactWithFieldNames };
