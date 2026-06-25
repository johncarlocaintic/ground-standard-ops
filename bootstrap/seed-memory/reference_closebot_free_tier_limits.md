---
name: reference-closebot-free-tier-limits
description: "CloseBot Free plan = 100 messages/month then $0.08/msg overage (no hard stop); 1 bot, 1MB KB"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

CloseBot Free plan limits, verified 2026-05-18 from https://closebot.com/plans/:

- **100 messages per month**, resets monthly (not lifetime).
- Beyond 100: **$0.08 per message**. It does NOT hard-stop — it keeps replying and bills overage. The risk on a public demo is silent overage charges, not the bot dying mid-conversation.
- 1 free agent/bot, 1MB knowledge base, unlimited connected accounts, office-hours support, conversational CRM field updates.
- Paid tiers: Business $64/mo ($53 annual), Agency $397/mo ($331 annual), Enterprise custom.

Applies to Idriss's own Driz.AI demo bot (`CB_DRIZ_API_KEY`, bot_BNSNTAWK4N99D3LI on free tier). A full receptionist-demo run is ~10-15 bot messages, so ~6-8 free runs per month before overage. The portfolio form gate (name+email before chat) exists partly to protect this cap. See [[project-portfolio-site]] and [[project-driz-ai-brand]].
