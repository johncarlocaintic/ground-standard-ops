# CloseBot Skill Fix Plan — migrate build pipeline to Agent Node (2026-05-19)

## Verified facts
- Live Vacaville PROD v4.6 `bot_F0VNPTPCIW88YI3J` = **Agent Node** (23KB, 5 Method, 1 MultiObjective, 19 agent/section/tool sigs). Correct architecture, confirmed by direct export.
- `shared/sops/closebot-bot-build/vacaville-bot-template.kdl` = stale **classic** Vacaville v2.1.0 (109KB, 0 agent sigs, ~170 classic nodes). Seeded 2026-04-21 (`1f03496`), wired into skills 2026-05-10 (`9e16bce`), never refreshed.
- `/closebot-build` + `cb_vacaville_substitute.js` are built entirely around the classic token/node-web model.
- Scottsdale `bot_01MYV7I9IWMHYPCF` + Eden Prairie v1.2 = the correct Agent Node lineage, built OUTSIDE the skill.

## Root cause to eliminate
A **static, one-time, never-refreshed** template file. Any fix must make the template a *live re-export from PROD*, not a frozen snapshot, or the same drift recurs.

## Plan

### Phase 0 — Establish the live-sourced template (root-cause fix)
1. Re-export Vacaville PROD v4.6 → replace `shared/sops/closebot-bot-build/vacaville-bot-template.kdl` with the Agent Node KDL. Keep the prior classic file as `vacaville-classic-v2.1.0.LEGACY.kdl` (rollback only).
2. Promote `_export_vac_prod.mjs` to a maintained `cb_refresh_template.mjs`; the build skill MUST run it at the start of every build cycle (mandatory step, not optional) so the template can never go stale again.
3. Capture Scottsdale `bot_01MYV7I9IWMHYPCF` as a second reference (clean single-discipline Agent Node example) for the substitution design.

### Phase 1 — Rebuild the build tooling for Agent Node
Agent Node ≠ node-web. Substitution model changes from "replace tokens in 170 nodes + inject AISwitch/Booking clones" to "populate the Agent node's instructions/sections + define booking tools":
- New `cb_agentnode_build.js` (supersedes `cb_vacaville_substitute.js`): takes the Agent Node template + plan spec → writes gym facts, age→calendar routing rules, non-bookable handling into the Agent instructions/sections; maps each bookable calendar to a booking tool/Method node; sets Emma persona, scenarios, tags.
- **Deprecate (archive, do not delete):** `cb_vacaville_substitute.js`, `cb_discipline_switch_inject.js`, `cb_youth_nocal_gate_inject.js`, `strip_zindex.js` — these solve classic-node-web problems that do not exist in Agent Node (discipline routing + age gates become instruction rules, not injected nodes; zindex-dup is a classic-export artifact).
- Add a build-time **architecture assertion**: produced KDL must have >0 agent/section signatures and a low node count, else hard-fail the build. This is the guard that makes a classic regression impossible.

### Phase 2 — Rewrite the skill docs
- `closebot-build/SKILL.md`: rewrite Phases 2-3 around Agent Node (live PROD re-export → instruction/tool population → import/publish). Remove the Vacaville-classic-template substitution section. Add the mandatory template-refresh step + architecture assertion.
- `closebot-plan/SKILL.md`: spec output reshaped for Agent Node (gym facts, age→calendar rules, bookable-tool list) instead of classic flow-node flags. Intake questions largely reusable.
- `closebot-test/SKILL.md`: minimal change — orchestrator/personas/rubrics are architecture-agnostic and reuse as-is. Add one pre-test check: assert the bot under test is Agent Node (same histogram check), so a classic bot can't silently pass as "done".

### Phase 3 — Validation gate (before ANY mass rebuild)
Build ONE gym on the new skill: **Logica** (single-discipline, already classic-QA-passed → clean A/B). Run the existing test sweep. Require: Agent Node confirmed + sweep parity-or-better vs its classic version. Only then is the skill trusted.

### Phase 4 — Migration scope (separate decision, post-validation)
Per the blast-radius audit (zero prod exposure — no urgency from customer risk):
- Sugoi + Montgomery (already need v1.1 fixes) → first real rebuilds on the new Agent Node skill.
- 12 "no-verdict" classic bots → cheapest to rebuild fresh.
- 10 QA-passed classic bots → keep as launch fallback; migrate in a phase.
- Architecture inventory must be re-derived by **KDL export histogram per bot** (the spec metadata is proven unreliable — it self-stamps "classic" and missed the correct Scottsdale bot).

## Sequencing / dependencies
Phase 0 → 1 → 2 → 3 are strictly serial (each depends on the prior). Phase 4 only after Phase 3 passes. No further classic builds in the meantime (freeze gyms 8-11 + Sugoi/Montgomery v1.1 until the Agent Node skill exists, so we don't dig the hole deeper).

## Open items to confirm with operator
1. Is the Agent Node KDL structure stable enough to template-substitute, or does each gym need hand-authored instructions? (Phase 1 spike will answer — may need a small design spike before committing the builder.)
2. Migration scope (Phase 4) — full 24 vs un-launched-only vs phased.
3. Whether `closebot-plan`'s spec schema change is backward-compatible with the existing per-gym spec JSONs (they may need a migration shim or regeneration).
