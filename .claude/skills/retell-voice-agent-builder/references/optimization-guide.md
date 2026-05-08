# Voice Agent Optimization & Troubleshooting Guide

Diagnostic framework and solutions for common Retell AI agent performance issues.

## Optimization Framework

**Principle**: Evidence over assumptions. "DO NOT ASSUME, good LLMs refer to database."

**Optimization Process:**
1. **Identify**: What specific behavior is problematic?
2. **Diagnose**: What's the root cause?
3. **Apply Fix**: Targeted solution for the root cause
4. **Test**: Validate fix works without breaking other things
5. **Monitor**: Ensure fix holds in production

## Common Issues & Solutions

### Issue 1: Agent Talks Too Much

**Symptoms:**
- Responses longer than 5 sentences
- Multiple ideas per response
- Callers interrupt frequently
- Complaints about "wordiness"

**Diagnosis Tools:**
1. Review call transcripts - measure response lengths
2. Check if examples in prompt are verbose
3. Look for academic/formal language in prompt

**Root Causes & Solutions:**

**Cause A: No explicit length constraint**
```
Solution: Add to Critical Rules section:
"Keep ALL responses under 2-3 sentences maximum. If more explanation needed, ask if caller wants details first."
```

**Cause B: Verbose examples**
```
Solution: Update all example conversations to show concise responses:

Bad Example:
Agent: "Based on the information you've provided, it appears that you would be an excellent candidate for our HECM program. What I'd like to do next is schedule a comprehensive consultation with one of our senior loan officers who can walk you through the specifics..."

Good Example:
Agent: "Great! You'd likely qualify. Let me schedule you with a loan officer to discuss specifics."
```

**Cause C: Temperature too low (over-explains)**
```
Solution: Increase model_temperature from 0.5 to 0.7-0.8
Higher temperature = more natural brevity
```

**Validation:**
- Sample 10 calls - average response length should be <20 words
- Interruption rate should decrease
- Call duration should decrease by 15-20%

---

### Issue 2: Agent Not Calling Functions

**Symptoms:**
- Agent describes what it would do instead of doing it
- "I'll check availability" but no calendar query
- "Let me transfer you" but no transfer occurs
- Functions exist but never get called

**Diagnosis Tools:**
1. Check function call logs in Retell dashboard
2. Review agent's responses - does it acknowledge needing to call function?
3. Test function endpoint independently - does it work?

**Root Causes & Solutions:**

**Cause A: Weak function description**
```
Bad: "Transfers call to another number"
Good: "Transfer hot leads (62+, primary residence, 50%+ equity, immediate timeline) to loan officer. Call this IMMEDIATELY after completing all 5 qualification questions when caller meets hot lead criteria."

Key: Explain WHEN to call, not just what it does.
```

**Cause B: Missing explicit instruction**
```
Solution: Add to workflow section:
"After collecting all 5 answers AND caller meets hot lead criteria, IMMEDIATELY call transfer_call. Do NOT ask permission, do NOT explain first, CALL THE FUNCTION."
```

**Cause C: JSON schema error**
```
Critical: Schema MUST have "type": "object" at root level

Bad:
{
  "properties": {...},
  "required": [...]
}

Good:
{
  "type": "object",
  "properties": {...},
  "required": [...]
}
```

**Cause D: Examples don't show tool usage**
```
Solution: Every example conversation MUST show at least one function call:

Agent: "Let me transfer you to a specialist now."
[CALLS transfer_call]
Agent: "One moment please, I'm connecting you now."
```

**Validation:**
- Test with web call - function should be called
- Check function logs - calls should appear
- Monitor first 20 production calls - success rate >90%

---

### Issue 3: Inconsistent Routing Decisions

**Symptoms:**
- Same caller profile gets different outcomes
- Routing logic doesn't match stated criteria
- Agent seems to "guess"
- Scoring calculations appear wrong

