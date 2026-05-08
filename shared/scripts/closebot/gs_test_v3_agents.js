/**
 * Vacaville v3 Multi-Agent Corpus Persona Tests
 * 5 parallel agents, each from a real corpus archetype.
 * Logs all output — do NOT delete logs after run.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const CB = 'https://api.closebot.com';
const OAIK = process.env.OPENAI_API_KEY;
const CB_KEY = process.env.CB_GS_API_KEY;

// v3 bot on VGA source
const BOT_ID = process.env.V3_BOT_ID || 'bot_2XEBD57XFF85PS4D';
const MIMIC_SRC = 'src_GDKORXSW4Q8RQUQ8'; // Vacaville Grappling Academy

const MAX_TURNS = 20;
const BOT_TIMEOUT_MS = 50000;
const DRAIN_MS = 3500;

// ── Corpus-derived personas (authentic to conversation_study.md §1) ──────────

const AGENTS = [
  {
    id: 'A_parent_full_context',
    label: 'Parent-on-behalf, full context',
    opening: "Hi this is Maria. My daughter Sofia is 9. I signed up through an Instagram ad for a trial class. She's been wanting to try jiu-jitsu for a while.",
    persona: `Maria Gonzalez, 34yo parent calling on behalf of daughter Sofia (age 9, DOB March 14, 2016). You are the guardian — YOUR info is the contact record. DOB yourself: June 3, 1990. Email: maria.gonzalez.test@example.invalid. Phone: 707-555-0181. You've been researching BJJ for Sofia for weeks. You are formal, use full sentences, sign off with your name sometimes. When asked about scheduling, say Saturday mornings work best for you. Sofia has never done martial arts before. Confirm the slot if offered specifically.`,
  },
  {
    id: 'B_ultra_terse',
    label: 'Ultra-terse info ping',
    opening: "Price?",
    persona: `Devon, 26yo male. Ultra-terse. 1-3 words per reply MAX. "price?" "how much" "when" "k". No sentences. No pleasantries. DOB Aug 22, 1997. Email: devon.t@example.invalid. Phone: 916-555-0173. You eventually disclose you want the adult class. You'll give info when directly asked but keep it short. If offered a specific time slot, say "sure" or "yeah".`,
  },
  {
    id: 'C_who_is_this',
    label: 'Identity confusion — who is this?',
    opening: "Who is this? How did you get my number?",
    persona: `Chris, 38yo. You have no memory of signing up for anything. You're suspicious at first but once you understand it was from an Instagram ad you dimly remember, you warm up. DOB July 7, 1985. Email: chris.test@example.invalid. Phone: 530-555-0119. You want the adult class — you're curious about grappling but weren't planning to commit today. If offered a slot, say "maybe, let me see".`,
  },
  {
    id: 'D_military',
    label: 'Military / LE — needs-handoff-discount',
    opening: "Hey, I'm an active duty Army soldier stationed at Travis AFB. Saw an ad for a free trial. Interested in the adult class.",
    persona: `Sergeant Marcus Webb, 29yo active duty US Army, Travis Air Force Base. DOB Dec 5, 1995. You mention your military status early and naturally. Email: marcus.webb.test@example.invalid. Phone: 707-555-0202. You are direct, no-nonsense. You want the adult grappling class. If the bot doesn't mention a discount, don't ask for one — just say "ok cool" when they say someone will reach out. End the conversation after the handoff message.`,
  },
  {
    id: 'E_dropin',
    label: 'Drop-in traveler',
    opening: "Hey, I train BJJ at Gracie Sacramento. I'm gonna be in Vacaville for work next weekend. Do you guys do drop-ins?",
    persona: `Jake Torres, 31yo BJJ blue belt from Sacramento, visiting Vacaville for a week for work. DOB April 18, 1994. You are casual, fellow-grappler tone. Email: jake.t.test@example.invalid. Phone: 916-555-0134. You clearly want a drop-in session, not a membership trial. You are friendly but not interested in the full onboarding flow. End naturally after they say someone will reach out.`,
  },
];

function cbH() {
  return { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };
}

async function cb(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: cbH(), body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 300) } }; }
}

async function gptReply(convo, persona) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAIK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are simulating a real person texting a martial arts academy SMS bot. Persona: ${persona}

Rules:
- Stay strictly in character. Never acknowledge you are an AI.
- Reply naturally to whatever the bot just said. Match the persona's voice.
- 1-3 sentences max (or less if the persona is terse).
- Give your real info when asked (use the DOB/email/phone/name in the persona).
- If the bot offers a specific time slot, respond to it directly in character.
- Do NOT volunteer info that hasn't been asked for yet.`,
        },
        ...convo.map(m => ({
          role: m.sender === 'bot' ? 'user' : 'assistant',
          content: m.message,
        })),
      ],
      max_tokens: 100,
      temperature: 0.65,
    }),
  });
  const j = await r.json();
  return j.choices[0].message.content.trim();
}

function startSseReader(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const queue = [];
  let w = null;
  const allEvents = [];
  function deliver(m) {
    if (w) { clearTimeout(w.t); w.resolve(m); w = null; }
    else queue.push(m);
  }
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { if (w) { w.reject(new Error('SSE closed')); w = null; } break; }
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) !== -1) {
          const blk = buf.slice(0, i); buf = buf.slice(i + 2);
          let data = '';
          for (const ln of blk.split('\n')) if (ln.startsWith('data: ')) data = ln.slice(6).trim();
          if (!data) continue;
          try {
            const p = JSON.parse(data);
            if (p.type !== 'ping') allEvents.push(p);
            if (p.type === 'message-sent' && p.sender === 'bot' && p.message?.trim()) deliver(p.message.trim());
          } catch {}
        }
      }
    } catch (e) { if (w) { w.reject(e); w = null; } }
  })();
  return {
    next(to) {
      return new Promise((res, rej) => {
        if (queue.length) return res(queue.shift());
        const t = setTimeout(() => { w = null; rej(new Error(`bot timeout ${to / 1000}s`)); }, to);
        w = { resolve: res, reject: rej, t };
      });
    },
    events: allEvents,
  };
}

async function collect(r) {
  const m = [await r.next(BOT_TIMEOUT_MS)];
  try { while (true) m.push(await r.next(DRAIN_MS)); } catch {}
  return m.join('\n');
}

async function runAgent(agent) {
  const agentLog = path.join(logDir, `v3_test_${agent.id}_${Date.now()}.log`);
  const lines = [];
  function lg(m) {
    const l = `[${new Date().toISOString()}] [${agent.id}] ${m}`;
    console.log(l);
    lines.push(l);
  }

  lg(`=== START: ${agent.label} ===`);

  // Create test session
  const s = await cb('POST', `/bot/${BOT_ID}/testSession`, {});
  if (!s.ok) { lg(`FAIL create session: ${JSON.stringify(s.json)}`); return { agent: agent.id, pass: false, error: 'session create failed' }; }
  const leadId = s.json.leadId;
  lg(`leadId: ${leadId}`);

  // Bind mimicSourceId
  const bind = await cb('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: MIMIC_SRC });
  lg(`mimic bind → ${bind.status}`);

  // Open SSE
  const sseRes = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' },
  });
  const reader = startSseReader(sseRes);

  const convo = [];
  let pass = false;
  let nodesFired = [];

  for (let i = 0; i < MAX_TURNS; i++) {
    const leadMsg = i === 0 ? agent.opening : await gptReply(convo, agent.persona);
    lg(`T${i + 1} LEAD: ${leadMsg}`);
    convo.push({ sender: 'lead', message: leadMsg });

    await cb('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: leadMsg });

    try {
      const botReply = await collect(reader);
      lg(`T${i + 1} BOT:  ${botReply.slice(0, 400)}`);
      convo.push({ sender: 'bot', message: botReply });

      // Pass conditions per agent
      if (agent.id === 'D_military' && /team member|reach out|personally/i.test(botReply)) {
        lg('[PASS] mil/LE/FR handoff message detected'); pass = true; break;
      }
      if (agent.id === 'E_dropin' && /team member|reach out|drop.?in/i.test(botReply)) {
        lg('[PASS] drop-in handoff message detected'); pass = true; break;
      }
      if (agent.id === 'C_who_is_this' && /instagram|social media|ad|signed up|opted in/i.test(botReply)) {
        lg('[PASS] re-intro with source context detected');
        // Don't stop — continue conversation after re-intro
        pass = true;
      }
      if (/appointment booked|confirmed|see you|you're all set|looking forward|great choice/i.test(botReply) && i >= 5) {
        lg('[PASS] booking confirmation detected'); pass = true; break;
      }
      if (/have a great day|take care|see you on the mat|bye!|goodbye/i.test(botReply) && i >= 8) {
        lg('[end] wrap-up detected'); break;
      }
    } catch (e) {
      lg(`T${i + 1} BOT: no reply (${e.message})`);
      break;
    }
  }

  nodesFired = [...new Set(reader.events.filter(e => e.type === 'action').map(e => e.action?.frontendNodeId))].filter(Boolean);
  lg(`\nNodes fired: ${nodesFired.join(', ')}`);
  lg(`\nResult: ${pass ? 'PASS ✅' : 'NEEDS REVIEW ⚠️'}`);
  lg('=== END ===');

  fs.writeFileSync(agentLog, lines.join('\n'));
  lg(`Log saved: ${agentLog}`);

  return { agent: agent.id, label: agent.label, pass, nodesFired, turns: convo.length / 2, logFile: agentLog };
}

async function main() {
  const masterLog = path.join(logDir, `v3_test_SUMMARY_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
  console.log(`\n=== Vacaville v3 Multi-Agent Test ===`);
  console.log(`Bot: ${BOT_ID} | Source: ${MIMIC_SRC}`);
  console.log(`Running ${AGENTS.length} agents concurrently...\n`);

  // Stagger starts by 500ms to avoid race on session creation
  const results = await Promise.all(
    AGENTS.map((a, i) => new Promise(resolve => setTimeout(() => runAgent(a).then(resolve).catch(e => resolve({ agent: a.id, pass: false, error: e.message })), i * 500)))
  );

  const summary = [
    '',
    '=== SUMMARY ===',
    `Bot: ${BOT_ID}`,
    `Source: ${MIMIC_SRC} (Vacaville Grappling Academy)`,
    `Run: ${new Date().toISOString()}`,
    '',
    ...results.map(r => `${r.pass ? '✅ PASS' : '⚠️  REVIEW'} | ${r.agent} — ${r.label || ''} | ${r.turns || '?'} turns | nodes: ${(r.nodesFired || []).join(', ')}`),
    '',
    `${results.filter(r => r.pass).length}/${results.length} passed`,
  ];

  console.log(summary.join('\n'));
  fs.writeFileSync(masterLog, summary.join('\n'));
  console.log(`\nSummary saved: ${masterLog}`);
  console.log('Individual logs: shared/logs/v3_test_*.log');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
