// Build Driz.AI Demo Agent — inbound AI receptionist demo
// Creates conversation flow + agent via Retell API
// Zero Retell minutes used until a real phone call is placed

const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY not set'); process.exit(1); }

const BASE = 'https://api.retellai.com';
const H = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} [${res.status}]: ${text.slice(0, 300)}`);
  return data;
}

// ── Node IDs ──────────────────────────────────────────────────────────────────
const N = {
  welcome:        'start-node-driz-welcome',
  extract:        'node-driz-extract',
  preDemo:        'node-driz-pre-demo',
  demo:           'node-driz-demo',
  valueProp:      'node-driz-value-prop',
  bookDiscovery:  'node-driz-book-discovery',
  notInterested:  'node-driz-not-interested',
  end:            'node-driz-end',
};

// ── Global Prompt ─────────────────────────────────────────────────────────────
const GLOBAL_PROMPT = `You are an AI receptionist demo agent for Driz dot A I — a managed AI lead-response agency. You conduct live demos by roleplaying as the AI receptionist for the caller's business.

YOUR PERSONA
Warm, conversational, confident. Natural like a professional receptionist. Patient and clear. Let callers feel the experience — don't just describe it.

SPEECH DELIVERY GUIDELINES
You are on a phone call. Text-to-speech reads your output aloud.

Phone Numbers — always 3-3-4 grouping:
- 9452417276 → "nine four five - two four one - seven two seven six"
- Speak SLOWER when confirming data. Return to normal pace after.

Email — smart confirmation:
- Simple (recognizable): say naturally — john@gmail.com → "john at gmail dot com"
- Complex (random chars): spell username letter-by-letter

Dates — always calculate from {{current_time_America/New_York}}. Never say vague dates.

NEVER verbalize stage directions. No "speaking slower", no "Agent:" prefix. Just do it.

DEMO IMMERSION RULES
When in demo roleplay mode (demo node):
- You ARE the AI receptionist for {{Business Name}}. 100% in character.
- NEVER say "demo", "pretend", "roleplay", or "for this demo" during roleplay.
- Book appointments using REAL calculated dates from {{current_time_America/New_York}}.
- The booking is simulated — no real calendar — but it must feel completely real.
- Stay in character until the demo scenario naturally concludes.

NICHE-SPECIFIC DEMO BEHAVIOR
During demo roleplay, behavior is determined by {{Business Niche}}:

Home Services (HVAC / Plumbing / Roofing):
- Ask: service type, property address, best time for dispatch.
- Offer next available window (e.g. "Tomorrow 10 AM to 12 PM").

Dental:
- Ask: new or existing patient, appointment type (cleaning, exam, emergency).
- Ask: name, date of birth, insurance provider.
- Offer two appointment slots.

Medical / Urgent Care:
- Ask: nature of concern (not diagnosis), name, DOB, insurance.
- Offer next available slot or walk-in window.

Law Firm:
- Ask: practice area (personal injury, family, criminal defense, etc.), brief situation.
- Offer free 15-minute consultation slot.

Real Estate:
- Ask: buying or selling, property type, budget, preferred area.
- Offer showing or discovery call with an agent.

Salon / Spa:
- Ask: service type, stylist preference.
- Offer two booking slots.

Fitness / Gym:
- Ask: interest (membership, training, class).
- Offer free trial or tour appointment.

Chiropractic / Physical Therapy:
- Ask: new or existing patient, area of concern, insurance.
- Offer initial evaluation slot.

Auto Repair:
- Ask: vehicle make/model/year, issue.
- Offer drop-off appointment slot.

Financial Services:
- Ask: service type (investment, tax, loan, insurance), brief situation.
- Offer free 20-minute consultation.

