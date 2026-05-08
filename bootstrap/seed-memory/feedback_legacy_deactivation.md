---
name: Legacy Workflow Archival Convention
description: Deactivate + archive legacy bots/workflows to a "Deactivated" folder instead of deleting — preserves audit trail
type: feedback
originSessionId: 44892c1f-edef-4b2d-b157-910ea7c52c1a
---
When a bot, workflow, or automation is superseded by a new version, don't delete the old one. Instead: deactivate it (so it can't fire) AND move it to a dedicated "Deactivated" / "Legacy" folder or group. Applies across CloseBot, GHL workflows, n8n flows, Retell agents, and any similar tool that supports deactivation + folder grouping. Delete only when the user explicitly confirms it's safe to remove.

**Why:** Legacy versions hold diagnostic value (what-was-tried, what-worked, what-regressed). JC prefers auditability over a clean UI. Bobby's CloseBot had years of test workflows JC didn't want deleted. Rule established 2026-04-22.

**How to apply:**
- When promoting a new version: find the old one, deactivate via API (or UI if no API), move into a "Deactivated" group/folder
- On CloseBot: bot has `enabled` or similar status field — flip to false; also reassign to a legacy group if the platform supports groups
- On GHL: workflows have an active/inactive toggle — flip off; use Workflow Folders to group
- On n8n: deactivate workflow + tag "legacy" or move to a Legacy project
- Don't delete any legacy artifact until the user explicitly says so
- When cleaning up, name the deactivated/archive folder something obvious ("Deactivated", "Legacy", "Archive") — not obscure codenames
