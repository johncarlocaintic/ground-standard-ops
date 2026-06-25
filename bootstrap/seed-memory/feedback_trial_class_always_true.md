---
name: feedback_trial_class_always_true
description: Trial class is always included in every GS bot flow — never gate it on KB language
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 54fc8f28-85d0-4eac-8882-534fa74428d0
---

HARD RULE: Trial class booking is always part of the flow for every GS gym bot, regardless of whether the KB explicitly uses the word "trial" or describes a trial process.

**Why:** Every GS gym offers a free trial class as the standard entry point. The KB may not always describe it explicitly but the offer is universally true.

**How to apply:** Never flag missing trial language in the KB as a blocker or open dependency. Build the trial booking path into every bot. The KB supports the bot — it doesn't gate the flow.
