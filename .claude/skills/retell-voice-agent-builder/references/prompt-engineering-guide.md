# Prompt Engineering Guide for Voice AI Agents

**Framework**: CRISP (Context, Role, Instructions, Structure, Patterns)  
**Application**: Retell AI voice agents  
**Goal**: Build prompts that deliver consistent, high-quality conversational experiences

## Why CRISP Works for Voice AI

Voice AI prompts require different considerations than text-based chatbots:
- **Real-time constraints**: No edit or retry - responses must be right the first time
- **Speech naturalness**: Text that reads well may sound robotic when spoken
- **Cognitive load**: Callers can't scroll back, must process audio sequentially
- **Interruption handling**: Conversations aren't linear like text exchanges
- **Latency sensitivity**: Long prompts slow response time

Research shows prompts in the 800-1,500 token range with high information density significantly outperform both brief and overly detailed alternatives for voice applications.

## The CRISP Framework

### C - Context: Set the Stage

**Purpose**: Provide essential background without overwhelming the model.

**What to Include:**
- Domain and business purpose
- Target audience demographics and characteristics
- Key constraints (legal, technical, business)
- Available tools and integrations
- Dynamic variables (phone number, time, location)

**What to Exclude:**
- Information the model already knows
- Unnecessary company history
- Overly detailed process explanations

**Example - Good Context:**
```
You are a professional voice assistant for SilverBridge Mortgage, specializing in Home Equity Conversion Mortgages (HECMs) for homeowners 62 and older.

CONTEXT:
Phone number: {{user_number}}
Current time: {{current_time_America/New_York}}
CRM contact ID: {{contact_id}} (if returning caller)

YOUR MISSION:
Speed-to-lead qualification - identify hot prospects within 3-5 minutes for immediate loan officer transfer. This is rapid triage, not comprehensive underwriting.
```

**Example - Poor Context:**
```
You are an AI assistant for SilverBridge Mortgage, a company founded in 2018 that serves the greater Washington DC metropolitan area including Virginia, Maryland, West Virginia, and Washington DC. The company specializes in Home Equity Conversion Mortgages which are also known as reverse mortgages or HECMs. The company was started by John Smith who has 25 years of experience in the mortgage industry...
[Continues with unnecessary detail]
```

### R - Role: Define AI Identity

**Purpose**: Establish clear expertise level, communication style, and relationship to brand.

**Components:**
1. **Name and Title**: Specific role, not just "AI assistant"
2. **Expertise Level**: Junior (training), Standard (competent), Senior (expert), Specialist (domain expert)
3. **Communication Style**: Tone, pacing, formality level
4. **Brand Alignment**: How this agent represents the company

**Role Definition Template:**
```
You are [Name], a [level] [specialty] specialist for [Company].

Your expertise: [What you know deeply]
Your communication style: [How you talk]
Your relationship to callers: [Trusted advisor / Helpful guide / Professional gatekeeper]
```

**Examples by Use Case:**

**Senior Specialist (HECM):**
```
You are Sarah, a senior HECM specialist for SilverBridge Mortgage. You have deep knowledge of reverse mortgages for homeowners 62+ and speak with warm, patient professionalism. Your role is to quickly identify qualified prospects and connect them with loan officers.
```

**Front Desk Assistant (Dental):**
```
You are Maya, the friendly front desk assistant for Bright Smile Dental. You handle appointment scheduling, insurance verification, and patient questions with cheerful efficiency. You're the welcoming first voice patients hear.
```

**Technical Support (Software):**
```
You are Alex, a technical support specialist for CloudSync. You troubleshoot software issues with clear, jargon-free explanations. Your goal is to resolve issues quickly or escalate to engineering when needed.
```

### I - Instructions: Specify the Task

**Purpose**: Provide step-by-step guidance that eliminates ambiguity.

**Instruction Hierarchy:**
1. **Primary Mission**: One sentence - what is the #1 goal?
2. **Critical Rules**: 3-5 behavioral constraints that must never be violated
3. **Workflow Steps**: Sequential process for achieving the goal
4. **Decision Logic**: When to branch, what conditions trigger what actions
5. **Tool Calling**: Explicit conditions for when to call functions
6. **Edge Cases**: How to handle unexpected scenarios

