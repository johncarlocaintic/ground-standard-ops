# Testing Patterns for Retell AI Voice Agents

Comprehensive testing methodology for validating voice agent behavior before production deployment.

## Testing Philosophy

**Key Principle**: Test early, test often, test realistically.

Voice agents have no "undo" button - every call is a customer experience. Rigorous testing prevents:
- Compliance violations
- Poor customer experiences
- Lost revenue from routing errors
- Brand damage from agent failures

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /  Edge  \
                /  Cases   \
               /____________\
              /              \
             /    Functional  \
            /      Testing     \
           /__________________  \
          /                      \
         /    Unit Testing         \
        /   (Prompt, Config, Tools) \
       /_____________________________\
```

### Level 1: Unit Testing (Quick Validation)

Test individual components in isolation.

**Prompt Validation:**
- Read prompt aloud - does it sound natural?
- Token count check - within target range?
- Compliance language present and correct?
- Decision logic clear and unambiguous?

**Configuration Validation:**
- Voice appropriate for demographic?
- Temperature setting correct for use case?
- Tool configurations have proper JSON schemas?
- Dynamic variables properly formatted?

**Tool Validation:**
- Test each function endpoint independently
- Verify JSON schema syntax
- Confirm required fields are marked
- Check "type": "object" at root level

**Quick Tests (Before web call testing):**
1. Run prompt through grammar checker
2. Verify all placeholder values filled in
3. Check for contradictory instructions
4. Confirm examples match current prompt logic

### Level 2: Functional Testing (Web Call Testing)

Test complete conversation flows with realistic scenarios.

**Use**: `retellai-mcp-server:create_web_call` for immediate testing.

**Standard Test Suite (5 Required Scenarios):**

**1. Happy Path Test**
- Purpose: Verify ideal case works perfectly
- Caller: Fully qualified, cooperative, provides all info
- Expected: Smooth conversation, correct routing, proper tool calls

**2. Objection Handling Test**
- Purpose: Verify agent handles concerns gracefully
- Caller: Raises objections or questions mid-flow
- Expected: Answers questions, returns to flow, maintains professionalism

**3. Incomplete Information Test**
- Purpose: Verify agent handles missing data
- Caller: Doesn't know answers or provides vague responses
- Expected: Probing questions, graceful handling, doesn't make assumptions

**4. Disqualification Test**
- Purpose: Verify proper handling of non-qualified leads
- Caller: Doesn't meet criteria (age, property type, etc.)
- Expected: Polite decline, offer alternatives, professional exit

**5. Interruption Test**
- Purpose: Verify agent handles caller interruptions
- Caller: Interrupts agent mid-sentence with questions
- Expected: Stops, listens, addresses question, returns to flow

### Level 3: Edge Case Testing (Advanced Scenarios)

Test unusual or problematic scenarios.

**Edge Case Catalog:**

**Technical Edge Cases:**
- Function call failures (timeout, error response)
- Missing dynamic variables
- Calendar has no availability
- Transfer destination busy/unavailable
- Multiple rapid interruptions

**Conversational Edge Cases:**
- Caller rambles or goes off-topic
- Caller asks questions during every response
- Caller provides contradictory information
- Caller doesn't understand questions
- Silence (caller doesn't respond)

**Demographic Edge Cases:**
- Language barriers or heavy accents
- Hearing difficulties (asks for repeats)
- Very slow responders (seniors)
- Very fast talkers (impatient)
- Background noise or poor connection

**Business Logic Edge Cases:**
- Returning caller (should recognize)
- Edge of qualification criteria (62nd birthday today)
- Multiple properties (which one?)
- Shared ownership (who's the decision maker?)

## Test Scenario Template

Use this template to create comprehensive test scripts:

```
## SCENARIO NAME: [Descriptive title]

**Test ID**: T-[number]
**Priority**: Critical / High / Medium / Low
**Test Type**: Happy Path / Objection / Edge Case / Regression

**PURPOSE**: 
[What specific behavior this test validates]

**SETUP**:
- Agent version: [agent ID or version number]
- Dynamic variables: [any specific values needed]
- CRM state: [clean / has existing contact / etc.]

**CALLER PROFILE**:
- Demographics: [age, location, etc.]
- Intent: [what they want]
- Knowledge level: [expert / informed / naive]
- Communication style: [cooperative / skeptical / confused]

