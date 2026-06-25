---
name: gs-bot-builds Vercel project source
description: gs-bot-builds.vercel.app is git-linked to a separate GitHub repo — NOT the playbook-viz folder in this repo
type: reference
originSessionId: 54fc8f28-85d0-4eac-8882-534fa74428d0
---
gs-bot-builds.vercel.app is deployed from GitHub repo `idrizz28/gs-bot-builds` (default branch `master`). Vercel auto-deploys on push to master (~40s, confirmed live 2026-05-20).

Local clone: `d:\CLAUDE\gs-bot-builds` (D drive — the old `C:\Users\Admin\AppData\Local\Temp\gs-bot-builds\` clone got wiped; Temp is not durable, re-clone to D).

To deploy: edit there, `git commit`, `git push` — Vercel auto-deploys.

`shared/sops/closebot-bot-build/playbook-viz/index.html` in the main Work repo is a local working copy only. Never deploy from there.

Site contents (as of 2026-05-20):
- `/` — 17-gym build playbook + localStorage progress dashboard.
- `/widgets/` — per-gym CloseBot chat-widget test directory (master page → per-gym `gym.html?slug=X`). Config in `widgets/widgets.json`: 17 gyms, each with an `embed` string. Empty embed = LOCKED; paste a gym's CloseBot embed snippet into its `embed` field + push = that gym goes LIVE, no code change. See [[reference_closebot_widget_ui_only]] for how widgets are created.

`vercel.json` has a catch-all SPA rewrite to `/index.html`; it is filesystem-first so real static files (e.g. everything under `/widgets/`) are served directly and the rewrite never shadows them. Verified in production 2026-05-20.
