from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

for section in doc.sections:
    section.top_margin    = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin   = Inches(1)
    section.right_margin  = Inches(1)

FONT = "Arial"

def set_cell_bg(cell, hex_color):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  hex_color)
    tcPr.append(shd)

def add_heading(doc, text, level=1, rgb=(31,56,100)):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.name  = FONT
        run.font.size  = Pt(18 if level==1 else 13 if level==2 else 11)
        run.font.bold  = True
        run.font.color.rgb = RGBColor(*rgb)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after  = Pt(4)
    return p

def add_body(doc, text, bold=False, italic=False, size=10):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name   = FONT
    run.font.size   = Pt(size)
    run.font.bold   = bold
    run.font.italic = italic
    p.paragraph_format.space_after = Pt(4)
    return p

def add_table(doc, headers, rows, col_widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    hdr_row = t.rows[0]
    for i, h in enumerate(headers):
        cell = hdr_row.cells[i]
        set_cell_bg(cell, "1F3864")
        run = cell.paragraphs[0].add_run(h)
        run.font.name = FONT; run.font.size = Pt(9)
        run.font.bold = True; run.font.color.rgb = RGBColor(255,255,255)
    for ri, row in enumerate(rows):
        tr = t.add_row()
        bg = "F2F2F2" if ri % 2 == 0 else "FFFFFF"
        for ci, val in enumerate(row):
            cell = tr.cells[ci]
            set_cell_bg(cell, bg)
            run = cell.paragraphs[0].add_run(str(val))
            run.font.name = FONT; run.font.size = Pt(9)
    if col_widths:
        for i, w in enumerate(col_widths):
            for row in t.rows:
                row.cells[i].width = Inches(w)
    doc.add_paragraph()
    return t

STATUS_BG = {
    "CONFIRMED":    "D9EAD3",
    "GAP RESOLVED": "D9EAD3",
    "NEW FINDINGS": "FFF2CC",
    "CONFLICT":     "FCE5CD",
    "SITE DOWN":    "F4CCCC",
}

STATUS_COLOR = {
    "CONFIRMED":    (31,100,31),
    "GAP RESOLVED": (31,100,31),
    "NEW FINDINGS": (130,90,0),
    "CONFLICT":     (150,30,10),
    "SITE DOWN":    (100,10,10),
}

STATUS_LABEL = {
    "CONFIRMED":    "CONFIRMED - No new issues",
    "GAP RESOLVED": "GAP RESOLVED - Pending gaps closed by website",
    "NEW FINDINGS": "NEW FINDINGS - Updates recommended",
    "CONFLICT":     "CONFLICT - Mismatch requires client confirmation",
    "SITE DOWN":    "SITE DOWN - Cannot verify",
}

# ── COVER
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(60)
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("GSA CLOSEBOT KNOWLEDGE BASE")
r.font.name = FONT; r.font.size = Pt(22); r.font.bold = True
r.font.color.rgb = RGBColor(31,56,100)

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r2 = p2.add_run("Website Fact-Check Report")
r2.font.name = FONT; r2.font.size = Pt(16)
r2.font.color.rgb = RGBColor(70,70,70)

p3 = doc.add_paragraph()
p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
r3 = p3.add_run("Date: 2026-05-15   |   KBs Reviewed: 17   |   Prepared by: Glenn / Claude")
r3.font.name = FONT; r3.font.size = Pt(10)
r3.font.color.rgb = RGBColor(120,120,120)

doc.add_page_break()

# ── EXECUTIVE SUMMARY
add_heading(doc, "Executive Summary", 1)
add_body(doc, (
    "This report cross-references each of the 17 GSA CloseBot knowledge bases against the "
    "gym's live website as of 2026-05-15. Results are organized per gym with a field-by-field "
    "comparison table and a clear verdict. All KBs remain DRAFT status and require client gap "
    "confirmation before deployment."
), size=10)

doc.add_paragraph()

summary_rows = [
    ("Mason Dixon JJ",            "masondixonjiujitsu.com",           "NEW FINDINGS",  "Email missing from KB"),
    ("10th Planet Miami",         "10thplanetmiami.com",              "CONFIRMED",     "All contact + programs verified"),
    ("Academy Eden Prairie",      "academyedenprairie.com",           "CONFLICT",      "City: KB = Minneapolis, Website = Edina"),
    ("Academy of JJ Scottsdale",  "academyofjiujitsuscottsdale.com",  "CONFIRMED",     "All contact + programs verified"),
    ("All In Jiu-Jitsu",          "bteamnj.com",                      "SITE DOWN",     "ECONNREFUSED - cannot verify"),
    ("Artistry BJJ",              "artistrybjj.com",                  "GAP RESOLVED",  "Competition class confirmed; Georgetown phantom closed"),
    ("Ballantyne Martial Arts",   "ballantynemartialarts.com",        "CONFLICT",      "Instructor conflict + kids age conflict"),
    ("Bodega Jiu-Jitsu",          "bodegajiujitsu.com",               "NEW FINDINGS",  "'Genesis' beginner class not in KB"),
    ("Breathe Jiu-Jitsu",         "breathejiujitsu.com",              "CONFIRMED",     "Georgetown phantom confirmed not real"),
    ("Centerline JJ",             "centerlinejiujitsuchandler.com",   "CONFIRMED",     "Address + social confirmed"),
    ("Champion Martial Arts",     "championmaf.com",                  "NEW FINDINGS",  "Silverback Fight Team not in KB"),
    ("Gracie Farmington Valley",  "graciefarmingtonvalley.com",       "CONFIRMED",     "Cardio KB note is outside bot scope"),
    ("Gracie JJ East San Jose",   "gjjsanjose.com",                   "GAP RESOLVED",  "Kids program Gracie Bullyproof (5-12) confirmed"),
    ("Grit JJ & Muay Thai",       "gritbjj.com",                      "GAP RESOLVED",  "Phone + email confirmed - gaps closed"),
    ("Hammer Sports",             "hammertrained.com",                "NEW FINDINGS",  "Personal Training not in KB"),
    ("Hamptons JJ",               "hamptonsjiujitsu.com",             "CONFLICT",      "Westhampton addr; email domain; 6 new instructors; TRX program"),
    ("Inverted Gear Academy",     "invertedgearacademy.com",          "CONFLICT",      "Website confirms Allentown (not ClickUp Bethlehem)"),
]

t = doc.add_table(rows=1, cols=4)
t.style = "Table Grid"
t.alignment = WD_TABLE_ALIGNMENT.LEFT
for i, h in enumerate(["Gym", "Website", "Status", "Summary"]):
    cell = t.rows[0].cells[i]
    set_cell_bg(cell, "1F3864")
    run = cell.paragraphs[0].add_run(h)
    run.font.name = FONT; run.font.size = Pt(9)
    run.font.bold = True; run.font.color.rgb = RGBColor(255,255,255)

for gym, site, status, note in summary_rows:
    tr = t.add_row()
    for ci, val in enumerate([gym, site, status, note]):
        cell = tr.cells[ci]
        set_cell_bg(cell, STATUS_BG.get(status, "FFFFFF"))
        run = cell.paragraphs[0].add_run(val)
        run.font.name = FONT; run.font.size = Pt(9)
        if ci == 2:
            run.font.bold = True

for i, w in enumerate([1.5, 1.8, 1.2, 2.0]):
    for row in t.rows:
        row.cells[i].width = Inches(w)

doc.add_paragraph()
add_body(doc, "CONFIRMED / GAP RESOLVED = No action needed   |   NEW FINDINGS = Recommend KB update   |   CONFLICT = Requires client confirmation   |   SITE DOWN = Cannot verify", italic=True, size=8)

doc.add_page_break()

# ── PER-GYM DATA
gyms = [
  {
    "name": "Mason Dixon Jiu-Jitsu",
    "website": "masondixonjiujitsu.com",
    "status": "NEW FINDINGS",
    "verdict": "Core contact confirmed. Email address present on website is missing from the existing KB (v1.1.3).",
    "actions": ["Add email masondixonjj@gmail.com to KB Contact section."],
    "table": [
        ("Address",  "1495 Lincoln Way East, Chambersburg PA 17201", "1495 Lincoln Way East, Chambersburg PA 17201", "Match"),
        ("Phone",    "(717) 402-8999",                               "(717) 402-8999",                              "Match"),
        ("Email",    "Not listed in KB",                             "masondixonjj@gmail.com",                      "MISSING from KB"),
        ("Programs", "No-Gi BJJ, Adult Striking (Muay Thai), Kids JJ & Striking", "Adult No-Gi JJ, Adult Muay Thai, Youth MA (4-13)", "Match"),
    ]
  },
  {
    "name": "10th Planet Miami",
    "website": "10thplanetmiami.com",
    "status": "CONFIRMED",
    "verdict": "All contact information and programs confirmed. Existing KB (v1.1.4) is accurate and up to date. No action needed.",
    "actions": [],
    "table": [
        ("Address",  "6315 Miramar Parkway, Miramar FL 33023",    "6315 Miramar Parkway, Miramar FL 33023",    "Match"),
        ("Phone",    "786-891-2900",                               "786-891-2900",                              "Match"),
        ("Email",    "10thplanetmiamijj@gmail.com",                "10thplanetmiamijj@gmail.com",               "Match"),
        ("Programs", "Tiny Tots, Kids, Kids Striking, Adult Fundamentals, Advanced, Kickboxing, Competition, MMA, Open Mat", "Adult JJ (No-Gi), Striking/Kickboxing, Tiny Tots (3-6), Kids (7-12), Kids Striking (7+)", "Match"),
    ]
  },
  {
    "name": "Academy Eden Prairie",
    "website": "academyedenprairie.com",
    "status": "CONFLICT",
    "verdict": "Phone and email confirmed. City name conflict: KB lists Minneapolis; website lists Edina. ZIP 55439 belongs to Edina, not Minneapolis. Requires client confirmation before updating.",
    "actions": [
        "Confirm correct city name with client - website says Edina, KB says Minneapolis.",
        "Update KB city to Edina, MN if confirmed.",
    ],
    "table": [
        ("Address city", "Minneapolis, MN (KB value)",  "Edina, MN (website value) - ZIP 55439 = Edina", "CONFLICT - city mismatch"),
        ("Street",       "7501 Washington Ave S, 55439","7501 Washington Avenue South, 55439",           "Match"),
        ("Phone",        "(952) 377-8111",               "(952) 377-8111",                                "Match"),
        ("Email",        "info@academyedenprairie.com",  "info@academyedenprairie.com",                   "Match"),
        ("Programs",     "BJJ Gi/No-Gi, Muay Thai, MMA, Kids MA", "Adult BJJ, Kids BJJ, Competition, Muay Thai Kickboxing", "Match"),
    ]
  },
  {
    "name": "Academy of Jiu-Jitsu Scottsdale",
    "website": "academyofjiujitsuscottsdale.com",
    "status": "CONFIRMED",
    "verdict": "All contact information and programs fully confirmed. No new conflicts or gaps found.",
    "actions": [],
    "table": [
        ("Address",  "8969 E. Talking Stick Way, Suite C-1, Scottsdale AZ 85250", "8969 E Talking Stick Wy C-1, Scottsdale AZ 85250", "Match"),
        ("Phone",    "(480) 270-6040",         "(480) 270-6040",         "Match"),
        ("Email",    "darin@ajjscottsdale.com","darin@ajjscottsdale.com","Match"),
        ("Programs", "Little Tigers (5-7), Tigers (8-13), Adult Fundamentals, Advanced", "Adult BJJ, Kids BJJ (Tigers), Competition Class", "Match"),
        ("Trial",    "Free trial class",       "Free trial class",       "Match"),
    ]
  },
  {
    "name": "All In Jiu-Jitsu",
    "website": "bteamnj.com",
    "status": "SITE DOWN",
    "verdict": "Website returned ECONNREFUSED on the original build date (2026-05-14) and again on this fact-check (2026-05-15). No KB data can be cross-referenced. Phone, email, instructor details, and policies all remain unverified.",
    "actions": [
        "Confirm website status with client.",
        "Obtain direct phone and email.",
        "Confirm instructor names, belt ranks, and credentials.",
        "Obtain adult class schedule - missing from all sources.",
    ],
    "table": [
        ("Website",     "bteamnj.com",  "ECONNREFUSED (both attempts)", "SITE DOWN"),
        ("Phone",       "Not in KB",    "Cannot verify",                 "Unknown"),
        ("Email",       "Not in KB",    "Cannot verify",                 "Unknown"),
        ("Instructors", "Not in KB",    "Cannot verify",                 "Unknown"),
        ("Adult schedule","Not in KB",  "Cannot verify",                 "Unknown"),
    ]
  },
  {
    "name": "Artistry BJJ",
    "website": "artistrybjj.com",
    "status": "GAP RESOLVED",
    "verdict": "All contact confirmed. Two previously flagged gaps are now resolved: (1) Competition Class confirmed as an active program; (2) Georgetown TX second location does not appear on the current website, confirming it was a GSA template artifact.",
    "actions": [
        "Close Competition Class gap - confirmed as active program.",
        "Close Georgetown TX phantom location gap - confirmed not real.",
    ],
    "table": [
        ("Address",             "10203 Market St Unit E, Houston TX 77029","10203 Market Street, Houston TX 77029",     "Match"),
        ("Phone",               "(346) 514-4811",                          "346-514-4811",                             "Match"),
        ("Email",               "info@artistrybjj.com",                    "info@artistrybjj.com",                     "Match"),
        ("Competition Class",   "Flagged as gap (website only, not ClickUp)","Listed on website",                      "RESOLVED - confirmed exists"),
        ("Georgetown TX addr",  "Flagged as likely template phantom",       "Not present on current website",           "RESOLVED - confirmed phantom"),
    ]
  },
  {
    "name": "Ballantyne Martial Arts",
    "website": "ballantynemartialarts.com",
    "status": "CONFLICT",
    "verdict": (
        "Address, phone, and email confirmed. Two conflicts: "
        "(1) Instructor roster - scrape source references Sensei Sparks as founder/head instructor; "
        "current website lists four different staff (John Gilbert, Jason Berkwits, Kathy Lowrance, John Love) "
        "with no mention of Sensei Sparks. The gym rebranded from Sparks Martial Arts to Ballantyne Martial Arts - "
        "confirm whether Sensei Sparks is still affiliated. "
        "(2) Kids minimum age - source says age 6, website says ages 4-15."
    ),
    "actions": [
        "Confirm current instructor roster - is Sensei Sparks still affiliated after the SMA to Ballantyne rebrand?",
        "Confirm belt ranks and credentials for all current instructors.",
        "Confirm kids program minimum age - source says 6, website says 4.",
        "Confirm whether social media handles (SMAMartialArtsAcademy / @sma.academy) have been updated.",
        "Confirm full class schedule (hours only available - class names/times per slot not confirmed).",
    ],
    "table": [
        ("Address",         "11914 Elm Lane Suite 160, Charlotte NC 28277","Charlotte NC (confirmed on website)",   "Match"),
        ("Phone",           "(704) 931-8629",                               "(704) 931-8629",                       "Match"),
        ("Email",           "info@ballantynemartialarts.com",               "info@ballantynemartialarts.com",        "Match"),
        ("Head instructor", "Sensei Sparks (scrape source)",                "John Gilbert, Jason Berkwits, Kathy Lowrance, John Love", "CONFLICT - no overlap"),
        ("Kids min. age",   "Age 6 (scrape source)",                        "Ages 4-15 (website)",                  "CONFLICT - different minimum"),
        ("Social media",    "Not in original scrape",                       "Facebook: SMAMartialArtsAcademy / Instagram: @sma.academy (old SMA branding)", "NOTE - old branding"),
    ]
  },
  {
    "name": "Bodega Jiu-Jitsu",
    "website": "bodegajiujitsu.com",
    "status": "NEW FINDINGS",
    "verdict": "All contact confirmed. Website references a 'Genesis' beginner adult class not in the KB or ClickUp. Kids program is labeled as 'grand opening' on the website - may be newly launched. Adult schedule remains missing from all sources.",
    "actions": [
        "Add 'Genesis' as the adult beginner class name.",
        "Confirm kids program launch status and any schedule updates.",
        "Obtain adult class schedule - still completely missing from all sources.",
    ],
    "table": [
        ("Address",        "6 W Parker Ave, Maplewood NJ 07040","6 W Parker Ave, Maplewood NJ 07040",       "Match"),
        ("Phone",          "(908) 201-3863",                     "(908) 201-3863",                           "Match"),
        ("Email",          "bodega.martialarts@gmail.com",       "bodega.martialarts@gmail.com",             "Match"),
        ("Genesis class",  "Not in KB",                          "Website references 'Genesis' beginner adult class","NEW - add to KB"),
        ("Adult schedule", "Missing from all sources",           "Not shown on website",                     "Still missing - client needed"),
    ]
  },
  {
    "name": "Breathe Jiu-Jitsu",
    "website": "breathejiujitsu.com",
    "status": "CONFIRMED",
    "verdict": "All contact confirmed. Georgetown TX phantom second address does not appear on the current website, confirming it was a GSA template artifact. All programs consistent.",
    "actions": ["Close Georgetown TX phantom location flag - confirmed not real."],
    "table": [
        ("Address",            "84 Horseblock Rd Unit H, Yaphank NY 11980","84 Horseblock Road, Unit H, Yaphank NY 11980","Match"),
        ("Phone",              "(631) 823-0098",                            "(631) 823-0098",                             "Match"),
        ("Email",              "info@breathejiujitsu.com",                  "info@breathejiujitsu.com",                   "Match"),
        ("Georgetown TX addr", "Flagged as likely template phantom",         "Not present on current website",             "RESOLVED - confirmed phantom"),
        ("Programs",           "Adult BJJ, Kids BJJ, Women's Only, Competition","Adult BJJ, Kids BJJ, Competition",       "Match"),
    ]
  },
  {
    "name": "Centerline Jiu-Jitsu",
    "website": "centerlinejiujitsuchandler.com",
    "status": "CONFIRMED",
    "verdict": "Address and social media confirmed. Phone and email are not displayed on the website homepage but are sourced from ClickUp with no conflicting data. No new issues.",
    "actions": [],
    "table": [
        ("Address",   "3016 N Dobson Rd Suite 12, Chandler AZ 85224","3016 N Dobson Rd Suite 12, Chandler AZ 85224","Match"),
        ("Phone",     "(480) 756-2323 (from ClickUp)",               "Not on homepage",                             "No conflict"),
        ("Email",     "michael@centerlinejiujitsu.com (ClickUp)",     "Not on homepage",                             "No conflict"),
        ("Instagram", "@centerlinejiujitsu_chandler",                 "@centerlinejiujitsu_chandler",                "Match"),
        ("Facebook",  "CenterLineJiujitsu",                           "Confirmed",                                   "Match"),
    ]
  },
  {
    "name": "Champion Martial Arts",
    "website": "championmaf.com",
    "status": "NEW FINDINGS",
    "verdict": "All contact confirmed. Programs match. Website identifies the academy as home of the Silverback Fight Team - this competition team affiliation is not in the KB.",
    "actions": ["Add Silverback Fight Team as the academy's affiliated competition team."],
    "table": [
        ("Address",              "4016 Strawberry Rd, Pasadena TX 77504","4016 Strawberry Rd, Pasadena TX 77504","Match"),
        ("Phone",                "(281) 998-6588",                        "(281) 998-6588",                       "Match"),
        ("Email",                "info@championmaf.com",                  "info@championmaf.com",                 "Match"),
        ("Programs",             "Judo, Carlson Gracie BJJ, Shotokan Karate","Same + Boxing/MMA coming soon",     "Match"),
        ("Silverback Fight Team","Not in KB",                             "Home of Silverback Fight Team",        "NEW - add to KB"),
    ]
  },
  {
    "name": "Gracie Farmington Valley",
    "website": "graciefarmingtonvalley.com",
    "status": "CONFIRMED",
    "verdict": "All contact confirmed. Cardio Kickboxing is now listed as an active program on the website, whereas the KB describes it as upcoming. However this program is already marked outside bot scope, so there is no deployment impact.",
    "actions": ["Optional: update Cardio Kickboxing from 'upcoming' to 'active' in KB notes (low priority - outside bot scope)."],
    "table": [
        ("Address",           "15 Cheryl Drive Suite D, Canton CT 06019","15 Cheryl Drive Suite D, Canton CT 06019","Match"),
        ("Phone",             "(860) 500-3829",                           "(860) 500-3829",                          "Match"),
        ("Email",             "gfvjiujitsu@gmail.com",                    "gfvjiujitsu@gmail.com",                   "Match"),
        ("Cardio Kickboxing", "Described as 'upcoming' (outside bot scope)","Listed as active program",             "Minor - outside bot scope, no deployment impact"),
    ]
  },
  {
    "name": "Gracie JJ East San Jose",
    "website": "gjjsanjose.com",
    "status": "GAP RESOLVED",
    "verdict": "All contact confirmed. Website resolves the critical kids program name conflict - the program is Gracie Bullyproof serving ages 5-12. The Jr. Grapplers vs Gracie Bullyproof gap in Section 11 can now be closed.",
    "actions": [
        "Update KB: kids program name = Gracie Bullyproof, ages 5-12.",
        "Close the Jr. Grapplers vs Gracie Bullyproof gap in Section 11.",
    ],
    "table": [
        ("Address",           "1310 Tully Rd #104, San Jose CA 95122","1310 Tully Rd, Unit 104, San Jose CA 95122","Match"),
        ("Phone",             "(669) 600-0528",                        "(669) 600-0528",                            "Match"),
        ("Email",             "julius@gjjsanjose.com",                  "Julius@gjjsanjose.com",                    "Match"),
        ("Kids program",      "Flagged: Jr. Grapplers (ClickUp) vs Gracie Bullyproof (website)","Gracie Bullyproof, ages 5-12","RESOLVED - Gracie Bullyproof confirmed"),
        ("Trial",             "10-day free trial",                      "10-day free trial",                        "Match"),
    ]
  },
  {
    "name": "Grit Jiu-Jitsu & Muay Thai",
    "website": "gritbjj.com",
    "status": "GAP RESOLVED",
    "verdict": "All contact confirmed. Two previously flagged gaps are now resolved by the website: primary phone is 509-392-4548 and primary email is gritjiujitsu@gmail.com. Both conflicting secondary values in Section 11 can be dismissed.",
    "actions": [
        "Mark phone gap resolved - 509-392-4548 is the correct primary number.",
        "Mark email gap resolved - gritjiujitsu@gmail.com is the correct primary email.",
    ],
    "table": [
        ("Address", "4808 E Sprague Ave Suite 205, Spokane Valley WA 99212","4808 E Sprague Ave Suite 205, Spokane Valley WA 99212","Match"),
        ("Phone",   "509-392-4548 (flagged - two numbers in source)",       "509-392-4548",                  "RESOLVED - confirmed primary"),
        ("Email",   "gritjiujitsu@gmail.com (flagged - two emails in source)","gritjiujitsu@gmail.com",      "RESOLVED - confirmed primary"),
        ("Programs","BJJ + Muay Thai, youth + adult",                       "Adult BJJ, Adult Muay Thai, Youth JJ, Youth Muay Thai","Match"),
    ]
  },
  {
    "name": "Hammer Sports & Performance",
    "website": "hammertrained.com",
    "status": "NEW FINDINGS",
    "verdict": "All contact confirmed. Website lists Personal Training (one-on-one) as an available service not currently in the KB.",
    "actions": ["Add Personal Training (one-on-one) as a program/service offering."],
    "table": [
        ("Address",         "1719 Union Ave, Hazlet NJ 07730","1719 Union Ave, Hazlet NJ 07730",                 "Match"),
        ("Phone",           "(732) 795-5626",                  "(732) 795-5626",                                  "Match"),
        ("Email",           "hammernation135@gmail.com",        "hammernation135@gmail.com",                      "Match"),
        ("Programs",        "BJJ, Muay Thai, Kickboxing, Wrestling, MMA, Little Hammer (kids)", "Same + Personal Training (one-on-one)", "NEW - Personal Training not in KB"),
        ("Member portal",   "Not in KB",                        "ClubReady",                                      "Minor - operational info"),
    ]
  },
  {
    "name": "Hamptons Jiu-Jitsu",
    "website": "hamptonsjiujitsu.com",
    "status": "CONFLICT",
    "verdict": (
        "Southampton address confirmed. Four findings: "
        "(1) Westhampton address confirmed as 68 Old Riverhead Rd (resolves KB conflict between 48 and 68); "
        "(2) Email domain confirmed as hamptonsjiujitsu.com - KB has hamptonsjujitsu.com (missing an 's'); "
        "(3) Six additional staff names on website not in KB; "
        "(4) TRX Fitness program (Hamptons Powered by TRX) not in KB."
    ),
    "actions": [
        "Update Westhampton address to 68 Old Riverhead Rd (not 48).",
        "Correct public email to greg@hamptonsjiujitsu.com (KB has a typo - missing 's' in domain).",
        "Add instructors: James Lispesa, Randy Nieves, Josiah Tyte, Richard Byrne, Dan Curro, Howard Greenberg.",
        "Add Hamptons Powered by TRX as an adult fitness program.",
    ],
    "table": [
        ("Southampton address","395 County Rd 39A, Southampton NY 11968","395 County Road 39A, Southampton NY 11968","Match"),
        ("Westhampton address","Flagged conflict: ClickUp=48, Website=68 Old Riverhead Rd","68 Old Riverhead Rd, Westhampton Beach NY 11978","RESOLVED - 68 is correct"),
        ("Phone",             "(631) 900-2780",                           "(631) 900-2780",                        "Match"),
        ("Email",             "info@hamptonsjujitsu.com (ClickUp)",       "greg@hamptonsjiujitsu.com (website)",   "CONFLICT - domain typo + different prefix"),
        ("Instructors",       "Greg Melita (founder/head) only",          "Greg Melita + James Lispesa, Randy Nieves, Josiah Tyte, Richard Byrne, Dan Curro, Howard Greenberg","NEW - 6 additional staff"),
        ("TRX Fitness",       "Not in KB",                                "Hamptons Powered by TRX (adult fitness program)","NEW - program not in KB"),
    ]
  },
  {
    "name": "Inverted Gear Academy",
    "website": "invertedgearacademy.com",
    "status": "CONFLICT",
    "verdict": "Phone and email confirmed. Address conflict was already flagged in the KB (ClickUp = Bethlehem, website = Allentown). This website fetch provides definitive confirmation: the academy is at 804 N Gilmore St, Allentown PA 18109. The ClickUp address is incorrect. Still requires client sign-off to formally close the flag.",
    "actions": [
        "Address conflict: website confirms Allentown (804 N Gilmore St) is correct.",
        "Update KB primary address to Allentown and note ClickUp has the wrong city.",
        "Obtain client confirmation to formally close this gap.",
    ],
    "table": [
        ("Address (ClickUp)", "1114 W Broad St, Bethlehem PA 18018","N/A",                                           "CONFLICT - ClickUp has wrong address"),
        ("Address (Website)", "804 N Gilmore St, Allentown PA 18109","804 N Gilmore St, Allentown PA 18109",          "CONFIRMED - website is correct"),
        ("Phone",             "484-657-4674",                        "484-657-4674",                                   "Match"),
        ("Email",             "academy@invertedgear.com",            "academy@invertedgear.com",                       "Match"),
        ("Programs",          "Adult BJJ (Fundamentals, No-Gi, Advanced, Women's), Cubs, Juniors (4-13)", "Adult BJJ, Women's, Youth (4-13) incl. Cubs","Match"),
    ]
  },
]

for gym in gyms:
    status = gym["status"]
    add_heading(doc, gym["name"], 2, STATUS_COLOR.get(status, (0,0,0)))

    p = doc.add_paragraph()
    r1 = p.add_run("Website: "); r1.font.name=FONT; r1.font.size=Pt(9); r1.font.bold=True
    r2 = p.add_run(gym["website"]); r2.font.name=FONT; r2.font.size=Pt(9)
    r3 = p.add_run("     Status: "); r3.font.name=FONT; r3.font.size=Pt(9); r3.font.bold=True
    r4 = p.add_run(STATUS_LABEL.get(status, status)); r4.font.name=FONT; r4.font.size=Pt(9); r4.font.bold=True

    add_body(doc, gym["verdict"], size=9)

    add_table(doc,
        ["Field", "KB Value", "Website Value", "Result"],
        gym["table"],
        col_widths=[1.3, 2.0, 1.9, 1.3]
    )

    if gym["actions"]:
        pa = doc.add_paragraph()
        ra = pa.add_run("Action Items:"); ra.font.name=FONT; ra.font.size=Pt(9); ra.font.bold=True
        for action in gym["actions"]:
            pb = doc.add_paragraph(style="List Bullet")
            rb = pb.add_run(action); rb.font.name=FONT; rb.font.size=Pt(9)

    doc.add_paragraph()

outpath = r"c:\Users\Administrator\Desktop\ground-standard-ops\clients\ground-standard\closebot\GSA_KB_FactCheck_Report_2026-05-15.docx"
doc.save(outpath)
print(f"Saved: {outpath}")
