---
status: unverified
context: fork
name: retell-voice-agent-builder
description: Build production-ready Retell AI voice agents through comprehensive workflows covering research, prompt engineering (CRISP framework), agent creation/modification via MCP, testing, and optimization. Use when JC needs to create new voice agents, modify existing agents, optimize agent performance, or troubleshoot agent issues. Supports both single-prompt and multi-prompt agents, includes industry-specific templates, and provides testing scenario generation. This skill guides Claude through interactive consultation with JC to build custom voice AI solutions.
---

# Retell Voice Agent Builder

Build production-ready Retell AI voice agents using MCP integration and proven prompt engineering frameworks. This skill provides comprehensive workflows for agent creation, modification, optimization, and testing.

## Core Capabilities

**Agent Operations:**
- Create new agents from scratch (single-prompt or multi-prompt)
- Modify existing agent configurations
- Optimize agent performance and troubleshoot issues
- Generate industry-specific agent templates

**Development Workflow:**
- Business requirements discovery
- Industry research and competitive analysis
- CRISP framework prompt engineering
- Agent deployment via Retell AI MCP
- Testing scenario generation
- Iterative optimization

## When to Use This Skill

Trigger this skill when JC requests:
- "Build a voice agent for [industry/use case]"
- "Create a Retell agent that does [task]"
- "Modify the [agent name] to [change]"
- "Optimize my agent's [performance/prompts/flow]"
- "Help me troubleshoot [agent issue]"
- "Generate test scenarios for [agent]"

## Primary Workflows

### Workflow 1: Create New Agent from Scratch

**Phase 1: Discovery & Requirements**

Start by understanding the business context. Ask JC targeted questions:

**Business Context Questions:**
1. **Industry/Use Case**: "What industry is this for and what's the primary use case?"
2. **Target Audience**: "Who will be calling this agent? (demographics, technical level, pain points)"
3. **Call Direction**: "Is this inbound (answering incoming calls) or outbound (making calls)?"
4. **Primary Goal**: "What's the #1 thing this agent needs to accomplish? (qualify leads, book appointments, answer questions, etc.)"
5. **Success Metrics**: "How will you measure if this agent is successful?"

**Functional Requirements Questions:**
6. **Critical Questions**: "What questions MUST the agent ask every caller?"
7. **Call Duration**: "What's the target call length? (speed-to-lead vs comprehensive qualification)"
8. **Routing Logic**: "After the conversation, what happens? (transfer to human, book appointment, send info, etc.)"
9. **CRM Integration**: "What CRM are you using? (GoHighLevel, Salesforce, custom, none)"
10. **Compliance Requirements**: "Any specific compliance needs? (recording consent, disclosures, regulated industry)"

**Technical Constraints Questions:**
11. **Existing Assets**: "Do you have existing scripts, FAQs, or documentation I should reference?"
12. **Brand Voice**: "What tone should the agent have? (professional, friendly, authoritative, empathetic)"
13. **Edge Cases**: "What are the trickiest scenarios this agent needs to handle?"

**Key Principle**: Ask questions progressively. Start with 3-4 critical questions, then follow up based on responses. Don't overwhelm JC with all 13 questions at once.

**Phase 2: Industry Research (When Needed)**

If JC is entering a new vertical or needs competitive intelligence, use web search to research:
- Industry-specific pain points and objections
- Common call flows and qualification criteria
- Compliance requirements and regulations
- Competitive voice AI implementations
- Best practices and benchmarks

**Research Checklist:**
- [ ] Industry-specific terminology and jargon
- [ ] Common customer objections and how to handle them
- [ ] Regulatory/compliance landscape
- [ ] Average call duration benchmarks
- [ ] Typical qualification criteria

Reference existing templates in `references/templates/` for proven patterns.

**Phase 3: Prompt Engineering with CRISP Framework**

Use the CRISP framework (Context, Role, Instructions, Structure, Patterns) to build the agent prompt. See `references/prompt-engineering-guide.md` for detailed methodology.

**CRISP Components:**

**C - Context**: Set the stage
- Domain and purpose
- Target audience characteristics  
- Key constraints and requirements
- Available tools and integrations

