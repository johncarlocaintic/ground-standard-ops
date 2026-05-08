---
name: CloseBot Skill System
description: On hold. Vacaville v2 is the reference build — once it passes end-to-end it becomes the universal template for all GSA gym clients, then skills get packaged from it.
type: project
originSessionId: 396aeb9e-0407-4000-a594-ee2ea4f8d569
---
**Status (2026-04-21):** On hold pending Vacaville v2 end-to-end success.

**Strategy shift:** Skills are NOT being built up front anymore. Vacaville v2 (`bot_MHAFTF25QVPIQLUI`) is being treated as the reference build. Once it passes full end-to-end testing, it becomes the **universal template** for every other gym in Bobby's portfolio. Only after that succeeds will `/closebot-plan`, `/closebot-build`, `/closebot-test` be packaged as skills — using Vacaville as the proven kernel.

**Why:** JC wants a proven success case to reference before generalizing. Building skills from an unproven pattern risks encoding the wrong structure across all GSA gyms.

**How to apply:** Do not build any of the 3 CloseBot skills until JC confirms Vacaville v2 has passed end-to-end. JC is testing in a parallel session — wait for his signal before touching anything CloseBot-skill related.

**Working kernels already exist (for when skills get built):**
- `/closebot-test` → `shared/scripts/closebot/run_multi_persona_test.js`
- `/closebot-build` → `shared/scripts/closebot/gs_import_vacaville_v2.js`
- `/closebot-plan` → still needs workflow engineering research doc

**Key files:**
- `references/stack_api_reference.md` — API reference
- `tasks/closebot_skill_design.md` — skill architecture decisions
- `clients/ground-standard/closebot/phase1_discovery.md` — Phase 1 API test results