**CONVERSATION SCRIPT**:

Turn 1:
Agent: [Expected opening]
Caller: [Test response]
Validation: [What to check]

Turn 2:
Agent: [Expected response]
Caller: [Test response]
Validation: [What to check]

[Continue for 8-15 turns]

**EXPECTED OUTCOME**:
- Final action: [transfer / book / decline]
- Tool calls: [list expected function calls]
- CRM state: [contact created / tags added / etc.]
- Call duration: [target time range]

**PASS CRITERIA**:
- [ ] All required questions asked
- [ ] Proper sequence followed
- [ ] Correct routing decision
- [ ] Functions called appropriately
- [ ] Professional tone maintained
- [ ] Compliance requirements met

**FAIL SCENARIOS**:
- Agent skips required questions
- Wrong routing decision
- Functions not called when needed
- Robotic or unprofessional responses
- Compliance language omitted
```

## Sample Test Scenarios by Vertical

### HECM Lead Qualification - Test Suite

**T-001: Hot Lead (Happy Path)**
```
Caller Profile: 68-year-old, primary residence, 75% equity, needs money for medical bills
Expected: All 5 questions → Transfer to loan officer
Pass Criteria: Transfer call made, warm handoff language used
```

**T-002: Warm Lead (Exploration)**
```
Caller Profile: 63-year-old, paid-off home, just exploring options, no rush
Expected: All 5 questions → Appointment booking
Pass Criteria: Calendar checked, appointment booked, confirmation provided
```

**T-003: Age Disqualification**
```
Caller Profile: 58 years old, otherwise qualified
Expected: Question 1 → Polite decline, offer to send info
Pass Criteria: No further qualification, professional exit, offer alternatives
```

**T-004: Maryland Recording Consent**
```
Caller Profile: Maryland resident, otherwise qualified
Expected: Explicit recording consent requested and received before continuing
Pass Criteria: Agent asks "Is that okay?", waits for explicit "yes"
```

**T-005: Investment Property**
```
Caller Profile: 65-year-old, but property is rental/investment
Expected: Question 2 → Polite decline
Pass Criteria: Correctly identifies not primary residence, doesn't continue
```

**T-006: Objection - Privacy Concern**
```
Caller Profile: Qualified but worried about giving too much information
Expected: Address concern, explain necessity, offer to speak with human
Pass Criteria: Empathetic response, doesn't push, offers escalation
```

**T-007: Incomplete Information - Unsure of Equity**
```
Caller Profile: 70-year-old, knows home value (~$300K) but unsure of mortgage balance
Expected: Ask simpler question: "Do you owe more or less than half the home's value?"
Pass Criteria: Rephrases question, gets directional answer, proceeds appropriately
```

**T-008: Returning Caller Recognition**
```
Caller Profile: Previously spoke with agent, calling back for update
Expected: Recognizes contact_id, references previous conversation
Pass Criteria: "Welcome back!", references prior interaction, picks up where left off
```

### Dental Appointment Booking - Test Suite

**T-101: New Patient Booking**
```
Caller Profile: New patient, needs cleaning, flexible schedule
Expected: Collect name, reason, insurance, availability → Book appointment
Pass Criteria: All info collected, appropriate time slot found, confirmation sent
```

**T-102: Emergency Appointment**
```
Caller Profile: Existing patient, severe toothache, needs same-day
Expected: Identify emergency, check emergency slots, escalate if none available
Pass Criteria: Urgency recognized, emergency protocol followed
```

**T-103: Insurance Verification Failure**
```
Caller Profile: Has insurance but not in system
Expected: Collect insurance info, explain verification process, book pending verification
Pass Criteria: Doesn't refuse booking, explains next steps clearly
```

### Customer Support - Test Suite

**T-201: Simple Issue Resolution**
```
Caller Profile: Can't log in, forgot password
Expected: Guide through password reset, verify working
Pass Criteria: Issue resolved without escalation, friendly tone maintained
```

**T-202: Technical Issue Requiring Escalation**
```
Caller Profile: Complex bug affecting multiple features
Expected: Collect details, create ticket, transfer to Level 2
Pass Criteria: Sufficient info collected for engineering, proper escalation
```

**T-203: Angry Customer**
```
Caller Profile: Frustrated with billing issue, accusatory tone
Expected: Stay calm, empathize, focus on resolution
Pass Criteria: De-escalation successful, maintains professionalism
```

## Testing Execution Process

### Phase 1: Pre-Production Testing (Before Launch)

**Week 1: Unit + Functional Testing**
- Run all 5 standard scenarios
- Fix critical issues
- Iterate on prompt based on findings

**Week 2: Edge Case + Regression Testing**
- Run all edge case scenarios
- Verify fixes didn't break existing functionality
- Document workarounds for known limitations

**Week 3: Load Testing (If applicable)**
- Test with multiple simultaneous calls
- Verify performance under load
- Check CRM integration at scale

### Phase 2: Production Testing (Soft Launch)

**Strategy**: Route percentage of calls to new agent, monitor closely

**Week 1: 10% Traffic**
- Monitor first 50 calls intensively
- Daily review of call recordings
- Quick fixes for urgent issues

**Week 2: 25% Traffic**
- Compare metrics to baseline
- Identify patterns in failures
- Refinement iteration

**Week 3: 50% Traffic**
- Validation of improvements
- Edge case monitoring
- Preparation for full rollout

**Week 4: 100% Traffic**
- Full production
- Ongoing monitoring
- Continuous optimization

### Phase 3: Ongoing Testing (Post-Launch)

**Daily**:
- Review failed calls (routing errors, function failures)
- Check compliance audit log

**Weekly**:
- Sample 20 random calls for quality
- Analyze call duration trends
- Review customer satisfaction if available

**Monthly**:
- Comprehensive performance review
- Regression testing of all scenarios
- Update test scenarios based on new patterns

## Test Data Management

### Creating Realistic Test Data

**Good Test Data Characteristics:**
- Represents real demographic distribution
- Includes edge cases (boundary values)
- Covers common objections and questions
- Mirrors actual communication styles

**Bad Test Data:**
- All perfect scenarios
- Unrealistic responses
- No objections or difficulties
- Robot-like caller behavior

### Test Data Templates

**HECM Caller Profiles:**
```
Profile A: "Ideal Senior"
- Age: 68
- Property: Paid off, $400K value
- Equity: 100%
- Timeline: Needs money within 30 days
- Behavior: Cooperative, direct answers
- Result: Hot lead → Transfer