**Instructions Template:**
```
## PRIMARY MISSION
[One clear sentence stating the #1 goal]

## CRITICAL RULES
1. [Most important behavioral constraint]
2. [Second most important]
3. [Third most important]
[Max 5 rules - make them count]

## WORKFLOW
Step 1: [What to do first]
Step 2: [What to do next]
Step 3: [Decision point - if X then Y, if A then B]
Step 4: [Tool calling condition]
Step 5: [How to close]

## DECISION LOGIC
When [condition], do [action]
When [different condition], do [different action]
If [edge case], then [handling]

## TOOL CALLING
Call [function_name] when:
- [Specific condition 1]
- [Specific condition 2]
Never call [function_name] until [prerequisite]
```

**Example - Well-Structured Instructions:**
```
## PRIMARY MISSION
Your job is SPEED-TO-LEAD qualification. Get hot prospects to human specialists FAST - within 3-5 minutes.

## CRITICAL CONVERSATIONAL RULES
1. ASK ONLY ONE QUESTION AT A TIME - never multiple questions in same turn
2. Keep responses under 3 sentences - seniors need clear, concise information
3. Use conversational fillers naturally ("um", "let me see", "okay") 
4. Never mention function names to callers ("I'm calling a database")
5. Give seniors time to answer - don't rush or interrupt

## 5-QUESTION WORKFLOW
1. Opening: Greet, identify company, ask for state
2. Compliance: Recording consent (if Maryland), HUD disclosure
3. Question 1: Age verification (must be 62+)
4. Question 2: Primary residence & ownership status
5. Question 3: Equity level (high-level, 50%+ check)
6. Question 4: Intent & timeline (immediate vs exploring)
7. Question 5: HUD counseling status
8. Routing: Based on answers, transfer OR book OR nurture

## ROUTING DECISION LOGIC
IF age 62+ AND primary residence AND 50%+ equity AND immediate timeline:
  → HOT LEAD → Call transfer_call immediately
ELSE IF age 62+ AND primary residence AND exploring:
  → WARM LEAD → Call book_appointment_cal
ELSE:
  → NOT QUALIFIED → Offer to send info, end call politely
```

### S - Structure: Define Output Format

**Purpose**: Shape HOW the agent communicates (length, style, pacing).

**Key Structural Elements:**
1. **Response Length**: Maximum sentences per response
2. **Sentence Structure**: Simple vs complex
3. **Pacing Cues**: When to pause, when to wait
4. **Acknowledgment Pattern**: How to confirm understanding
5. **Transition Phrases**: How to move between topics

**Structure Guidelines for Voice:**

**Short Responses (Recommended):**
- Max 2-3 sentences per turn
- Simple sentence structure
- One idea per sentence
- Natural pauses between sentences

**Medium Responses (Use Sparingly):**
- 3-5 sentences for explanations
- Use when educating or handling objections
- Break into digestible chunks
- Include rhetorical questions to engage

**Long Responses (Avoid):**
- Anything over 5 sentences
- Causes cognitive overload in voice
- Caller will interrupt or zone out
- Save for text/email follow-up

**Example - Structure Specification:**
```
## RESPONSE STYLE
**Length**: Keep all responses under 3 sentences. If explanation requires more, ask if caller wants details first.

**Sentence Structure**: Use simple, declarative sentences. Avoid subordinate clauses and complex grammar.

**Pacing**: 
- After asking a question, STOP and wait for response
- Don't fill silence with additional questions
- Acknowledge answers with brief confirmation ("Got it", "Perfect", "Okay")

**Conversational Fillers**: 
Use naturally: "umm", "let me see", "okay", "alright", "one moment"
Don't overuse - 1-2 per conversation is natural

**Professional But Warm**:
"I understand" not "I comprehend"
"That makes sense" not "That is logical"
"Perfect" not "Excellent" (less corporate)
```

### P - Patterns: Provide Examples

**Purpose**: Show the model exactly what good looks like through concrete examples.

**What to Include:**
- 2-3 full conversation examples
- Different paths (happy path, objection, edge case)
- 8-15 turns per example
- Realistic caller responses
- Proper tool calling in context

**Example Quality Markers:**
- Natural speech patterns
- Appropriate pacing and pauses
- Correct handling of interruptions
- Successful tool calls
- Professional yet conversational tone