**R - Role**: Define AI identity
- Agent name and persona
- Expertise level and specialization
- Communication style and tone
- Relationship to the brand

**I - Instructions**: Specify the task
- Primary objective and goals
- Step-by-step conversation flow
- Decision logic and branching
- Tool calling conditions
- Edge case handling

**S - Structure**: Define output format
- Call opening and greeting
- Question sequence and pacing
- Response style (length, complexity)
- Call closing and next steps

**P - Patterns**: Provide examples
- Example conversation flows (2-3 scenarios)
- Sample responses to common questions
- Edge case handling demonstrations
- Tool calling examples

**Sectional Prompt Template:**

```
## ROLE
You are [Name], a [expertise level] [domain] specialist for [Company].
Your communication style is [tone descriptors].

## CONTEXT  
Phone number: {{user_number}}
Current time: {{current_time_America/New_York}}
[Any other dynamic variables]

## PRIMARY MISSION
[Clear, concise statement of the agent's #1 goal]

## CRITICAL CONVERSATIONAL RULES
[Key behavioral constraints, e.g.:]
- Ask ONE question at a time
- Keep responses under 3 sentences
- Use conversational fillers naturally
- Never mention function/tool names to caller

## TASK & WORKFLOW
[Step-by-step conversation flow]

1. Opening: [What to say]
2. Qualification: [Questions to ask in order]
3. Routing Logic: [Decision tree]
4. Tool Calling: [When and how to call functions]
5. Closing: [How to end call]

## EXAMPLE CONVERSATIONS
[2-3 full conversation examples showing different paths]

Scenario 1: [Happy path]
Scenario 2: [Common objection]  
Scenario 3: [Edge case]

## GUARDRAILS
[What NOT to do]
- Never [specific prohibited behavior]
- Don't [another prohibited behavior]
- Always [required behavior]
```

**Prompt Length Guidelines:**
- Single-prompt agents: 800-1,500 tokens
- Multi-prompt agents: 500-800 tokens per state
- Knowledge base: Separate facts from instructions

**Phase 4: Agent Creation via MCP**

Once the prompt is finalized, create the agent using Retell AI MCP tools.

**Step 1: Create Retell LLM Configuration**

```
Use: retellai-mcp-server:create_retell_llm

Required parameters:
- general_prompt: [The prompt you engineered]
- begin_message: [First thing agent says when call connects]
- model: "gpt-4o" (or "gpt-4o-mini" for cost optimization)

Optional but recommended:
- model_temperature: 0.7 (default, good for conversational)
- general_tools: [Array of custom functions/built-in tools]
- states: [For multi-prompt agents]
- knowledge_base_ids: [If using RAG]
```

**Step 2: Create Agent**

```
Use: retellai-mcp-server:create_agent

Required parameters:
- agent_name: [Descriptive name]
- response_engine: {
    type: "retell-llm",
    llm_id: [LLM ID from step 1]
  }
- voice_id: [Choose appropriate voice]

Common voice recommendations:
- Professional female (trustworthy, mature): "11labs-Grace"
- Friendly male: "11labs-Eric"  
- Warm empathetic: "11labs-Charlotte"
- Cost-effective alternative: "cartesia-*" voices

Optional but important:
- language: "en-US" (or other locale)
- voice_model: "eleven_turbo_v2_5" (ElevenLabs) or "Play3.0-mini" (PlayHT)
- ambient_sound: "coffee-shop" (can improve naturalness)
- interruption_sensitivity: 0.5-1.0 (how easily caller can interrupt)
```

**Step 3: Configure Tools (If Needed)**

For agents that need to interact with external systems:

```
Tools in general_tools array:

1. Built-in tools (minimal config):
   - end_call
   - transfer_call  
   - press_digit
   - check_availability_cal / book_appointment_cal

2. Custom functions (requires URL):
   - type: "custom"
   - name: "function_name" (lowercase, underscores)
   - description: "When to call this function" (critical for LLM)
   - url: "https://your-endpoint.com/webhook"
   - method: "POST" | "GET" | "PUT" | "DELETE"
   - parameters: {JSON Schema with type: "object"}
   - speak_during_execution: true (recommended)
   - speak_after_execution: false (usually)

3. MCP integrations (e.g., GoHighLevel):
   - Follow GHL-specific patterns in references/ghl-integration.md
```

