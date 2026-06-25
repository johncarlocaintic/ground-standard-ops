// Test Driz.AI Demo Agent — zero Retell minutes used
// Uses /agent-playground-completion/{agent_id} for text-based behavioral testing
//
// TESTING APPROACH:
// - Collection tests: verify welcome node collects info and fires transition
// - Demo tests: pre-load conversation history to put flow in demo context
// - playground-completion re-evaluates full conversation each turn
// - Full multi-node traversal requires a real voice call
//
// Usage: node --env-file=.env shared/scripts/retell/test_demo_agent.js <agent_id>

const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY not set'); process.exit(1); }

const AGENT_ID = process.argv[2];
if (!AGENT_ID) { console.error('Usage: node test_demo_agent.js <agent_id>'); process.exit(1); }

const BASE = 'https://api.retellai.com';
const H = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} [${res.status}]: ${text.slice(0, 300)}`);
  return data;
}

async function turn(agentId, messages, dynamicVars = {}) {
  const body = { messages };
  if (Object.keys(dynamicVars).length) body.dynamic_variables = dynamicVars;
  const res = await api('POST', `/agent-playground-completion/${agentId}`, body);
  const agentMsg = res.messages?.[res.messages.length - 1];
  return { reply: agentMsg?.content || '', messages: res.messages, nodeId: res.current_node_id };
}

function log(role, text) {
  const label = role === 'agent' ? '🤖 Agent' : '👤 Caller';
  console.log(`\n${label}: ${text}`);
}

async function runTest(name, script, seedMessages = []) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(60));

  let messages = [...seedMessages];
  let nodeId = null;
  let passed = 0, failed = 0;

  for (const step of script) {
    if (step.caller) {
      log('caller', step.caller);
      messages.push({ role: 'user', content: step.caller });
    }

    const { reply, messages: updated, nodeId: newNode } = await turn(AGENT_ID, messages, step.vars || {});
    messages = updated;
    nodeId = newNode;
    log('agent', reply);

    if (step.assert) {
      const pass = step.assert(reply);
      if (pass) passed++;
      else failed++;
      console.log(`   ${pass ? '✓' : '✗'} ${step.assertLabel || 'assertion'}`);
      if (!pass) console.log(`   Got: "${reply.slice(0, 100)}"`);
    }
  }

  console.log(`\nFinal node: ${nodeId}`);
  console.log(`Result: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ── Seed message builders ──────────────────────────────────────────────────────
const INTRO_MSG = `Hi there — thanks for calling. You've reached the Driz dot A I AI Receptionist Demo Line. I'm an AI voice agent, and over the next few minutes I'm going to show you exactly what your business would sound like with an AI receptionist answering every call. Here's what I handle for businesses every day: I answer calls twenty four seven so no opportunity slips through. I capture caller information automatically. I qualify leads through natural conversation. I book appointments right to your calendar. And I create a professional first impression on every single call. In a moment I'll switch into your business's mode — you'll play the customer calling in, and I'll handle the call exactly as I would in real life. First, I just need a few quick details. What's your name?`;

function buildDemoSeed(businessName, niche, callerName, phone, email) {
  return [
    { role: 'agent', content: INTRO_MSG },
    { role: 'user', content: `${callerName}` },
    { role: 'agent', content: `Got it. And your phone number?` },
    { role: 'user', content: phone },
    { role: 'agent', content: `Got it. Your email?` },
    { role: 'user', content: email },
    { role: 'agent', content: `Got it. What type of business do you run?` },
    { role: 'user', content: niche },
    { role: 'agent', content: `And the name of your business?` },
    { role: 'user', content: businessName },
    { role: 'agent', content: `Got everything I need. Get ready — I'm switching into your business mode right now.` },
    { role: 'agent', content: `Alright — here we go. I'm now ${businessName}'s AI receptionist. Your role is the customer calling in. Ready?` },
    { role: 'user', content: `Ready.` },
    { role: 'agent', content: `Thank you for calling ${businessName}! How can I assist you today?` },
  ];
}

