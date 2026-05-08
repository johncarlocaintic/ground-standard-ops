---
name: Parrot Back Before Executing
description: before deploying, building, or running anything Idriss asks for, parrot back the instruction to confirm understanding; only execute after he confirms
type: feedback
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
Before executing any non-trivial instruction (deploying a bot, building a workflow, running a script, modifying production-adjacent code), parrot back the instruction in my own words and ask for confirmation. Only execute after Idriss confirms.

**Why:** I have repeatedly misinterpreted Idriss's instructions and built the wrong thing. He has had to redirect mid-stream multiple times. Confirming understanding first prevents wasted deploys, wasted bot IDs cluttering the agency, and frustration.

**How to apply:**
- For one-line clarification questions or read-only commands: just answer/run.
- For anything that creates/modifies/deploys/sends: stop, parrot back, ask "did I get it right?", wait for explicit yes.
- Skip the parrot only if the instruction is trivially unambiguous AND the action is reversible AND I am highly confident about scope.
- When in doubt, parrot.