**Phase 5: Testing**

Generate test scenarios and validate agent behavior. See `references/testing-patterns.md` for comprehensive testing methodology.

**Quick Test:**
```
Use: retellai-mcp-server:create_web_call
Parameters:
- agentId: [The agent ID you just created]

This returns a web call URL you can use to test immediately.
```

**Test Scenarios to Generate:**
1. **Happy Path**: Ideal caller who answers all questions correctly
2. **Objection Handling**: Caller raises concerns or questions
3. **Incomplete Information**: Caller doesn't know answers
4. **Off-Topic**: Caller asks unrelated questions
5. **Edge Cases**: Unusual scenarios specific to the use case

**Phase 6: Iteration & Optimization**

Based on test results, iterate on:
- Prompt clarity and instructions
- Tool calling reliability
- Response pacing and length
- Conversation flow and branching
- Edge case handling

Use `retellai-mcp-server:update_retell_llm` to modify prompts without recreating agents.

---

### Workflow 2: Modify Existing Agent

**Step 1: Retrieve Current Configuration**

```
Use: retellai-mcp-server:get_agent
Parameter: agentId: [agent ID]

Then: retellai-mcp-server:get_retell_llm  
Parameter: llmId: [from agent response]
```

**Step 2: Identify Modification Type**

Ask JC: "What specifically needs to change?"

**Common modification types:**
- **Prompt adjustments**: Update general_prompt or state prompts
- **Voice changes**: Update voice_id or voice_model
- **Tool updates**: Add/remove/modify general_tools
- **Flow changes**: Adjust states and transitions (multi-prompt)
- **Behavioral tuning**: Change temperature, interruption_sensitivity

**Step 3: Make Targeted Updates**

```
For prompt changes:
Use: retellai-mcp-server:update_retell_llm
Parameters: llmId, general_prompt (or other fields)

For agent settings:
Use: retellai-mcp-server:update_agent
Parameters: agentId, voice_id, voice_model, etc.
```

**Step 4: Test Changes**

Create web call to validate modifications work as expected.

**Step 5: Version Control**

Before major changes, document the "before" state:
- Copy current prompt to reference file
- Note the change rationale
- Track agent version numbers

---

### Workflow 3: Optimize Agent Performance

When JC reports agent performance issues, use this troubleshooting framework. See `references/optimization-guide.md` for detailed techniques.

**Common Issues & Solutions:**

**Issue: Agent talks too much**
- Add conversational rule: "Keep responses under 2-3 sentences"
- Increase temperature slightly (0.7 → 0.8) for more natural brevity
- Use examples showing concise responses

**Issue: Agent not calling functions**
- Strengthen function descriptions with explicit triggers
- Add instruction: "When [condition], immediately call [function_name]"
- Check JSON schema - must have "type": "object" at root

**Issue: Agent hallucinates information**
- Add guardrail: "Never make up information. Say 'I don't have that information' instead."
- Move facts to knowledge_base instead of prompt
- Reduce temperature (0.7 → 0.3) for more deterministic responses

**Issue: Agent sounds robotic**
- Add conversational fillers: "umm", "let me see", "okay"
- Use natural language examples
- Enable ambient_sound
- Adjust voice_temperature

**Issue: Poor call routing accuracy**
- Simplify decision logic (binary is more reliable than scoring)
- Make criteria explicit with examples
- Use structured tool calling (tool_call_strict_mode: true)

**Issue: Slow response time**
- Switch to GPT-4o-mini (cheaper, faster)
- Reduce prompt length
- Set speak_during_execution: true for functions

---

### Workflow 4: Generate Testing Scenarios

When JC needs comprehensive testing, generate scenario scripts covering:

**Scenario Template:**