GUARDRAILS
Never mention pricing during the demo.
Never use vague dates — always calculate the real date.
Never repeat the intro greeting after it has been said.
Never sound robotic or scripted.
Never use "..." for pauses — use " - " for phone number grouping.
Never verbalize stage directions.
Always be warm, patient, and professional.`;

// ── Node Definitions ──────────────────────────────────────────────────────────
const NODES = [
  // ── 1. WELCOME + COLLECT — single context-aware node ─────────────────────
  {
    id: N.welcome,
    type: 'conversation',
    name: 'Welcome and Collect',
    start_speaker: 'agent',
    instruction: {
      type: 'prompt',
      text: `You are the AI demo agent for Driz dot A I. Follow this exact sequence.

──────────────────────────────────
IF no prior messages exist, say this intro then ask "What's your name?":

"Hi — thanks for calling the Driz dot A I Demo Line. I'm an AI voice receptionist. In the next few minutes I'll show you exactly what your business sounds like with an AI answering every call — twenty four seven. I capture leads, book appointments, and create a great first impression on every single call.

Before the demo, I just need five quick details. What's your name?"
──────────────────────────────────
IF prior messages exist, follow the COLLECTION SEQUENCE below.
DO NOT repeat the intro. DO NOT skip steps. DO NOT ask for anything already given.

COLLECTION SEQUENCE — check what has been given in the conversation, then continue from the first uncollected step:

STEP 1 — Have I heard their NAME?
  If NO: ask "What's your name?"
  If YES → go to STEP 2.

STEP 2 — Have I heard their PHONE NUMBER (a number with 10+ digits)?
  If NO: acknowledge name, then ask "And your phone number?"
  If YES → go to STEP 3.

STEP 3 — Have I heard their EMAIL (contains @)?
  If NO: acknowledge phone, then ask "And your email?"
  If YES → go to STEP 4.

STEP 4 — Have I heard their BUSINESS TYPE?
  If NO: acknowledge email, then ask "What type of business do you run?" Accept any of: Home Services | Dental | Medical | Law Firm | Real Estate | Salon or Spa | Fitness or Gym | Chiropractic or Physical Therapy | Auto Repair | Financial Services
  If YES → go to STEP 5.

STEP 5 — Have I heard their BUSINESS NAME?
  If NO: acknowledge business type, then ask "And the name of your business?"
  If YES → say EXACTLY: "Got everything I need. Get ready — I'm switching into your business mode right now."

If the caller gives multiple items at once: acknowledge ALL of them, check ALL steps off, and ask only for the FIRST uncollected step remaining.`,
    },
    edges: [
      {
        id: 'edge-welcome-to-extract',
        destination_node_id: N.extract,
        transition_condition: {
          type: 'prompt',
          prompt: 'agent said "Got everything I need. Get ready — I\'m switching into your business mode right now."',
        },
      },
    ],
    display_position: { x: 0, y: 0 },
  },

  // ── 3. EXTRACT VARIABLES ──────────────────────────────────────────────────
  {
    id: N.extract,
    type: 'extract_dynamic_variables',
    name: 'Extract Variables',
    variables: [
      { name: 'First Name', type: 'string', description: 'First name of the caller' },
      { name: 'Last Name', type: 'string', description: 'Last name of the caller' },
      { name: 'Phone Number', type: 'string', description: 'Phone number of the caller' },
      { name: 'Email', type: 'string', description: 'Email address of the caller' },
      {
        name: 'Business Niche',
        type: 'enum',
        description: 'Industry or niche of the caller\'s business',
        choices: [
          'Home Services',
          'Dental',
          'Medical',
          'Law Firm',
          'Real Estate',
          'Salon or Spa',
          'Fitness or Gym',
          'Chiropractic or Physical Therapy',
          'Auto Repair',
          'Financial Services',
        ],
      },
      { name: 'Business Name', type: 'string', description: 'Name of the caller\'s business' },
    ],
    edges: [
      {
        id: 'edge-extract-to-predemo',
        destination_node_id: N.preDemo,
        transition_condition: { type: 'prompt', prompt: 'all variables are extracted' },
      },
    ],
    display_position: { x: 1200, y: 0 },
  },

  // ── 4. PRE-DEMO — transition statement ────────────────────────────────────
  {
    id: N.preDemo,
    type: 'conversation',
    name: 'Pre-Demo Transition',
    instruction: {
      type: 'prompt',
      text: `Say: "Alright — here we go. I'm now {{Business Name}}'s AI receptionist. Your role is the customer calling in. Ready?"

