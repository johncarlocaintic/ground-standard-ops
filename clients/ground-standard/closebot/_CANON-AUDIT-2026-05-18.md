# Canon Pipeline Audit — GS CloseBot builds (2026-05-18)

Audited: 6 bots I built this run (Eden Prairie v1.2, Academy JJ Scottsdale v1.0,
Bodega v1.0, Breathe v1.1, Centerline v1.0, All In v1.0) against the canon
skills `/closebot-plan`, `/closebot-build`, `/closebot-test` SKILL.md.

## HEADLINE FINDING — KDL architecture diverges from canon /closebot-build

Canon `/closebot-build` Phase 2 mandates adapting
`shared/sops/closebot-bot-build/vacaville-bot-template.kdl` (195 nodes;
`Booking`/`AISwitch`/`Comparator`/`MultiObjective`/`Conversation`).

My 6 bots are ~21-node **Agent-Node** architecture (`Method`/`Statement`/`End`,
zero Booking/AISwitch/Comparator). I did not start from the Vacaville template;
the lineage is 10P-Miami-twin → Eden v1.0 → ... → All In.

Evidence — prior-fleet split (repo clean KDLs):
- Classic/Vacaville-derived: Mason Dixon 203, Hamptons 209, Gracie SJ 165 nodes
- Lean Agent-Node (~21): 10P Miami, Champion, Grit, Artistry, Ballantyne
- My 6: all ~21-node Agent-Node — consistent with the 5 most-recent shipped,
  QA-passed prior gyms (incl. 10P Miami, which I twinned from).

Assessment: not a regression to something worse — it matches the post-April-2026
Agent-Node fleet standard prior sessions already moved to. BUT it is a real
divergence from the canon skill TEXT, which is stale (predates the Agent Node
migration noted in CLAUDE.md / reference_closebot_agent_node). **Decision needed
(user/JC/Bobby): is the Agent-Node architecture the new canon (update the skill),
or is the Vacaville 195-node template still canon-of-record (my 6 + the 5 prior
lean bots are all off-canon)?** I cannot resolve this alone.

## Per-skill audit

### /closebot-plan
- Invoked as the skill for Eden Prairie + Academy JJ Scottsdale only.
- Bodega / Breathe / Centerline / All In: spec written directly, skill NOT
  invoked — no interactive intake, no canon "markdown spec" doc (Phase 3
  Output 1). JSON spec schema matched canon.
- Severity: MEDIUM (process deviation; output schema OK; intake judgement
  substituted by the standing GS universal rules + args).

### /closebot-build
- Skill NOT invoked for any gym; mechanics run manually.
- Phase 2 (Vacaville template): NOT followed — see headline. HIGH.
- Phase 3 (__zIndex strip): followed (canon's exact script). OK.
- Phase 4 (naming convention): followed. OK.
- Phase 5 (import+publish): followed (cb_import_publish.js ≡ canon
  cb_import_bot.js). OK.
- Phase 6 (archive [LEGACY] prior): followed. OK.
- Phase 7 (ATTACH TO PRODUCTION SOURCE): **intentionally NOT done** — all 6
  parked on sandbox, detached. This is a deliberate, safer divergence aligned
  with the standing "no prod attach without Bobby" gate and the prior fleet
  (also parked). GOOD deviation, but it IS contrary to the skill text — flag so
  it is a conscious policy, not an accident.
- Phase 8 (deployHistory in spec): only Eden has an entry; Scottsdale, Bodega,
  Breathe, Centerline, All In specs have `deployHistory: []`. Real canon gap.
  LOW (easy backfill — bot IDs are in todo.md + QA summaries).
- prohibitedWords: empty in my KDLs — **consistent with canon**: the Vacaville
  template itself ships `prohibitedWords` empty. Not a gap. (Supersedes the
  earlier "what's missing" item — moot.)

### /closebot-test
- Skill NOT invoked; ran `orchestrator.js` via custom per-gym sweep scripts.
- Phase 2 rubric (universal mnd_01/02/05/06/08 + md_01/02/05 + gym-specific):
  followed. OK.
- Phase 3 personas (min 8): exceeded (11-15 per gym). OK.
- Phase 4 orchestrator sequential per persona: followed. OK.
- Phase 5 non-determinism adult ×3: done, but via sweep loop not
  `repeat_persona.js`. Functionally equivalent. LOW.
- Phase 6/7 verdict criteria (all pass, 0 blockers, GHL-verified bookings,
  judge production_safe, 3/3 non-det): followed, incl. cross-examining QA
  false-negatives. OK.
- Phase 8 cleanup: followed (cleanup_gs_ads_test_data.js). OK.

## Net

| Area | Canon-compliant? | Severity |
|---|---|---|
| KDL = Vacaville template | NO — Agent-Node lineage instead | HIGH (needs canon decision) |
| Skills invoked (plan/build/test) | Mostly NO — manual process | MEDIUM |
| Prod attach skipped | Intentional safe deviation | GOOD (flag as policy) |
| deployHistory written | 1/6 | LOW (backfill) |
| __zIndex / naming / import / archive | YES | OK |
| Test rubric / personas / verdict / cleanup | YES (manual but equivalent) | OK |
| prohibitedWords empty | YES (matches template) | OK |

The bots themselves are QA-passed and match the recent fleet. The exposure is
process/canon-of-record, not bot quality. Two concrete fixes I can do now:
backfill `deployHistory` in the 5 specs; and (if Agent-Node is confirmed canon)
propose updating closebot-build SKILL.md Phase 2 to the Agent-Node reference.
The architecture-of-record question needs the user.