Profile B: "Exploration Senior"
- Age: 64
- Property: Small mortgage, $350K value
- Equity: 85%
- Timeline: Just looking into options
- Behavior: Asks many questions, cautious
- Result: Warm lead → Appointment

Profile C: "Chatty Senior"
- Age: 72
- Property: Paid off, $500K value
- Equity: 100%
- Timeline: Immediate need
- Behavior: Rambles, goes off-topic, tells stories
- Result: Hot lead but difficult conversation → Transfer (with patience)

Profile D: "Confused Senior"
- Age: 70
- Property: Doesn't know details
- Equity: "I think so?"
- Timeline: "My kids said I should call"
- Behavior: Unsure, needs more explanation
- Result: Warm lead → Appointment with education
```

## Automated Testing Considerations

### What Can Be Automated

**Configuration Validation:**
- JSON schema syntax checking
- Required field verification
- Prompt token counting
- Compliance keyword detection

**API Testing:**
- Tool endpoint availability
- Response time monitoring
- Error rate tracking
- Rate limit testing

**Regression Testing:**
- Re-run standard scenarios automatically
- Compare transcripts to baseline
- Flag significant deviations
- Alert on failures

### What Requires Human Testing

**Conversational Quality:**
- Natural speech patterns
- Tone and empathy
- Handling of ambiguity
- Creative problem-solving

**Business Logic:**
- Correct routing decisions (context-dependent)
- Appropriate urgency assessment
- Nuanced objection handling
- Cultural sensitivity

**Edge Cases:**
- Truly unexpected scenarios
- Novel objections or questions
- Complex multi-factor decisions
- Real human unpredictability

## Test Reporting Template

```
## TEST EXECUTION REPORT

**Date**: [Date]
**Agent**: [Agent name and ID]
**Version**: [LLM version number]
**Tester**: [Who performed tests]

