# GS CloseBot — Architecture Blast-Radius Audit (2026-05-19)

**Trigger:** Operator found the GS gym bots were built on the legacy Vacaville
195-node classic node-web, not the intended Agent Node architecture. This audit
establishes scope before any remediation decision.

---

## 1. Root cause (where the gap is)

`/closebot-build` is hardwired to the **Vacaville classic template**:
- SKILL.md line 10: "generate a complete KDL file from the Vacaville template"
- line 44: reads `shared/sops/closebot-bot-build/vacaville-bot-template.kdl` as the flow shape
- line 71: uses `cb_vacaville_substitute.js`
- line 68 explicitly acknowledges the spec's conversationReason is "authored for the lean **Agent-Node** bot" and instructs working *around* it to fit the classic flow.

The skill never adopted the April-2026 Agent Node architecture
(`references/closebot_agent_node.md`, "replaces all legacy conversational
nodes"). `/closebot-plan` does not mention Agent Node at all. So every bot the
skill has ever produced is classic by construction. Operator intent (Agent
Node) and the skill (classic) were in conflict before this session; this
session propagated it 11× more without flagging the contradiction that was
visible in the skill text + memory.

## 2. What is classic (architecture inventory)

**24 / 24 GS gym spec-built bots are classic node-web. 0 are Agent Node.**

Plus **Vacaville PROD v4.6** (`bot_F0VNPTPCIW88YI3J`) — also classic (original
hand-built lineage, separate from the skill batch).

## 3. Production exposure — THE critical blast-radius fact

**ZERO of the 24 skill-built classic bots are on a real production source.**
Ground truth (memory `project-gs-only-vacaville-on-prod`, verified 2026-05-19
via `gs_bot_source_audit.js`):
- The ONLY bot on a real prod source is **Vacaville PROD v4.6** on `src_GDKORXSW4Q8RQUQ8` (separate lineage, P0-blocked on CloseBot support, out of scope here).
- All 24 skill bots: detached, or parked on GS Ads sandbox `src_4R4DUIQTMMX2NFPU` one-at-a-time for eval, or on DEMO sources that carry **no real lead traffic**.
- masondixon is NOT soft-launched, NOT attached to any source.

**=> The wrong architecture has intercepted ZERO real customers. No live
blast radius. This is a pre-launch correctness issue, not a production
incident.** Re-verify with `gs_bot_source_audit.js` before trusting (state can change).

## 4. QA status of the 24 classic bots

| State | Count | Gyms |
|---|---|---|
| QA-PASSED, parked sandbox | 10 | All In, Bodega, Gracie Farmington, Hammer, Inverted Gear, Logica, OM BJJ, Paragon, Ray Longo, Universal MMA |
| QA-NOT-PASSED (real defects, this session) | 2 | Sugoi (16-17 youth gate), Montgomery (adult minor-gate) |
| Built, no QA verdict recorded (older / not summarised) | 12 | 10th Planet, Academy Scottsdale, Academy Eden Prairie, Artistry, Ballantyne, Breathe, Centerline, Champion, Gracie SJ, Grit, Hamptons S, Mason Dixon |

## 5. Is classic functionally acceptable as-is?

**Yes, with caveats.** Classic node-web works — Vacaville runs live on it.
The 10 QA-PASSED classic bots genuinely pass (cross-examined vs GHL ground
truth, not transcript-only). They are not broken; they are the old
architecture.

Classic-vs-Agent-Node downsides observed this batch:
- Brittle gates: the 2 real defects (Sugoi/Montgomery) are classic-flow gate-wiring failures Agent Node instructions would not have the same way.
- Node sprawl: 5-way discipline switch injects 32 Booking clones; zindex fragility; orphan-handle risk on path trimming.
- The documented conversationReason-classic conflict (skill line 68) + the recurring mnd_05 false-closure FP family are classic-flow artifacts.
- Agent Node is CloseBot's current recommended/maintained architecture; classic is legacy.

## 6. Agent Node rebuild cost estimate

**One-time (skill R&D):** rework `/closebot-build` (+ likely `/closebot-plan`)
to emit Agent Node config per `references/closebot_agent_node.md` + the Bryce
walkthrough. Design + validate on 1 gym end-to-end. Estimate: ~1-2 focused
days. This is the gating cost — nothing else can proceed correctly until it exists.

**Per-gym (after skill exists):**
- Reusable as-is (architecture-independent): KB, verification doc, spec inputs, personas, rubrics, the eval orchestrator/sweep/preflight harness.
- Rebuild: regenerate Agent Node config from spec → import/publish → re-sweep (~50 min test, same as now) → cross-exam → summary. Net ~1-1.5 hr/gym, *less* classic-debugging overhead (no node-web/zindex/gate-injection).
- 24 gyms => ~3-5 working days of build+test after the skill is ready, parallelizable across sessions.

**Total honest estimate:** ~1 week to migrate the full set to Agent Node,
front-loaded by the skill rework. No customer impact during migration (nothing
is live).

## 7. Decision inputs (for operator)

- No production exposure => no urgency from a customer-risk standpoint; urgency is only "don't launch classic if Agent Node is required."
- 10 classic bots are genuinely QA-passed and *functional* — if classic is acceptable for launch, they could go live and migrate later.
- If Agent Node is a hard requirement: the skill MUST be reworked first (1 gym validated) before any further building or rebuilding; do not hand-build Agent Node ad hoc.
- 12 "no verdict" classic bots are the cheapest to abandon-and-rebuild (less sunk QA).
- Sugoi/Montgomery need fixes anyway — natural first Agent Node rebuild candidates if migrating.

## 8. Recommendation (not a decision — operator's call)

Rework `/closebot-build` to Agent Node, validate on ONE gym (suggest Logica —
simplest single-discipline, already QA-passed classic for A/B comparison),
confirm the Agent Node bot passes the same sweep, THEN decide rebuild scope
(all 24 vs. only un-launched vs. phased). Do not build or rebuild anything
else classic in the meantime. Treat the 10 QA-passed classic bots as a
fallback that can launch if Agent Node migration slips and Bobby needs gyms live.
