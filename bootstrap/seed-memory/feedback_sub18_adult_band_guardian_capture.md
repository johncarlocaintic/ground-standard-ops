---
name: feedback-sub18-adult-band-guardian-capture
description: "GS gym whose adult calendar serves under-18 (e.g. 13+) — book the 13-17 band via youth path with guardian capture, NOT no-cal gate or strict block"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

When a GS gym's "Adult" trial calendar serves an age band below 18 (e.g. Universal MMA's Adult Martial Arts = ages 13+), the 13-17 sub-band is **booked into the adult calendar via the YOUTH path** (which always captures parent/guardian contact + tags `minor - needs guardian`). It is NOT treated as a youth-no-cal gate and NOT strict-blocked to team-follow-up.

**Why:** the gym explicitly serves 13-17 in that class, so refusing to book turns away leads the gym wants. The GS universal minor-gate concern (no unsupervised self-booking minor) is still honored because the youth path captures a guardian, and the adult-path DOB<18 Comparator still gates a 13-17 who tries to *self*-book with no guardian present (correct — that one goes to team follow-up).

**How to apply:** in the spec, add the sub-18 adult band to `flow.ageRouting` and the youth-path kids-age routing as a band that targets the adult calendar name (e.g. `13-17 -> Adult Martial Arts`). `youthNoCalGate: false`. Standard minor gate stays on. No canon-template modification needed — it is just another youth-path AISwitch age band whose target is the adult calendar. Decision set by Idriss 2026-05-19 (Universal MMA, gym 6/11). Becomes the rule for any future sub-18-adult-band gym. Related: [[feedback-gs-minor-gate-universal]], [[feedback-closebot-youth-nocal-gate]].