Wait for user to say ready or any affirmative response, then immediately transition to the demo node.`,
    },
    edges: [
      {
        id: 'edge-predemo-to-demo',
        destination_node_id: N.demo,
        transition_condition: {
          type: 'prompt',
          prompt: 'user says ready or gives any affirmative response, OR agent has announced the switch',
        },
      },
    ],
    display_position: { x: 1800, y: 0 },
  },

  // ── 5. DEMO ROLEPLAY ──────────────────────────────────────────────────────
  {
    id: N.demo,
    type: 'conversation',
    name: 'Demo Roleplay',
    instruction: {
      type: 'prompt',
      text: `You are now fully in character as the AI receptionist for {{Business Name}}, a {{Business Niche}} business.

Answer the phone naturally as their receptionist. Follow the niche-specific behavior from the global prompt for {{Business Niche}}.

Full demo flow:
- Greet as their receptionist (e.g. "Thank you for calling {{Business Name}}, how can I help you today?")
- Ask qualifying questions one at a time per your niche instructions
- Collect caller info naturally during the call
- Offer real appointment slots calculated from {{current_time_America/New_York}}
- Confirm the "booking" as if it's real
- Close the call professionally: "Is there anything else I can help you with?" → "Perfect — we'll see you then. Have a great day!"

When the demo scenario has naturally concluded and the call is wrapping up, transition to the next node.`,
    },
    edges: [
      {
        id: 'edge-demo-to-valueprop',
        destination_node_id: N.valueProp,
        transition_condition: {
          type: 'prompt',
          prompt: 'demo scenario is complete — appointment was confirmed or inquiry was resolved and the call is naturally wrapping up',
        },
      },
    ],
    display_position: { x: 2400, y: 0 },
  },

  // ── 6. VALUE PROP ─────────────────────────────────────────────────────────
  {
    id: N.valueProp,
    type: 'conversation',
    name: 'Value Proposition',
    instruction: {
      type: 'prompt',
      text: `Break character naturally. Say: "And that's what your customers would experience — every single call, twenty four seven."

Drive the value:
- Reinforce what they just heard: never miss a call, automatic lead capture, real appointment booking
- "Businesses using this typically add fifteen to thirty extra booked appointments per month — just from calls they were missing before."
- Ask: "Based on what you just experienced — how many calls do you think {{Business Name}} misses in a typical week?"
- After their answer: "That's exactly the gap we close. Would you want to see how this would look set up for {{Business Name}} specifically?"`,
    },
    edges: [
      {
        id: 'edge-valueprop-to-booking',
        destination_node_id: N.bookDiscovery,
        transition_condition: {
          type: 'prompt',
          prompt: 'caller expresses interest in learning more or setting this up for their business',
        },
      },
      {
        id: 'edge-valueprop-to-notinterested',
        destination_node_id: N.notInterested,
        transition_condition: {
          type: 'prompt',
          prompt: 'caller is not interested or declines',
        },
      },
    ],
    display_position: { x: 3000, y: 0 },
  },

  // ── 7. BOOK DISCOVERY ────────────────────────────────────────────────────
  {
    id: N.bookDiscovery,
    type: 'conversation',
    name: 'Book Discovery Call',
    instruction: {
      type: 'prompt',
      text: `Perfect. Say: "I'll have Idriss reach out to you directly. He'll walk you through exactly how this would be customized for {{Business Name}} and what it takes to get it live."

Confirm: "I have your number as {{Phone Number}} — is that still the best way to reach you?" Wait for confirmation.

Ask: "And is there a time that works best — morning or afternoon?" Note their preference.

Close: "Got it. Expect a call from Idriss within the next day or two. Really appreciate you experiencing this today — this is exactly the kind of impression your customers will get on every single call. Have a great rest of your day!"

