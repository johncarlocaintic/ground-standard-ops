# Vacaville Grappling Academy — Website Scrape

**Source:** https://vacavillegrappling.com/
**Scraped:** 2026-04-22
**Purpose:** Source material for Bobby's (Ground Standard) Vacaville bot build — the school being templatized.

## Business identity

- **Name:** Vacaville Grappling Academy (aka APEX Grappling Vacaville)
- **Address:** 310 E Monte Vista Ave #B, Vacaville, CA 95688
- **Phone:** 707-232-2500
- **Email:** apexgrapplingvacaville@gmail.com
- **Owner/Head Coach:** Nicholas Hernandez (U.S. Air Force veteran; trained under Prof. Cleidson Ramos of Apex BJJ Academy Vacaville since 2020)
- **Positioning:** "The only dedicated No-Gi Jiu Jitsu and submission grappling academy in Solano County"
- **Methodology:** Constraint-Led Approach — adaptability, self-organization, real-time decision making
- **Service area:** Fairfield, Suisun City, Sonoma, Vallejo, Bay Point, Napa, Woodland, Concord, CA

## Files in this folder

- [homepage.md](homepage.md) — navigation + business summary
- [adult-grappling.md](adult-grappling.md) — adult program description
- [youth-grappling.md](youth-grappling.md) — youth program description
- [about-us.md](about-us.md) — mission, methodology, leadership
- [contact.md](contact.md) — contact info + service areas
- [contact-capture.md](contact-capture.md) — prices/contact-capture landing page
- [offer-adult.md](offer-adult.md) — external free-trial offer page (adult)
- [offer-youth.md](offer-youth.md) — external free-trial offer page (youth)
- [blog-index.md](blog-index.md) — blog post titles + URLs (bodies not scraped)

## Notable gaps

- **No class schedule/times** published on any public page — bot will need to pull from GymDesk member portal or ask the school.
- **No pricing** on any public page — prices route to `/contact-capture` form. Aligns with the no-pricing-in-bot rule.
- **No instructor bios beyond Nicholas Hernandez.**
- **Age range for youth** is stated on homepage as "ages 7-13" but not repeated on the youth-grappling page.
- **Blog post bodies** not scraped — index only. Fetch individual posts if KB needs long-form content.

## External links referenced on site

- Adult offer: https://try.apexgrapplingvacaville.com/adult-offer-submission-grappling
- Youth offer: https://try.apexgrapplingvacaville.com/youth-offer-bjj
- Pro shop: http://vacavillegrappling.printful.me
- Member portal: https://apexgrapplingvacaville.gymdesk.com/login
