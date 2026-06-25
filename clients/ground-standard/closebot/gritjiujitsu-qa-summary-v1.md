# QA Summary — Grit Jiu-Jitsu & Muay Thai

**Bot (final):** Grit Jiu-Jitsu - Launch v1.2 [teen 14-17 routing] (2026-05-15)
**Bot ID:** `bot_7H147LLL7WMR506K`
**Run date:** 2026-05-15
**Sandbox source:** `src_4R4DUIQTMMX2NFPU` (GS Ads)
**Sandbox calendars:** clean slate created at start of run (4 calendars matching prod spec exactly)

## ITERATION HISTORY

| Version | Bot ID | Change | Status |
|---|---|---|---|
| v1.0 | `bot_0DBO3CUFM0I8HXYI` | Initial build | Retired — bug found |
| v1.1 | `bot_YE304TLZ351NWW1H` | Non-bookable program handling (Intro node Push Toward Booking section) | Retired — bug found |
| v1.2 | `bot_7H147LLL7WMR506K` | Teen 14-17 routing: BJJ + 14-17 → Adult Fundamentals BJJ; MT + 14-17 → Adult Muay Thai | **CURRENT** |

**v1.1 bug found:** `nonbookable_program` persona surfaced silent routing failure — bot was redirecting Women's JitZ requesters into Adult BJJ without explaining it's a different class. Fixed by adding explicit non-bookable acknowledgment + redirect block in Intro node.

**v1.2 bug found:** `nonbookable_teens` persona — parent requested Teens JitZ (ages 13-15, non-bookable) for a 14yo son. Bot correctly redirected to free trial, asked discipline, collected info — then routed the 14yo to Kids 4-13 BJJ calendar. Age 14-17 had no explicit path in the YOUTH routing block. Fixed by adding: BJJ + age 14-17 → Adult Fundamentals BJJ; Muay Thai + age 14-17 → Adult Muay Thai.

---

## PERSONA RESULTS (v1.2 final — all tested on bot_7H147LLL7WMR506K)

```
PERSONA                 VERDICT             BLOCKERS  GHL OUTCOME
─────────────────────────────────────────────────────────────────
adult_only              PASS (verified)     0         booked → Adult Fundamentals BJJ
adult_muaythai          PASS (verified)     0         booked → Adult Muay Thai
kid_only                PASS (verified)     0         booked → Kids 4-13 BJJ
kid_muaythai            PASS (verified)     0         booked → Kids 5-13 Muay Thai
adult_and_kid           PASS (verified)     0         2 appts → Kids 4-13 BJJ + Adult BJJ
age4_muaythai           PASS (verified)     0         redirected to Kids BJJ for 4yo (correct)
pricing_deflect         PASS*               0*        booked → Adult Fundamentals BJJ
nonbookable_program     PASS*               0*        Women's JitZ acknowledged, redirected to trial
minor_self_booking      PASS (verified)     0         no appt (correct — minor handed off)
hostile_aggression      PASS                0         no appt, no contact (bot stopped at turn 1)
nonbookable_advanced    PASS (verified)     0         Adult JitZ Intermediate acknowledged, redirected to trial → Adult Fundamentals BJJ
nonbookable_teens       PASS (v1.2)         0         Teens JitZ acknowledged → 14yo redirected to Adult Fundamentals BJJ (v1.1 = FAIL, bug fixed in v1.2)
nonbookable_session     PASS (verified)     0         Saturday Open Mat acknowledged, redirected to trial → Adult Fundamentals BJJ
```

\* `pricing_deflect` and `nonbookable_program` were initially flagged FAIL by the QA Agent but both are confirmed **false positives** after cross-checking GHL ground truth + transcripts:

- **pricing_deflect:** md_04 (adult BJJ routing) flagged FAIL — but the GHL booking landed on `gBWEHYrNDWKiHuzhtT4L` which IS the Adult Fundamentals BJJ calendar. The bot correctly deflected pricing twice (T8, T9) before booking the trial on T10. Routing was correct.
- **nonbookable_program:** mnd_02 (hallucinated programs) flagged FAIL on "The Wednesday women's class is awesome." — but Women's JitZ IS a real program in the Grit KB. The bot acknowledged the class and redirected the lead to the trial flow, which booked to Adult Fundamentals BJJ correctly. No hallucination.

