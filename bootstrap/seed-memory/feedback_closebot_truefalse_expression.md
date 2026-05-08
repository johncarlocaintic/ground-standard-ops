---
name: CloseBot True/False (Comparator) AIExpression  -  state the TRUE condition only
description: The AI-powered Comparator evaluates whether the stated expression is TRUE. Just write the true statement; node routes FALSE automatically if not true. No "Answer TRUE if / Answer FALSE if" prose.
type: feedback
originSessionId: 50d7038a-cc6e-4c21-aa8b-71503b97ea77
---
The True/False node (Comparator in KDL) is a **silent binary router** per docs §6.10:
- Top branch = True (green)
- Bottom branch = False (red)

When "AI to Power the Decision" is enabled, the AI evaluates conversation history to determine if the **AIExpression** statement is true. If true → True branch. If false or uncertain → False branch. The routing is handled by the node, not by the prompt.

## The rule

**Write only the TRUE statement.** Reference specific state with `{{}}` variables where possible. That's it.

## Anti-pattern (what we had before)

```
"Look at this answer '{{nodes.n06_whofor_ask.result[0]}}'. 
Is the adult contact planning to train themselves? 
Answer TRUE if the adult said the class is for them, or for both them and their kid. 
Answer FALSE only when the class is exclusively for a kid or kids and the adult is NOT training themselves. 
Default to TRUE if uncertain."
```

Problems: explains the node's own routing back to the AI, which adds noise and can introduce interpretation drift. The node already knows what True and False mean.

## Correct pattern

```
"The adult contact is training themselves (alone or alongside their kid). 
Reference: {{nodes.n06_whofor_ask.result[0]}}"
```

One declarative TRUE statement. Variable reference for the data to check against. Done.

## When not to use AI

Docs line 353: *"Don't enable AI when the operator decision is purely variable-driven (e.g., distance check)  -  adds cost and volatility."*

If the decision can be made with a non-AI operator (Left Value / Right Value / Operator  -  see §6.14 for the full operator list: LessThan, GreaterThan, Contains, IsEmpty, etc.), use the non-AI path.

## Origin

Learned 2026-04-24 during v3.17 planning. Idriss pointed out that the existing Comparator AIExpressions in Vacaville were over-prompted with "Answer TRUE if / FALSE if" prose when the node's routing semantics already handle that. Doc cite: §6.10.
