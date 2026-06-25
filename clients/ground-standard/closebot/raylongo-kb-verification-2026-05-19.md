# Ray Longo's MMA — KB Verification (2026-05-19)

**Source:** legacy KB v1.2.2 `file_JUEAJO965GXKZO0C` (already pricing-redirected). Reference: `_raylongo-legacy-kb-REFERENCE.txt`.
**Verified vs:** live site longosmma.com (WebFetch 2026-05-19) + live GHL location `MPmczU9WX0pOwJwZGEff` (source `src_XM58ZT2N3E8A1UDT`).

## Confirmed
- Business name, address (1 Commercial Ave, Garden City NY 11530), phone (516) 900-9042, email lawmmastaff@gmail.com, website — site + KB match exactly.
- Programs: Adult MMA, BJJ (Gi/No-Gi), Boxing, Kickboxing, Youth Martial Arts — site + KB + GHL all align.
- Gym operational — site active, © 2026, active contact CTAs.

## Members-only logic (flagged risk — RESOLVED)
Legacy KB marks advanced MMA, advanced Kickboxing, and Sparring as [MEMBERS ONLY] — not open to prospects/new students. **This is naturally handled by the calendar-as-source-of-truth design:** only intro-eligible disciplines have active `round_robin` trial calendars in GHL. The Members Only advanced sessions are recurring class-schedule entries with no trial calendar, so the bot cannot book them. KB acknowledges they exist (non-bookable handling). No special flow logic required — standard build.

## Bookable (live GHL active round_robin trial calendars)
ADULT (5 disciplines → 5-way discipline switch):
- Adult Intro to Mixed Martial Arts — `81bFEgxMnAsFQYYdcI5d` (DEFAULT - the prospect intro)
- Adult Kickboxing — `ByfwxvYu2GUxBnq8vkQX`
- Adult Brazilian Jiu-Jitsu — `ECNwYUVxkria28gHCHgw`
- Adult No-Gi Brazilian Jiu-Jitsu — `jjnRviO00HolFttyEmwq`
- Adult Boxing — `kWCavL0cMP2rY7g2iDad`

YOUTH:
- Youth 4-6 Martial Arts — `0v5kYtLcKVIAWdkczBG3` (ages 4-6, guardian)
- Youth 7-12 Martial Arts — `ULSNj8GpMWwQypdL0RQg` (ages 7-12, guardian, minor)

INACTIVE round_robin (NOT bookable): Adult All Levels BJJ `NF743zn6FtVG9psFcF7C`.

## Age routing (from live GHL)
- under 4: no calendar → no booking, refer to academy (516) 900-9042
- 4-6: Youth 4-6 Martial Arts (guardian required)
- 7-12: Youth 7-12 Martial Arts (guardian required, minor)
- 13-17: NO calendar band (youth caps at 12, adult is 18+) → **youth no-cal gate (13-17) required**
- 18+: 5-way adult discipline switch (Intro to MMA default / Kickboxing / BJJ / No-Gi / Boxing on explicit request)

## Non-bookable (KB-acknowledged, no flow path)
Members Only sessions: advanced MMA, advanced Kickboxing, Sparring. Kickboxing Drills (covered under Kickboxing). Gi Jiu-Jitsu has no separate active round_robin (covered by Adult BJJ).

## Genuine gaps (flag to Bobby, non-blocking)
- Youth age bands: GHL splits Youth 4-6 / 7-12; legacy KB/site say "all skill levels / young athletes" without exact ages. GHL is source of truth — confirm bands current.
- 13-17 has no trial calendar — confirm intended handling (gate → team follow-up).
- Email of record lawmmastaff@gmail.com (site + KB agree) — fine.