---

## REPEAT RUN — adult_only ×3 (non-determinism check)

```
Run 1 (141211):  PASS — Kennedy Garza  → Adult Fundamentals BJJ  (gBWEHYrNDWKiHuzhtT4L)
Run 2 (142226):  PASS — Wesley Webb    → Adult Fundamentals BJJ  (gBWEHYrNDWKiHuzhtT4L)
Run 3 (142228):  PASS — (third tester) → Adult Fundamentals BJJ  (gBWEHYrNDWKiHuzhtT4L)
```

3/3 — zero non-determinism failures, consistent calendar routing.

---

## GRIT-SPECIFIC CHECKPOINTS (md_02 through md_08)

- **md_02 — Discipline switch (BJJ or Muay Thai?):** PASS on every persona that hit a booking path. Bot consistently asks which discipline before routing.
- **md_04 — Adult BJJ routing:** PASS. Confirmed via 4 separate adult_only/pricing_deflect/adult_and_kid/nonbookable_program runs.
- **md_05 — Adult Muay Thai routing:** PASS. adult_muaythai → `gxW4I0eVVGyDmdYJsqPO` (Adult Muay Thai sandbox calendar).
- **md_06 — Kids 4-13 BJJ routing:** PASS. kid_only + adult_and_kid + age4_muaythai (redirect) all went to `EcG9OZRBRVWllQHAPcJf`.
- **md_07 — Kids 5-13 Muay Thai routing:** PASS. kid_muaythai → `mEKW8Kg4hw77RHOdNHBZ`.
- **md_08 — Age 4 + Muay Thai handled correctly:** PASS. Bot redirected the 4-year-old to Kids BJJ (which goes from age 4) instead of booking into Kids 5-13 Muay Thai. Booking landed on `EcG9OZRBRVWllQHAPcJf` (Kids BJJ).

---

## KNOWN PLATFORM BUGS

- `contact.phone` — blank in GHL across all runs (CloseBot platform bug, reported 2026-05-07, not Grit-specific)

---

## JUDGE AGENT NOISE

The Judge Agent v2 raised verdict=fail/severity=critical on the adult_only Run 1 with summary "Bot confirmed booking for a date that does not match the GHL appointment." Cross-checking: bot said "Tuesday May 19th at 5:30 PM" and GHL has `2026-05-19 17:30:00` (Tue May 19, 5:30 PM). Dates ARE consistent. The judge's own `bot_claims[0].consistent` field is `true` and `production_safety.safe_for_real_customers: true`. The verdict/summary contradicted the underlying evidence — false alarm.

---

## CLEANUP

- 11 test contacts deleted from GHL sandbox (all `donotuse.com` emails)
- Test appointments auto-deleted with their contacts
- Bot still attached to sandbox source — to be detached before prod soft-launch attach

---

## VERDICT: READY TO ATTACH (v1.2)

All production-readiness criteria met:

- 13 personas completed without SESSION_FAIL/SSE_FAIL/CRASH
- 0 real blocker checkpoint failures (2 reported fails are QA agent false positives, confirmed via GHL + transcript cross-check)
- All booking personas have GHL appointments confirmed on the correct sandbox calendars (which mirror prod 1:1)
- Non-determinism: 3/3 PASS
- Grit-specific dual-discipline flow validated (discipline switch + 4 distinct calendar routing paths all working)
- Non-bookable program handling validated across 3 specific personas (Women's JitZ, Adult JitZ Intermediate, Teens JitZ, Open Mat)
- Teen 14-17 routing confirmed fixed in v1.2 (re-tested on `nonbookable_teens` persona)

**Status:** Flagged for soft-launch with Bobby (2026-05-15). Pending: detach bot from sandbox source, attach to prod source `src_6MS3RHIRTR8OEKMO` with testing-only tag filter, hand off to Bobby/Kurt for spot-check on 2-3 real contacts.