**Example Structure:**
```
## EXAMPLE CONVERSATION 1: [Scenario Name]
**Caller Profile**: [Demographics, intent, knowledge level]
**Outcome**: [What should happen]

Agent: [Opening line]
Caller: [Realistic response]
Agent: [Follow-up showing good technique]
Caller: [Another realistic response]
Agent: [Handling well]
[Continue for full conversation]
[Show tool calling]
[Show successful conclusion]

## EXAMPLE CONVERSATION 2: [Different Scenario]
**Caller Profile**: [Different demographics/intent]
**Outcome**: [Different outcome]

[Full conversation showing alternative path]

## EXAMPLE CONVERSATION 3: [Edge Case]
**Caller Profile**: [Challenging scenario]
**Outcome**: [How to handle gracefully]

[Full conversation showing problem-solving]
```

**Key Principle for Examples**: 
Show, don't tell. One good example is worth 100 words of explanation.

## Sectional Prompt Organization

Break prompts into clear sections for maintainability and LLM comprehension:

```
## ROLE
[Who the agent is]

## CONTEXT
[Essential background and variables]

## PRIMARY MISSION
[One-sentence goal]

## CRITICAL CONVERSATIONAL RULES
[3-5 must-follow constraints]

## TASK & WORKFLOW
[Step-by-step process]

## DECISION LOGIC
[Branching conditions]

## TOOL CALLING
[When to call functions]

## EXAMPLE CONVERSATIONS
[2-3 full scenarios]

## GUARDRAILS
[What NOT to do]
```

## Prompt Length Guidelines

**Target Ranges by Agent Type:**

**Simple Single-Prompt Agents**: 800-1,200 tokens
- Linear conversation flow
- 3-5 key decision points
- Minimal branching logic
- Example: Appointment scheduling, simple FAQs

**Complex Single-Prompt Agents**: 1,200-1,500 tokens
- More sophisticated branching
- Multiple tool integrations
- Nuanced decision logic
- Example: Lead qualification, technical support

**Multi-Prompt Agents (Per State)**: 500-800 tokens
- Each state has focused purpose
- Simpler logic per state
- State transitions handle complexity
- Example: Qualify → Schedule → Confirm flow

**When to Split to Multi-Prompt:**
- Single prompt exceeds 1,500 tokens
- Complex branching creates confusion
- Need to enforce sequential steps
- Different tools per conversation phase

## Voice-Specific Best Practices

### Write for Speech, Not Reading

**Good (Natural Speech):**
```
"Based on what you've shared, you'd likely qualify. I'd like to schedule you for a call with one of our senior loan officers."
```

**Bad (Sounds Robotic):**
```
"In accordance with the information provided during our interaction, your profile demonstrates eligibility. I shall proceed to coordinate a telephonic consultation with a senior lending specialist."
```

### Use Contractions

**Good**: "I'll", "You're", "We'd", "That's"  
**Bad**: "I will", "You are", "We would", "That is"

### Avoid Lists in Speech

**Good (Conversational):**
```
"Great! I need to collect three quick pieces of information: your age, whether this is your primary home, and how much equity you have."
```

**Bad (List Format):**
```
"I need to collect the following:
1. Your age
2. Whether this is your primary residence
3. Your home equity level"
```

### Handle Interruptions Gracefully

Include guidance on mid-sentence interruption:
```
If caller interrupts:
- Let them finish their thought completely
- Acknowledge what they said ("I understand", "That makes sense")
- Either answer their question or guide back: "To answer that, I first need to know [X]"
- Never say "As I was saying" or "Let me finish"
```

### Senior-Friendly Modifications