async function main() {
  console.log(`=== Driz.AI Demo Agent Behavioral Tests ===`);
  console.log(`Agent: ${AGENT_ID}\n`);

  let totalPassed = 0, totalFailed = 0;

  // ── TEST 1: Intro ────────────────────────────────────────────────────────
  const t1 = await runTest('Intro — Driz.AI pitch delivered correctly', [
    {
      assert: r =>
        r.toLowerCase().includes('driz dot a') &&
        r.toLowerCase().includes('twenty four seven') &&
        (r.toLowerCase().includes('name') || r.toLowerCase().includes('details')),
      assertLabel: 'Delivers full intro + asks for name',
    },
  ]);
  totalPassed += t1.passed; totalFailed += t1.failed;

  // ── TEST 2: Collection — question by question ─────────────────────────────
  const t2 = await runTest('Collection — One item at a time', [
    { /* agent opens */ },
    {
      caller: 'Mike',
      assert: r => r.toLowerCase().includes('phone') || r.toLowerCase().includes('number') || r.toLowerCase().includes('last name'),
      assertLabel: 'Asks for more info after name only',
    },
    {
      caller: 'Johnson',
      assert: r => r.toLowerCase().includes('phone') || r.toLowerCase().includes('number'),
      assertLabel: 'Accepts last name, asks phone',
    },
    {
      caller: '503-555-2020',
      assert: r => r.toLowerCase().includes('email'),
      assertLabel: 'Accepts phone, asks email',
    },
    {
      caller: 'mike@capitolroofing.com',
      assert: r =>
        r.toLowerCase().includes('type') ||
        r.toLowerCase().includes('business') ||
        r.toLowerCase().includes('industry'),
      assertLabel: 'Accepts email, asks business type',
    },
    {
      caller: 'roofing company',
      assert: r =>
        r.toLowerCase().includes('name') ||
        r.toLowerCase().includes('business name') ||
        r.toLowerCase().includes('company'),
      assertLabel: 'Accepts roofing (Home Services), asks business name',
    },
    {
      caller: 'Capitol Roofing',
      assert: r =>
        r.toLowerCase().includes('got everything') ||
        r.toLowerCase().includes('switching') ||
        r.toLowerCase().includes('business mode'),
      assertLabel: 'Fires transition when all 5 collected',
    },
  ]);
  totalPassed += t2.passed; totalFailed += t2.failed;

  // ── TEST 3: Collection — bulk (name + phone + email in one message) ───────
  const t3 = await runTest('Collection — Bulk info recognized', [
    { /* agent opens */ },
    {
      caller: "I'm Sarah Chen, my phone is 415-555-9090, email sarah@sacredhomespa.com",
      assert: r =>
        r.toLowerCase().includes('type') ||
        r.toLowerCase().includes('business') ||
        r.toLowerCase().includes('industry'),
      assertLabel: 'Accepts bulk name+phone+email, asks business type next',
    },
    {
      caller: 'Salon and spa',
      assert: r =>
        r.toLowerCase().includes('name') ||
        r.toLowerCase().includes('salon') ||
        r.toLowerCase().includes('spa'),
      assertLabel: 'Accepts salon/spa type, asks business name',
    },
    {
      caller: 'Sacred Home Spa',
      assert: r =>
        r.toLowerCase().includes('got everything') ||
        r.toLowerCase().includes('switching') ||
        r.toLowerCase().includes('business mode') ||
        r.toLowerCase().includes('ai receptionist') ||
        r.toLowerCase().includes('sacred home'),
      assertLabel: 'Transitions when all 5 items present (welcome→extract→predemo)',
    },
  ]);
  totalPassed += t3.passed; totalFailed += t3.failed;

  // ── TEST 4: Demo — Dental ─────────────────────────────────────────────────
  const dentalSeed = buildDemoSeed('Bright Smile Dental', 'Dental', 'Karen Park', '650-555-7777', 'karen@brightsmile.com');
  const t4 = await runTest('Demo — Dental receptionist in character', [
    {
      caller: 'Hi, I need to schedule a cleaning. I\'m a new patient.',
      assert: r =>
        !r.toLowerCase().includes('driz dot a') &&
        !r.toLowerCase().includes('demo line') &&
        (r.toLowerCase().includes('bright smile') || r.toLowerCase().includes('dental') || r.toLowerCase().includes('appointment') || r.toLowerCase().includes('patient') || r.toLowerCase().includes('scheduling') || r.toLowerCase().includes('date of birth') || r.toLowerCase().includes('cleaning') || r.toLowerCase().includes('new patient')),
      assertLabel: 'Responds in-character as dental receptionist (not Driz.AI)',
    },
    {
      caller: 'My name is David Wong, I have Delta Dental insurance.',
      assert: r =>
        r.toLowerCase().includes('date of birth') ||
        r.toLowerCase().includes('dob') ||
        r.toLowerCase().includes('insurance') ||
        r.toLowerCase().includes('available') ||
        r.toLowerCase().includes('schedule') ||
        r.toLowerCase().includes('appointment') ||
        r.toLowerCase().includes('phone'),
      assertLabel: 'Asks dental-relevant qualifying info or offers slots',
    },
  ], dentalSeed);
  totalPassed += t4.passed; totalFailed += t4.failed;

  // ── TEST 5: Demo — HVAC emergency ────────────────────────────────────────
  const hvacSeed = buildDemoSeed('Cool Breeze HVAC', 'Home Services', 'Maria Rodriguez', '305-555-1234', 'maria@coolbreeze.com');
  const t5 = await runTest('Demo — HVAC emergency call in character', [
    {
      caller: 'My AC stopped working, it\'s 95 degrees in here.',
      assert: r =>
        (r.toLowerCase().includes('cool breeze') || r.toLowerCase().includes('address') || r.toLowerCase().includes('service') || r.toLowerCase().includes('help') || r.toLowerCase().includes('dispatch')) &&
        !r.toLowerCase().includes('driz dot a'),
      assertLabel: 'Handles urgent AC call as HVAC receptionist',
    },
    {
      caller: '123 Palm Avenue, Miami. I\'m Roberto Gomez.',
      assert: r =>
        r.toLowerCase().includes('time') ||
        r.toLowerCase().includes('available') ||
        r.toLowerCase().includes('window') ||
        r.toLowerCase().includes('schedule') ||
        r.toLowerCase().includes('technician') ||
        r.toLowerCase().includes('phone') ||
        r.toLowerCase().includes('tomorrow'),
      assertLabel: 'Takes address, asks about scheduling or contact',
    },
  ], hvacSeed);
  totalPassed += t5.passed; totalFailed += t5.failed;

  // ── TEST 6: Demo — Law firm ───────────────────────────────────────────────
  const lawSeed = buildDemoSeed('Lee Law Group', 'Law Firm', 'Tom Lee', '415-555-0001', 'tom@leelaw.com');
  const t6 = await runTest('Demo — Law firm consultation booking', [
    {
      caller: 'I was in a car accident and need to talk to an attorney.',
      assert: r =>
        !r.toLowerCase().includes('driz dot a') &&
        !r.toLowerCase().includes('demo line') &&
        (r.toLowerCase().includes('name') || r.toLowerCase().includes('help') || r.toLowerCase().includes('attorney') || r.toLowerCase().includes('assist') || r.toLowerCase().includes('sharing') || r.toLowerCase().includes('accident')),
      assertLabel: 'Responds as law firm receptionist (not Driz.AI)',
    },
    {
      caller: 'Yes, I\'d like a free consultation.',
      assert: r =>
        r.toLowerCase().includes('name') ||
        r.toLowerCase().includes('time') ||
        r.toLowerCase().includes('available') ||
        r.toLowerCase().includes('schedule') ||
        r.toLowerCase().includes('slot'),
      assertLabel: 'Moves toward consultation scheduling',
    },
  ], lawSeed);
  totalPassed += t6.passed; totalFailed += t6.failed;

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = totalPassed + totalFailed;
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`${totalPassed}/${total} assertions passed`);
  console.log(`\nAgent ID:  ${AGENT_ID}`);
  console.log(`\nWhat these tests cover:`);
  console.log('  ✓ Intro delivery (voice + pitch)');
  console.log('  ✓ Collection — step-by-step and bulk responses');
  console.log('  ✓ Transition phrase fires when all 5 items collected');
  console.log('  ✓ Demo roleplay — stays in character per niche');
  console.log(`\nWhat needs a real voice call to verify:`);
  console.log('  • Full node traversal (collection → demo → value prop → booking)');
  console.log('  • Voice quality and pacing (Cimo voice)');
  console.log('  • 11labs TTS + phone number pronunciation');

  if (totalFailed > 0) process.exit(1);
}

main().catch(e => {
  console.error('\n=== TEST HARNESS ERROR ===');
  console.error(e.message);
  process.exit(1);
});