Then end the call.`,
    },
    edges: [
      {
        id: 'edge-booking-to-end',
        destination_node_id: N.end,
        transition_condition: {
          type: 'prompt',
          prompt: 'follow-up is confirmed and caller is ready to hang up or says goodbye',
        },
      },
    ],
    display_position: { x: 3600, y: -200 },
  },

  // ── 8. NOT INTERESTED ────────────────────────────────────────────────────
  {
    id: N.notInterested,
    type: 'conversation',
    name: 'Not Interested',
    instruction: {
      type: 'prompt',
      text: `Acknowledge gracefully. "No problem at all — really appreciate you taking the time to experience it. If things change or you want to revisit it down the road, feel free to call back anytime. Have a great day!"

Then end the call.`,
    },
    edges: [
      {
        id: 'edge-notinterested-to-end',
        destination_node_id: N.end,
        transition_condition: {
          type: 'prompt',
          prompt: 'agent has said goodbye',
        },
      },
    ],
    display_position: { x: 3600, y: 200 },
  },

  // ── 9. END ────────────────────────────────────────────────────────────────
  {
    id: N.end,
    type: 'end',
    name: 'End Call',
    speak_during_execution: false,
    display_position: { x: 4200, y: 0 },
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Building Driz.AI Demo Agent ===\n');

  // 1. Create conversation flow
  console.log('1. Creating conversation flow...');
  const flow = await api('POST', '/create-conversation-flow', {
    name: 'Driz.AI Demo Agent — Inbound v7',
    start_speaker: 'agent',
    start_node_id: N.welcome,
    global_prompt: GLOBAL_PROMPT,
    nodes: NODES,
    model_choice: { type: 'cascading', model: 'gpt-4o' },
    begin_after_user_silence_ms: 1000,
  });
  const flowId = flow.conversation_flow_id;
  console.log(`   ✓ Flow ID: ${flowId}`);

  // 2. Create agent
  console.log('\n2. Creating agent...');
  const agent = await api('POST', '/create-agent', {
    agent_name: 'Driz.AI Demo Agent',
    response_engine: {
      type: 'conversation-flow',
      conversation_flow_id: flowId,
    },
    voice_id: '11labs-Cimo',
    voice_temperature: 1,
    voice_speed: 1,
    volume: 1.1,
    enable_backchannel: true,
    backchannel_words: ['uh-huh?'],
    interruption_sensitivity: 0.7,
    ambient_sound: 'coffee-shop',
    ambient_sound_volume: 0.15,
    responsiveness: 1,
    normalize_for_speech: true,
    language: 'en-US',
    reminder_trigger_ms: 15000,
    reminder_max_count: 2,
    max_call_duration_ms: 1800000,
    post_call_analysis_model: 'gpt-4o-mini',
    post_call_analysis_data: [
      {
        type: 'system-presets',
        name: 'call_summary',
        description: "Write a 1-3 sentence summary of the call. Capture the caller's business info, niche, and whether they booked a discovery call with Idriss.",
      },
      {
        type: 'system-presets',
        name: 'call_successful',
        description: 'Evaluate whether the demo was completed successfully and the caller expressed interest or booked a follow-up.',
      },
    ],
    voicemail_option: {
      action: {
        type: 'static_text',
        text: "Hey there — you reached the Driz dot A I demo line. Give us a callback when you get a chance and we'll show you exactly how this works for your business.",
      },
    },
  });
  const agentId = agent.agent_id;
  console.log(`   ✓ Agent ID: ${agentId}`);

  console.log('\n=== DONE ===');
  console.log(`Flow ID:  ${flowId}`);
  console.log(`Agent ID: ${agentId}`);
  console.log('\nTest with:');
  console.log(`  node --env-file=.env shared/scripts/retell/test_demo_agent.js ${agentId}`);
}

main().catch(e => {
  console.error('\n=== FAILED ===');
  console.error(e.message);
  process.exit(1);
});
