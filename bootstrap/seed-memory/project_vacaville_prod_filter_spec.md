---
name: project-vacaville-prod-filter-spec
description: Vacaville prod source filter canonical spec + restore script; found empty 2026-05-19 and restored
metadata: 
  node_type: memory
  type: project
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

Vacaville prod source filter (`bot_F0VNPTPCIW88YI3J` / `src_GDKORXSW4Q8RQUQ8`).

On 2026-05-19 the prod source filter was found **completely empty** (no required tag, no excludes, channels = [Vacaville Chat Widget, Live_Chat]) i.e. the bot was wide open to every contact. Restored to the canonical v4.6 spec:

- **REQUIRED (approveDeny:true):** `concierge`
- **EXCLUDED (approveDeny:false):** `booked, member, alumni, spam, staff, service, showed, alert, aggressive`
- **channels:** `WhatsApp, GMB, Live_Chat, SMS, FB, IG` (exclude `Email`, `Custom`, and the dedicated `Vacaville Chat Widget` channel)
- `ai off` is NOT in this source (creation historically failed); include it only if/when it exists.

Canonical tag set source of truth: `shared/scripts/closebot/gs_deploy_vacaville_v4_6_prod_launch.js` (`PROD_TAGS`). Polarity: `approveDeny:true`=required, `false`=excluded (proven across all launch scripts).

Write shape (proven): `POST /bot/{id}/source/{srcId}` body `{tags, channels, personaNameOverride, enabled}`. Restore/repair script: `shared/scripts/closebot/gs_vacaville_restore_filter.js` (captures pre-state to `shared/logs/vacaville_filter_PRESTATE_revert.json`, writes, read-back verifies). Audit-all script: `shared/scripts/closebot/gs_prod_filter_audit.js`.

Update 2026-05-19: the 25 old `(DEMO)` bots that were on real gym GHL sub-accounts have all been DETACHED (detach only, bots not deleted) via `shared/scripts/closebot/gs_detach_demo_bots.js` (revert map: `shared/logs/detach_demo_bots_REVERT.json`). Account real-source state is now: Vacaville prod = Vacaville PROD v4.6 only; GS Ads sandbox = eval bots; every other real gym source = zero bots. No accidental/stray bots. See [[project-vacaville-pricing-not-the-bot]], [[project-gs-only-vacaville-on-prod]], [[feedback-parrot-before-execute]].
