"""
Convert CloseBot KB .txt files to .md (Markdown) format.

Targets the 17 GSA gym KBs (15 DRAFTs + 2 EXISTING).
Output: a .md file alongside each .txt, same name, same folder.
The .txt remains the CloseBot ingestion source of truth.

Run from repo root:
    python shared/scripts/maintenance/convert_kb_txt_to_md.py
"""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CB_ROOT = REPO_ROOT / "clients" / "ground-standard" / "closebot"

# Explicit KB list — only these 17 get converted. No vacaville_kb_*.txt etc.
KB_FILES = [
    "academy_eden_prairie_kb_v1.1.0_DRAFT.txt",
    "academy_of_jiu_jitsu_scottsdale_kb_v1.2.0_DRAFT.txt",
    "centerline-jiu-jitsu/centerline_jiu_jitsu_kb_v1.0.0_DRAFT.txt",
    "champion-martial-arts/champion_martial_arts_kb_v1.0.0_DRAFT.txt",
    "gracie-farmington-valley/gracie_farmington_valley_kb_v1.0.0_DRAFT.txt",
    "gracie-jj-san-jose/gracie_jj_san_jose_kb_v1.0.0_DRAFT.txt",
    "grit-jiu-jitsu-muay-thai/grit_jiu_jitsu_muay_thai_kb_v1.0.0_DRAFT.txt",
    "hammer-sports-performance/hammer_sports_performance_kb_v1.0.0_DRAFT.txt",
    "hamptons-jiu-jitsu/hamptons_jiu_jitsu_kb_v1.0.0_DRAFT.txt",
    "inverted-gear-academy/inverted_gear_academy_kb_v1.0.0_DRAFT.txt",
    "all-in-jiu-jitsu/all_in_jiu_jitsu_kb_v1.0.0_DRAFT.txt",
    "artistry-bjj/artistry_bjj_kb_v1.0.0_DRAFT.txt",
    "bodega-jiu-jitsu/bodega_jiu_jitsu_kb_v1.0.0_DRAFT.txt",
    "breathe-jiu-jitsu/breathe_jiu_jitsu_kb_v1.0.0_DRAFT.txt",
    "ballantyne-martial-arts/ballantyne_martial_arts_kb_v1.0.0_DRAFT.txt",
    "mason-dixon/existing/v1.1.3_mason_dixon_kb.EXISTING.txt",
    "10p-miami/existing/v1_1_4_10th_planet_miami_kb.EXISTING.txt",
]

# ============================================================
# Conversion
# ============================================================

EQ_RULE = re.compile(r"^={5,}\s*$")
DAY_RULE = re.compile(r"^---\s*([A-Z]+)\s*---\s*$")
SECTION_RULE = re.compile(r"^SECTION\s+\d+\b", re.IGNORECASE)
SCHEDULE_TIME = re.compile(
    r"^\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[–-]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)?)\s{2,}(.+)$"
)
FAQ_Q = re.compile(r"^Q:\s*(.*)$")
FAQ_A = re.compile(r"^A:\s*(.*)$")


def convert(txt: str) -> str:
    """Convert KB plain text to Markdown.

    Conversion rules (kept simple — readability over cleverness):
      * `==== / SECTION X — NAME / ====`  → `## SECTION X — NAME`
      * Initial title between two `====` lines → `# TITLE`
      * `--- MONDAY ---` → `### MONDAY`
      * Two-column schedule lines (time + class) → `- **TIME** — class`
      * `Q:` / `A:` pairs → bold prefixes (kept as paragraphs)
      * Everything else preserved verbatim.
    """
    lines = txt.splitlines()
    out: list[str] = []
    i = 0
    n = len(lines)
    saw_title = False

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Three-line header block: ===, TITLE, ===
        if EQ_RULE.match(stripped) and i + 2 < n and EQ_RULE.match(lines[i + 2].strip()):
            mid = lines[i + 1].rstrip()
            mid_stripped = mid.strip()
            if mid_stripped:
                if SECTION_RULE.match(mid_stripped):
                    out.append("")
                    out.append(f"## {mid_stripped}")
                    out.append("")
                else:
                    # First non-section header block = document title
                    if not saw_title:
                        out.append(f"# {mid_stripped}")
                        saw_title = True
                    else:
                        out.append(f"## {mid_stripped}")
                    out.append("")
                i += 3
                continue
            # empty middle — fall through and treat as a horizontal rule
            out.append("---")
            i += 3
            continue

        # Day separators
        m = DAY_RULE.match(stripped)
        if m:
            out.append("")
            out.append(f"### {m.group(1).title()}")
            out.append("")
            i += 1
            continue

        # Schedule rows: "5:30 PM    Class Name"
        m = SCHEDULE_TIME.match(line)
        if m:
            time_part = re.sub(r"\s+", " ", m.group(1).strip())
            class_part = m.group(2).strip()
            out.append(f"- **{time_part}** — {class_part}")
            i += 1
            continue

        # FAQ Q/A formatting
        m = FAQ_Q.match(stripped)
        if m:
            out.append("")
            out.append(f"**Q:** {m.group(1).strip()}")
            i += 1
            continue
        m = FAQ_A.match(stripped)
        if m:
            out.append(f"**A:** {m.group(1).strip()}")
            out.append("")
            i += 1
            continue

        # Standalone rule line (===== with no surrounding title)
        if EQ_RULE.match(stripped):
            i += 1
            continue

        # Default: preserve the line as-is
        out.append(line)
        i += 1

    # Collapse 3+ consecutive blank lines down to 2
    collapsed: list[str] = []
    blank_run = 0
    for ln in out:
        if ln.strip() == "":
            blank_run += 1
            if blank_run <= 2:
                collapsed.append("")
        else:
            blank_run = 0
            collapsed.append(ln)

    return "\n".join(collapsed).rstrip() + "\n"


def main() -> None:
    written = 0
    missing: list[str] = []
    for rel in KB_FILES:
        src = CB_ROOT / rel
        if not src.exists():
            missing.append(rel)
            continue
        md = convert(src.read_text(encoding="utf-8"))
        dst = src.with_suffix(".md")
        dst.write_text(md, encoding="utf-8")
        written += 1
        print(f"  wrote {dst.relative_to(REPO_ROOT)}")

    print(f"\nDone: {written}/{len(KB_FILES)} files converted")
    if missing:
        print("\nMISSING (source .txt not found):")
        for m in missing:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