```
**Scenario Name**: [Descriptive name]
**Purpose**: [What this tests]
**Caller Profile**: [Demographics, intent, knowledge level]

**Conversation Script:**

Agent: [Opening line]
Caller: [Response that tests specific behavior]
Agent: [Expected response]
Caller: [Follow-up that tests edge case]
[Continue for 5-10 turns]

**Expected Outcome**: [What should happen at end]
**Pass Criteria**: [How to know test passed]
```

Generate 5-10 scenarios covering:
1. Ideal qualification (happy path)
2. Partial qualification (missing info)
3. Disqualification (doesn't meet criteria)
4. Objection handling (price, timing, trust)
5. Information requests (caller asks questions)
6. Off-topic digressions (caller goes tangent)
7. Interruption handling (caller cuts off agent)
8. Repeat callers (should recognize context)
9. Transfer scenarios (handoff to human)
10. Error scenarios (function failures)

---

## Multi-Prompt vs Single-Prompt Decision

**Use Single-Prompt When:**
- Linear conversation flow (no branching)
- Under 10 decision points
- One primary outcome
- Simple qualification criteria

**Use Multi-Prompt (States) When:**
- Complex branching logic
- Multiple distinct phases (qualify → schedule → confirm)
- Different tools available at different stages
- Need to enforce sequential steps
- Prevent premature actions (e.g., booking before qualifying)

**Multi-Prompt Structure Example:**

```
states: [
  {
    name: "qualification",
    state_prompt: "Gather all required info...",
    tools: [...qualification tools],
    edges: [
      {
        destination_state_name: "scheduling",
        description: "Transition when fully qualified"
      }
    ]
  },
  {
    name: "scheduling", 
    state_prompt: "Book appointment...",
    tools: [...calendar tools],
    edges: [...]
  }
]
```

---

## Industry-Specific Templates

For common verticals, reference pre-built templates in `references/templates/`:

- **HECM/Reverse Mortgage**: `references/templates/hecm-lead-qualification.md`
- **Dental Practice**: `references/templates/dental-appointment-booking.md`
- **General Lead Qualification**: `references/templates/generic-lead-qual.md`
- **Customer Support**: `references/templates/customer-support.md`
- **Appointment Booking**: `references/templates/appointment-scheduler.md`

Each template provides:
- Proven prompt structure
- Common questions and flows
- Tool configurations
- Testing scenarios
- Performance benchmarks

---

## Critical MCP Tool Reference

**List all agents:**
```
retellai-mcp-server:list_agents
```

**Get specific agent:**
```
retellai-mcp-server:get_agent
Parameters: agentId
```

**Get LLM configuration:**
```
retellai-mcp-server:get_retell_llm
Parameters: llmId
```

**Create new LLM:**
```
retellai-mcp-server:create_retell_llm
Parameters: general_prompt, begin_message, model, [optional fields]
```

**Create new agent:**
```
retellai-mcp-server:create_agent
Parameters: agent_name, response_engine, voice_id, [optional fields]
```

**Update LLM:**
```
retellai-mcp-server:update_retell_llm
Parameters: llmId, [fields to update]
```

**Update agent:**
```
retellai-mcp-server:update_agent
Parameters: agentId, [fields to update]
```

**Create test call:**
```
retellai-mcp-server:create_web_call
Parameters: agentId
Returns: web call URL for immediate testing
```

**List voices:**
```
retellai-mcp-server:list_voices
Returns: Available voices with IDs and characteristics
```

---

## Best Practices & Principles

**Prompt Engineering:**
- Break prompts into sections (Role, Context, Instructions, Examples)
- Use imperative form ("Ask", "Collect", "Call") not descriptive ("The agent should ask")
- Provide 2-3 conversation examples showing different paths
- Separate facts (knowledge base) from instructions (prompt)

**Agent Design:**
- Start with GPT-4o for development, optimize to GPT-4o-mini after testing
- Default temperature 0.7 (conversational), lower (0.3) for deterministic tasks
- Enable speak_during_execution for functions to avoid silence
- Use ambient_sound for more natural conversations

**Tool Configuration:**
- Function descriptions are critical - explain WHEN to call, not just what it does
- JSON schemas must have "type": "object" at root level
- Set speak_after_execution: false for background operations
- Test function calling in isolation before integrating

**Testing:**
- Always generate test scenarios before deploying
- Test happy path, objections, edge cases
- Use web calls for quick iteration
- Document changes and version prompts

**Optimization:**
- Evidence over assumptions: "DO NOT ASSUME, good LLMs refer to database"
- Simplify decision logic when possible (binary > scoring)
- Keep prompts concise (under 1,500 tokens for single-prompt)
- Monitor call recordings and iterate based on real usage

---

## Common Pitfalls to Avoid

**Prompt Issues:**
- ❌ Overly complex prompts (>2,000 tokens)
- ❌ Vague instructions ("be helpful" vs "collect 5 specific data points")
- ❌ No conversation examples
- ❌ Mixing facts with instructions

**Configuration Issues:**
- ❌ Missing "type": "object" in function parameters
- ❌ Weak function descriptions (doesn't explain WHEN to call)
- ❌ Wrong voice for demographic (young voice for seniors)
- ❌ No speak_during_execution (creates awkward silence)

**Testing Issues:**
- ❌ Only testing happy path
- ❌ Not testing with realistic objections
- ❌ Deploying without iteration
- ❌ No version control of prompts

**Process Issues:**
- ❌ Building agent before understanding requirements
- ❌ Skipping research phase for new industries
- ❌ Not documenting decisions and rationale
- ❌ Changing too many variables at once during optimization

---

## Success Checklist

Before marking an agent as "production-ready," verify:

**Requirements:**
- [ ] Clear understanding of business goals and success metrics
- [ ] Target audience and use case well-defined
- [ ] Compliance requirements identified and addressed

**Prompt Quality:**
- [ ] Uses CRISP framework structure
- [ ] Includes 2-3 conversation examples
- [ ] Clear tool calling instructions
- [ ] Appropriate length for complexity

**Configuration:**
- [ ] Appropriate voice for demographic
- [ ] Correct model (GPT-4o or GPT-4o-mini)
- [ ] Tools configured with proper JSON schemas
- [ ] Dynamic variables set up correctly

**Testing:**
- [ ] Happy path tested
- [ ] Edge cases tested
- [ ] Objection handling validated
- [ ] Tool calling verified
- [ ] Transfer/routing logic confirmed

**Documentation:**
- [ ] Prompt saved and version controlled
- [ ] Agent ID and LLM ID documented
- [ ] Testing results recorded
- [ ] Known issues and workarounds noted

---

## Quick Reference: When JC Says...

**"Build me an agent for [X]"**
→ Start Workflow 1: Discovery phase

**"This agent isn't working right"**
→ Start Workflow 3: Get config, diagnose issue

**"Modify the prompt to [X]"**
→ Start Workflow 2: Get LLM, update, test

**"Generate test cases"**
→ Start Workflow 4: Create scenario scripts

**"Which model should I use?"**
→ GPT-4o for dev, GPT-4o-mini for production (40% cost savings)

**"Should this be single or multi-prompt?"**
→ Single unless: complex branching, sequential phases, or preventing premature actions

**"What voice should I use?"**
→ Match demographic: seniors = mature voice (11labs-Grace), young adults = energetic voice

**"How long should the prompt be?"**
→ 800-1,500 tokens single-prompt, 500-800 per state for multi-prompt

**"Agent isn't calling functions"**
→ Check description (explain WHEN to call), verify JSON schema has "type": "object"

**"Agent talks too much"**
→ Add rule "Keep under 3 sentences", show concise examples

---

## Resources

This skill includes bundled resources for comprehensive agent development:

### references/
Reference documentation loaded into context when needed:
- `prompt-engineering-guide.md` - Detailed CRISP framework methodology
- `testing-patterns.md` - Comprehensive testing scenarios and validation
- `optimization-guide.md` - Performance tuning and troubleshooting
- `ghl-integration.md` - GoHighLevel MCP integration patterns
- `templates/` - Industry-specific agent templates (HECM, dental, etc.)

### scripts/
Currently no scripts included. Future additions may include:
- Agent configuration validators
- Prompt analyzers
- Test scenario generators

### assets/
Currently no assets included. Future additions may include:
- Voice sample files
- Prompt templates
- Configuration examples
