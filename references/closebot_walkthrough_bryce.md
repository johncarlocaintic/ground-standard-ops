# CloseBot Full Platform Walkthrough — Bryce DeCora

**Source:** YouTube walkthrough by Bryce DeCora (CloseBot founder)
**Captured:** 2026-04-28
**Format:** Transcript + annotated example (Qualify agent node screenshot)
**Purpose:** Vendor-canon reference for how Bryce himself describes the CloseBot product end-to-end. Use alongside `closebot_docs_reference.md` (vendor docs synthesis) and `closebot_agent_node.md` (deep agent-node ref).

---

## 1. Live Example — Real Estate Qualifying Bot

Bryce demos a CloseBot agent built to qualify real estate leads and book appointments. Two-node flow:

1. **Qualify** (agent node) — runs the qualification conversation.
2. **Qualified Agent** (agent node) — fires once lead is qualified; has the booking tool and different instructions.

Behaviors observed in the demo:
- Checks distance between locations
- Pulls property details
- Reads calendar availability
- Updates contact fields
- Does multiple tool calls in a single response turn

Once Qualify decides the lead is qualified, the conversation hands off to the Qualified Agent node, which books the appointment.

### Annotated Qualify node (from screenshot)

The Qualify node has a single Section called **General Qualification**. The instructions are written as plain English with inline tool/contact/exit chips:

> Start by getting their name. If they want to know when you're available for a meeting, you can get availability if they ask with `Tool.Check Appointment Availability` always on the "Consultation" calendar.
>
> If we have their `Contact.Full Address` use `Tool.Get Property Details` to find out the est. value. Let them know the approximate value. If we don't have their `Contact.Full Address`, get it and update (UNRESOLVED is not a field value). After you get that from them, lead straight into trying to nail down their availability.
>
> Getting availability right now is fine, but don't yet commit to booking an appointment yet. Gather their `Contact.Email` and `Contact.Last Name` before we commit to booking a time with them with `Tool.Update Contact`, keeping in mind they will likely be more open to sharing email if you first discuss real availability.
>
> If this seems like spam, exit with `Exit.Spam`
>
> If we 1. agree on a time 2. get their address 3. get their email exit right away with `Exit.Qualified`

**Settings on this node:** Tools (0 explicitly attached at the node — pulling from globals/inline refs), Exits (2: Spam + Qualified). Character usage: 996 / 1000.

**Pattern takeaways:**
- Instructions are conversational ("lead straight into", "don't yet commit") not procedural step lists.
- Tool/contact references are inline chips, not separate fields.
- Exits are named for outcomes (`Spam`, `Qualified`) — the node decides which fires.
- Character limit (1000 base plan) is real; this example is at 99.6% capacity.

---

## 2. Node Palette

You drag node types onto the canvas. Bryce calls out:
- **Agent Node** — "the most popular." Default for new bots.
- Other node types still exist for rigid flows.

Within an Agent node, you attach **Tools**. Bryce highlights:
- Booking appointments
- Getting property details
- Sending images of properties
- **Custom Tool** — tie into any third-party platform

---

## 3. Job Flow Settings

Settings on a job flow include:
- **Follow-up customization** — Bryce stresses follow-up is "extremely important."
- **Job information** — connect to GHL sub-accounts, HubSpot, etc.
- **Sources** — a single job flow can be connected to **unlimited sources**. Build the flow once, run across many accounts.

---

## 4. Personas

> Think of a persona as the person doing the job.

- Persona has identity, personality, traits.
- Different personas have different traits.
- Example given: "Sam."
- Personas live on the Agents page alongside job flows.
- (Confirms our existing rule: personas are global/shared, not client-specific. See `feedback_persona_is_global.md`.)

---

## 5. Home Dashboard

Cross-account view:
- Full lead conversion funnel
- Revenue over time (if rebilling is set up)
- Charts: responses sent, contacts engaged, booked meetings

---

## 6. Sources

A **source** = a connected GHL sub-account, HubSpot account, etc.

Per-source settings called out:
- **Sales Pixel** — tracks user activity, site visits. The bot can pull this into its knowledge ("which websites these leads have engaged with").
- **Auto shut off on manual reply**
- **Leave conversations marked as unread**
- **User access** — give different team members access to different sources
- **Rebilling source variables**
- **Reply restrictions** — e.g. bot only replies overnight, human takes day shift
- **Follow-up restrictions** — e.g. only during business hours

---

## 7. Uploads (Knowledge Training)

Where you train the bot.
- Normal uploads — attach to sources.
- **Smart FAQ** — used when bot doesn't know an answer.
  - Triggers a notification in the top right.
  - Once you fill in the answer, bot reaches back out to that contact with the answer.
  - Bot remembers the answer for future conversations.
- Agency clients can be invited in to upload their own info.

---

## 8. Chats

- Pre-built quick views per source + custom views.
- Live updating list.
- Per-conversation: see which **tools** the bot has used.
- If Sales Pixel is installed, see which sites the lead visited.

---

## 9. Account / Agency Settings

- Invite team members and clients
- Agency settings: favicon, custom domain, white labeling, rebilling
- Security: GDPR, SOC 2 compliance, HIPAA
- Subscription, wallets, notifications
- API keys

---

## 10. Resources

- Internal community
- Feature requests
- API docs
- Help docs
- 24/7 live customer success team

---

## How to Use This Reference

- When discussing CloseBot architecture or scoping a new bot, this file shows **how Bryce frames the product** — what he calls primary, what he calls peripheral.
- The Qualify node example is a clean, real, vendor-blessed pattern for a 2-node agent-driven funnel. Use as a template shape (not literal copy) when designing qualifier → booker flows.
- For deeper agent-node mechanics: `closebot_agent_node.md`.
- For full vendor docs synthesis: `closebot_docs_reference.md`.
- For our own architectural opinions: `closebot_architecture.md`.