**SUMMARY**:
- Total scenarios tested: X
- Passed: Y
- Failed: Z
- Pass rate: Y/X %

**CRITICAL ISSUES** (Must fix before production):
1. [Issue description, scenario ID, severity]
2. [Issue description, scenario ID, severity]

**HIGH PRIORITY ISSUES** (Should fix soon):
1. [Issue description]
2. [Issue description]

**MINOR ISSUES** (Track for future):
1. [Issue description]
2. [Issue description]

**OBSERVATIONS**:
- [Positive findings]
- [Unexpected behaviors]
- [Opportunities for improvement]

**RECOMMENDATIONS**:
1. [Action item 1]
2. [Action item 2]

**NEXT STEPS**:
- [ ] Fix critical issues
- [ ] Re-test failed scenarios
- [ ] Update documentation
- [ ] Schedule production deployment
```

## Common Test Failures and Solutions

### Failure Pattern: Agent Not Calling Functions

**Symptoms**:
- Agent describes what it would do instead of doing it
- "I'll schedule an appointment" but doesn't call tool
- "Let me check availability" but no calendar query

**Root Causes**:
1. Weak function description (doesn't explain WHEN to call)
2. Missing "Call [function_name] when..." instruction
3. JSON schema errors preventing function definition
4. Insufficient examples showing tool usage

**Solutions**:
- Strengthen function descriptions with explicit triggers
- Add direct instruction: "After collecting X, immediately call Y"
- Validate JSON schemas have "type": "object"
- Include example conversations showing successful tool calls

### Failure Pattern: Inconsistent Routing

**Symptoms**:
- Same caller profile gets different outcomes on different calls
- Routing logic doesn't match stated criteria
- Agent seems to "guess" rather than follow rules

**Root Causes**:
1. Ambiguous decision criteria
2. Complex scoring system prone to calculation errors
3. Conflicting instructions in prompt
4. Temperature too high (adds randomness)

**Solutions**:
- Simplify to binary decisions (qualified/not qualified)
- Make criteria explicit with examples
- Remove contradictory instructions
- Lower temperature to 0.3-0.5 for routing decisions
- Use tool_call_strict_mode: true

### Failure Pattern: Verbose Responses

**Symptoms**:
- Agent talks too much per turn
- Long-winded explanations
- Multiple questions in one turn
- Caller interrupts frequently

**Root Causes**:
1. No explicit length constraint
2. Examples show long responses
3. Prompt uses academic/formal language
4. Temperature too low (over-explains)

**Solutions**:
- Add rule: "Keep responses under 2-3 sentences"
- Update all examples to show concise responses
- Use conversational language in prompt
- Increase temperature slightly (0.7 → 0.8)

### Failure Pattern: Compliance Violations

**Symptoms**:
- Recording consent skipped
- Required disclosures not made
- State-specific rules not followed
- Legal language paraphrased incorrectly

**Root Causes**:
1. Compliance section not prominent enough
2. Marked as "optional" instead of "mandatory"
3. Examples don't show compliance steps
4. Agent taking shortcuts for flow

**Solutions**:
- Move compliance to top of instructions section
- Mark as "MANDATORY" and "MUST SAY VERBATIM"
- Every example MUST include compliance steps
- Add penalty: "Never skip compliance - call will be terminated"
- Add validation check that flags missing keywords

## Testing Best Practices Summary

**Before Testing:**
- [ ] Prompt finalized and reviewed
- [ ] Test scenarios prepared
- [ ] Expected outcomes documented
- [ ] Testing environment ready (web calls configured)

**During Testing:**
- [ ] Document everything (recordings, transcripts, notes)
- [ ] Test one scenario fully before moving to next
- [ ] Don't skip edge cases ("it probably works")
- [ ] Involve multiple testers for different perspectives

**After Testing:**
- [ ] Compile comprehensive test report
- [ ] Prioritize issues by severity
- [ ] Create action plan with timeline
- [ ] Re-test after fixes before production

**Production Monitoring:**
- [ ] Monitor first 50 calls intensively
- [ ] Review failed calls daily
- [ ] Track metrics vs. baseline
- [ ] Iterate based on real-world learnings

**Remember**: Testing is not a one-time event. It's an ongoing process of validation, learning, and refinement. Great voice agents are built through rigorous testing and continuous improvement.
