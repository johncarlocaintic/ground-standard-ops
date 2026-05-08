/**
 * QA Agent — scores a transcript against a rubric.
 *
 * Inputs (programmatic):
 *   - rubric: parsed JSON object (see shared/scripts/closebot/rubrics/*.json)
 *   - transcript: array of { sender: 'lead'|'bot', message: string }
 *   - meta: { run_id, bot_id, persona_id }
 *
 * Output: a score.json object matching the QA output schema
 *   (see tasks/projects/closebot-test-architecture.md, "Final QA agent output schema")
 *
 * Severity policy passed to the model: "Severity does not change the bar for
 * pass/fail. Score each checkpoint strictly against its look_for criterion.
 * Severity only affects what happens downstream."
 *
 * Currently uses gpt-4o for scoring. Swap to Claude when ANTHROPIC_API_KEY available.
 */
import fs from 'fs';

function getEnv(k) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
  return process.env[k];
}

function buildPrompt(rubric, transcript, meta) {
  const checkpointBlock = rubric.checkpoints.map(c =>
    `- ${c.id} (${c.category}, ${c.level}): ${c.description}\n    look_for: ${c.look_for}`
  ).join('\n');

  const transcriptBlock = transcript.map((m, i) =>
    `[T${i + 1}] ${m.sender.toUpperCase()}: ${m.message}`
  ).join('\n');

  const ageBlock = (meta.age_annotations && meta.age_annotations.length)
    ? `\nCALCULATED AGES (deterministic — trust these over your own date math):\n` +
      meta.age_annotations.map(a => `- T${a.turn}: DOB ${a.dob_iso} → age ${a.age} as of ${a.age_as_of}`).join('\n') +
      `\n`
    : '';

  return `You are a strict QA evaluator scoring a chatbot transcript against a rubric.

RUBRIC (${rubric.rubric_id}):
${checkpointBlock}

TRANSCRIPT (${transcript.length} messages):
${transcriptBlock}
${ageBlock}
METADATA:
- run_id: ${meta.run_id}
- bot_id: ${meta.bot_id}
- persona_id: ${meta.persona_id}

INSTRUCTIONS:
1. Score every checkpoint with one verdict: "pass" | "fail" | "flag" | "n/a".
   - pass = checkpoint satisfied
   - fail = checkpoint violated (clear evidence)
   - flag = something off but not a clean violation (tone drift, borderline case)
   - n/a = the scenario this checkpoint covers did not arise in this transcript
2. SEVERITY DOES NOT CHANGE THE BAR. Score each checkpoint strictly against its look_for criterion. Severity only affects downstream blocker rules.
3. For fail/flag verdicts, cite the turn(s) and quote the offending text in "evidence".
4. For pass/n/a verdicts, leave evidence and notes as null.
5. "next_directive" is your recommendation for the next test conversation (free-form text, 1-3 sentences). Focus on a single failure or coverage gap.

Return ONLY valid JSON in this exact shape (no markdown, no commentary):

{
  "run_id": "${meta.run_id}",
  "bot_id": "${meta.bot_id}",
  "persona_id": "${meta.persona_id}",
  "transcript_turns": ${transcript.length},
  "results": [
    { "checkpoint_id": "...", "verdict": "pass|fail|flag|n/a", "evidence": null | "...", "notes": null | "..." }
  ],
  "overall_verdict": "pass|fail",
  "blocker_fails": 0,
  "standard_fails": 0,
  "flags": 0,
  "next_directive": "..."
}

Compute overall_verdict as "fail" if ANY blocker checkpoint has verdict "fail", else "pass".
Compute blocker_fails / standard_fails / flags by counting verdict matches against checkpoint level.`;
}

export async function runQa(rubric, transcript, meta) {
  const prompt = buildPrompt(rubric, transcript, meta);

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
        { role: 'system', content: 'You are a strict QA evaluator. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`QA API returned non-JSON: ${text.slice(0, 400)}`); }

  if (!res.ok) {
    throw new Error(`QA API error ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error(`QA API returned no content: ${JSON.stringify(data).slice(0, 400)}`);

  let score;
  try { score = JSON.parse(raw); }
  catch { throw new Error(`QA agent returned non-JSON content: ${raw.slice(0, 400)}`); }

  return score;
}

export function loadRubric(rubricPath) {
  return JSON.parse(fs.readFileSync(rubricPath, 'utf8'));
}