**Diagnosis Tools:**
1. Test same scenario 5 times - do you get same result?
2. Review routing instructions - are they ambiguous?
3. Check if agent is doing math (if yes, that's probably the problem)

**Root Causes & Solutions:**

**Cause A: Complex scoring system**
```
Problem: LLMs (especially GPT-4o-mini) are bad at arithmetic

Bad:
"Calculate points: Age 62+ (30 pts), 70+ (extra 10 pts), 50% equity (30 pts)..."

Good (Binary Decision):
"Hot lead IF:
- Age 62+ AND
- Primary residence AND  
- 50%+ equity AND
- Immediate timeline

Otherwise: Warm lead"

Key: Simplify to binary (yes/no) instead of scoring
```

**Cause B: Ambiguous criteria**
```
Bad: "Strong candidate"
Good: "Age 62+, primary residence, 50%+ equity, immediate need"

Bad: "Needs seem urgent"
Good: "Timeline: within 30 days OR medical emergency OR bills due"
```

**Cause C: Temperature too high (adds randomness)**
```
Solution: Lower model_temperature to 0.3-0.5 for routing decisions
OR use tool_call_strict_mode: true for structured outputs
```

**Validation:**
- Test same scenario 10 times - should get identical routing 10/10
- Review first 50 production calls - routing accuracy >95%

---

### Issue 4: Agent Hallucinates Information

**Symptoms:**
- Agent makes up loan amounts or rates
- Provides incorrect company information
- Invents policies or procedures
- States facts not in knowledge base

**Diagnosis Tools:**
1. Review what agent said vs. what's in prompt/knowledge base
2. Check if agent is asked questions it doesn't have answers to
3. Look for overly confident language ("definitely", "certainly")

**Root Causes & Solutions:**

**Cause A: Mixing facts with instructions**
```
Problem: Facts in general_prompt get confused with behavioral instructions

Solution: Separate into knowledge base:
- IN PROMPT: How to behave, what to do
- IN KNOWLEDGE BASE: Product details, FAQs, policies

Use: knowledge_base_ids parameter in LLM config
```

**Cause B: No explicit "don't know" instruction**
```
Solution: Add to guardrails:
"If you don't know something, say: 'I don't have that specific information. Let me connect you with someone who can answer that.' Never make up information."
```

**Cause C: Temperature too high**
```
Solution: Lower model_temperature from 0.8 to 0.3-0.5
Lower temp = more grounded in training data / context
```

**Cause D: Overly complex questions callers ask**
```
Solution: Add to instructions:
"For technical questions beyond your scope, respond: 'That's a great question. Our specialists can give you the exact details. Would you like me to connect you?'"
```

**Validation:**
- Test with questions agent shouldn't know answers to
- Should say "I don't know" or offer escalation
- Never should invent specifics

---

### Issue 5: Agent Sounds Robotic

**Symptoms:**
- Responses sound unnatural or scripted
- No conversational flow
- Awkward phrasing
- Callers comment it "sounds like a robot"

**Diagnosis Tools:**
1. Listen to recordings - would you talk to a friend this way?
2. Read responses aloud - do they sound like speech?
3. Check for overly formal language

**Root Causes & Solutions:**

**Cause A: No contractions**
```
Bad: "I will", "You are", "That is", "We would"
Good: "I'll", "You're", "That's", "We'd"

Solution: Add to style guide:
"Use contractions naturally (I'll, you're, that's). Sound conversational, not formal."
```

**Cause B: No conversational fillers**
```
Bad: "Let me check the calendar system."
Good: "Let me see... okay, checking availability now."

Solution: Add to rules:
"Use natural fillers: 'umm', 'let me see', 'okay', 'alright', 'one moment'. Use 1-2 per conversation, don't overdo it."
```

**Cause C: Formal/academic language**
```
Bad: "I shall proceed to coordinate..."
Good: "I'll set that up..."

Bad: "In accordance with your request..."
Good: "Based on what you said..."

Solution: Rewrite prompt in conversational language
```

**Cause D: No ambient sound**
```
Solution: Add ambient_sound: "coffee-shop" or "office"
Creates subtle background noise that makes AI sound more natural
```

**Cause E: Wrong voice_temperature**
```
Solution: Adjust voice_temperature to 0.8-1.0
Higher = more expressive, less monotone
```

**Validation:**
- Have non-technical person listen to recordings
- Ask: "Does this sound like a person?"
- Should not be able to instantly identify as AI

---

### Issue 6: Slow Response Time / Latency

**Symptoms:**
- Long pauses before agent responds (>2 seconds)
- Callers say "Hello? Are you there?"
- Functions take too long to execute
- Overall call feels sluggish

**Diagnosis Tools:**
1. Retell dashboard latency metrics
2. Function execution time logs
3. Prompt token count (longer = slower)

**Root Causes & Solutions:**

**Cause A: Model too slow**
```
Solution: Switch from GPT-4o to GPT-4o-mini
Savings: 40% cost reduction + faster responses
Trade-off: Slightly less capable with complex logic
```

**Cause B: Prompt too long**
```
Problem: Prompts >2,000 tokens slow down inference

Solution: 
- Remove unnecessary examples or explanations
- Move facts to knowledge_base
- Target: <1,500 tokens for single-prompt
```

**Cause C: speak_during_execution = false**
```
Problem: Function calls create awkward silence

Solution: Set speak_during_execution: true
Agent says "Let me check that for you" while function runs
```

**Cause D: Function endpoint slow**
```
Problem: Custom function takes >2 seconds to respond

Solution:
- Optimize endpoint (caching, database indexes)
- Set timeout_ms appropriately (default 120000 = 2 min)
- Consider async processing for slow operations
```

**Cause E: Complex decision logic**
```
Problem: Lots of branching = slow processing

Solution: Simplify logic or split to multi-prompt
Each state has simpler decision tree
```

**Validation:**
- Target: <1 second from end of caller speech to agent response
- Function calls: <2 seconds total (including speech)
- No awkward silences perceived by caller

---

### Issue 7: Poor Objection Handling

**Symptoms:**
- Agent gives up when caller raises concerns
- Doesn't address objections effectively
- Transfers too quickly to avoid hard conversations
- Callers hang up when objections arise

**Diagnosis Tools:**
1. Review recordings with objection patterns
2. Check what percentage of objections lead to hang-ups
3. Identify most common objections

**Root Causes & Solutions:**

**Cause A: No objection handling in prompt**
```
Solution: Add common objections to examples:

Example: Privacy Objection
Caller: "I don't like giving out all this personal information."
Agent: "I completely understand. We only ask for information needed to see if you qualify. Everything is kept confidential and we never share your data. Would you like me to connect you with our privacy officer who can explain our protections?"
```

**Cause B: Agent takes objections as rejection**
```
Solution: Add to instructions:
"Objections are normal, not rejections. Address the concern empathetically, provide brief reassurance, then ask if they'd like to continue. Never give up on first objection."
```

**Cause C: No empathy in responses**
```
Bad: "That's our process."
Good: "I understand that concern. Many people feel the same way at first."

Solution: Add empathy framework:
1. Acknowledge: "I understand"
2. Normalize: "That's a common concern"
3. Address: Brief reassurance
4. Offer: "Would you like to continue / speak with specialist?"
```

**Validation:**
- Test with scripted objections
- Agent should address, not deflect
- Conversion rate on objection calls should improve

---

### Issue 8: State Transition Failures (Multi-Prompt)

**Symptoms:**
- Agent stuck in wrong state
- Transitions happen prematurely
- Can't move forward in conversation
- Loops back to earlier state

**Diagnosis Tools:**
1. Check state transition conditions in edges
2. Review what parameters trigger transitions
3. Test transition explicitly

**Root Causes & Solutions:**

**Cause A: Ambiguous transition conditions**
```
Bad:
edges: [{
  destination_state_name: "booking",
  description: "When ready to book"
}]

Good:
edges: [{
  destination_state_name: "booking",
  description: "Transition when: Age verified 62+, primary residence confirmed, equity >=50%, AND caller says yes to scheduling. Do NOT transition until ALL conditions met."
}]
```

**Cause B: Missing required parameters**
```
Problem: Transition requires parameters but schema missing

Solution: Define parameters explicitly:
parameters: {
  type: "object",
  properties: {
    age: {type: "number"},
    is_qualified: {type: "boolean"}
  },
  required: ["age", "is_qualified"]
}
```

**Cause C: Multiple edges with overlapping conditions**
```
Problem: Two transitions both match, agent confused

Solution: Make conditions mutually exclusive:
Edge 1: "IF qualified AND immediate → hot_lead_state"
Edge 2: "IF qualified AND NOT immediate → warm_lead_state"
Edge 3: "IF NOT qualified → disqualified_state"
```

**Validation:**
- Test each transition explicitly
- Verify parameters pass through correctly
- Should never get stuck or loop unexpectedly

---

## Performance Monitoring

### Key Metrics to Track

**Call Quality:**
- Average call duration (target varies by use case)
- Completion rate (% calls reaching end of flow)
- Interruption rate (% turns where caller interrupts)
- Transfer success rate (if applicable)

**Function Calling:**
- Function call success rate (target: >95%)
- Function call latency (target: <2 seconds)
- Proper function selection rate

**Routing Accuracy:**
- % calls routed correctly (target: >90%)
- False positive rate (wrong routing)
- False negative rate (missed opportunities)

**Customer Experience:**
- Call recordings review (sample 10-20/week)
- Customer satisfaction scores (if available)
- Hang-up rate before completion

### When to Optimize vs. Rebuild

**Optimize (Iterate on Existing)**:
- Issues affect <20% of calls
- Root cause is clear
- Fix is targeted and testable
- Agent mostly works well

**Rebuild (Start Over)**:
- Issues affect >50% of calls
- Multiple fundamental problems
- Prompt has become unmaintainable
- Requirements changed significantly

## Cost Optimization

### Reducing Per-Call Costs

**Model Selection:**
- Start: GPT-4o ($0.10-0.12/min)
- Optimize to: GPT-4o-mini ($0.03-0.04/min)
- Savings: ~40-60%

**Voice Selection:**
- Premium: ElevenLabs ($0.02-0.03/min)
- Standard: Cartesia ($0.01-0.02/min)
- Savings: ~20-30%

**Call Duration:**
- Reduce unnecessary back-and-forth
- Faster routing decisions
- Each minute saved = direct cost savings

**Prompt Optimization:**
- Shorter prompts = faster inference
- Target: <1,500 tokens
- Savings: ~10-15% on model costs

### Quality vs. Cost Trade-offs

**Where to save:**
- Voice (Cartesia is good quality at lower cost)
- Model (GPT-4o-mini handles simple flows well)
- Call duration (efficiency is good for callers too)

**Where NOT to save:**
- Compliance (never worth the risk)
- Testing (prevents costly mistakes)
- Critical functions (booking, transfers)

## Optimization Checklist

Before deploying optimizations:
- [ ] Root cause identified with evidence
- [ ] Solution tested in isolation
- [ ] No regression in other areas
- [ ] Metrics defined to track improvement
- [ ] Rollback plan if optimization fails

After deploying:
- [ ] Monitor first 50 calls closely
- [ ] Compare metrics to baseline
- [ ] Document what changed and why
- [ ] Iterate if needed

**Remember**: Optimize incrementally. Change one thing at a time so you know what worked (or didn't).