For 62+ demographic:
- Slower pacing (don't rush)
- Simpler sentences (one idea each)
- No jargon or acronyms
- More frequent confirmations
- Extra patience with silence
- Louder, clearer pronunciation

Example senior-friendly language:
```
"May I ask your age?" 
Not: "Can you provide your date of birth?"

"Do you own your home or rent?"
Not: "What is your domicile ownership status?"

"About how much is your home worth?"
Not: "What's the current market valuation of your property?"
```

## Compliance and Legal Language

### When Verbatim Language is Required

Some compliance disclosures MUST be word-for-word:
- Recording consent notifications
- Federal disclosures (HUD, CFPB)
- State-specific regulatory language
- Privacy policies

**Mark these clearly:**
```
## MANDATORY DISCLOSURE (MUST SAY VERBATIM)
"This call is being recorded for quality and training purposes."

## FEDERAL REQUIREMENT (EXACT WORDING)
"HUD requires all reverse mortgage borrowers to speak with an independent counselor before proceeding."
```

### When Directional Guidance is Better

For non-regulated communication:
- Use directional language ("Explain that...")
- Let LLM find natural phrasing
- Sounds more conversational
- Still conveys required information

**Example - Directional:**
```
Explain that you'll need to check their calendar availability and it will take a moment. Speak naturally while the function runs.
```

Not:
```
Say exactly: "Please hold while I access the system to check availability."
```

## Testing Prompt Quality

### Quick Quality Checks

**Pass these tests:**
1. Can you remove any section without losing critical functionality? (No? Good - it's concise)
2. Do the examples show significantly different scenarios? (Yes? Good - comprehensive)
3. Could a human follow these instructions to do the job? (Yes? Good - clear enough)
4. Are decision points explicit with conditions? (Yes? Good - no ambiguity)
5. Is every tool call condition stated clearly? (Yes? Good - function calling will work)

### Common Prompt Problems

**Problem**: Agent talks too much
**Fix**: Add rule "Keep responses under 2-3 sentences" and show concise examples

**Problem**: Agent not calling functions
**Fix**: Strengthen function descriptions and add explicit "When X, call Y" instructions

**Problem**: Agent sounds robotic
**Fix**: Add conversational fillers, use contractions, show natural examples

**Problem**: Agent gets confused easily
**Fix**: Simplify decision logic, reduce branching, consider multi-prompt

**Problem**: Inconsistent behavior
**Fix**: Add more example conversations showing edge cases

## Iterative Refinement Process

1. **Write v1**: Focus on getting core logic right
2. **Test with web calls**: Try 5-10 different scenarios
3. **Identify patterns**: What works? What breaks?
4. **Refine v2**: Update rules and examples based on testing
5. **Test again**: Validate improvements
6. **Monitor real calls**: First 20-50 real calls show edge cases
7. **Refine v3**: Final tuning based on real-world data

**Version Control**: Save each major version with notes on what changed and why.

## Advanced Techniques

### Dynamic Variable Usage

Use variables for:
- Personalization: `{{user_name}}`, `{{contact_id}}`
- Time-based logic: `{{current_time}}`, `{{current_date}}`
- Context preservation: `{{last_interaction_date}}`, `{{previous_outcome}}`
- Geographic: `{{user_location}}`, `{{timezone}}`

Example:
```
IF {{contact_id}} exists:
  "Welcome back! I see we spoke with you on {{last_interaction_date}}. Are you ready to move forward with [X]?"
ELSE:
  "Thanks for calling! This is your first time speaking with us, correct?"
```

### Knowledge Base Separation

**In Prompt** (Instructions):
- How to conduct conversation
- When to call tools
- Decision logic
- Behavioral rules

**In Knowledge Base** (Facts):
- Product details and pricing
- FAQs and standard answers
- Policy information
- Technical specifications

**Why Separate**: Prevents conflicting instructions, makes facts easier to update, reduces prompt token count.

### Temperature Tuning

**Lower Temperature (0.3-0.5)**: More consistent, deterministic
- Use for: Qualification criteria, complian ce language, data collection
- Trade-off: Can sound more robotic

**Medium Temperature (0.6-0.8)**: Balanced
- Use for: General conversation, most use cases
- Sweet spot for natural + consistent

**Higher Temperature (0.8-1.0)**: More creative, variable
- Use for: Creative tasks, less structured conversations
- Trade-off: Less consistent, can drift off-topic

**Recommendation**: Start at 0.7, adjust based on testing.

## Summary Checklist

Before deploying a prompt:
- [ ] CRISP framework applied (all 5 components)
- [ ] Sectional organization (easy to read and maintain)
- [ ] 2-3 example conversations showing different paths
- [ ] All decision points have explicit conditions
- [ ] Tool calling conditions clearly stated
- [ ] Response length constraints specified
- [ ] Compliance language marked as verbatim or directional
- [ ] Target token length achieved (800-1,500 for single-prompt)
- [ ] Tested with web calls (5+ different scenarios)
- [ ] Natural speech patterns (contractions, fillers, simple sentences)

**Remember**: Prompt engineering is iterative. The first version is a starting point. Real-world testing reveals what needs refinement. Plan for 2-3 optimization cycles.
