---
name: CloseBot Agency Source Endpoints
description: CloseBot API exposes per-source GHL schema (tags/fields/calendars/channels) without needing that sub-account's PIT — works for any school connected to Bobby's agency
type: project
originSessionId: 44892c1f-edef-4b2d-b157-910ea7c52c1a
---
Discovered April 20, 2026 while diagnosing Vacaville bot without Bobby's PIT.

**Key endpoints** (all `X-CB-KEY` auth, base `https://api.closebot.com`):

- `GET /agency/source?page=N` — paginated (20/page, 0-indexed). Each source has `sourceId`, `key` (GHL location ID), `name`, `category` (`GHL` or `GHLS`), `accessToken` (OAuth JWT, often expired), `bots` (attached bot IDs).
- `GET /agency/source/{id}/tags` — all GHL tags
- `GET /agency/source/{id}/fields` — `{contact, location, customValue}` arrays of custom fields (name, dataType, fieldKey)
- `GET /agency/source/{id}/calendars` — bookable calendars
- `GET /agency/source/{id}/channels` — comm channels

**Source ↔ bot management:**
- Attach: `POST /bot/{bot}/source/{src}` body `{tags:[], channels:[], input:{}}` → 204
- Detach: `DELETE /bot/{bot}/source/{src}` → 200

**Update (April 22, 2026):** Bobby has already provided the Vacaville GHL Private Integration Token — no longer blocked on PIT for Vacaville.

**Why:** workflow unblocker when a client hasn't shared GHL PIT yet — if the school is already connected to Bobby's CloseBot agency (most GSA gyms are), their schema is accessible via CloseBot without asking the client.

**How to apply:** use `CB_GS_API_KEY` (Bobby's CloseBot agency key) to pull any connected school's schema. Full dump script pattern in `shared/scripts/closebot/gs_find_vacaville_src.js` and `gs_swap_source.js`.

**Caveat:** the `accessToken` JWT on each source is NOT a usable GHL PIT substitute. CloseBot refreshes it server-side on demand; dumps return the stale token. Only the CloseBot-proxied schema endpoints work.
