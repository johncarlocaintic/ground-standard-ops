// Build the Bobby summary as a polished Word doc.
// Em dashes replaced with " - " per Idriss's no-em-dashes preference.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageOrientation, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign,
} = require('docx');

const COLOR_TITLE = "1F2937";
const COLOR_HEADING = "1E40AF";
const COLOR_TABLE_HEADER_FILL = "1E40AF";
const COLOR_TABLE_HEADER_TEXT = "FFFFFF";
const COLOR_TABLE_BORDER = "D1D5DB";
const COLOR_QUOTE_FILL = "F3F4F6";

const border = { style: BorderStyle.SINGLE, size: 4, color: COLOR_TABLE_BORDER };
const cellBorders = { top: border, bottom: border, left: border, right: border };

// Helper: paragraph of normal body text
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 160, line: 320 },
  ...opts,
  children: [new TextRun({ text, ...(opts.runOpts || {}) })],
});

// Helper: paragraph with multiple text runs (for bold inline emphasis)
const pRich = (runs, opts = {}) => new Paragraph({
  spacing: { after: 160, line: 320 },
  ...opts,
  children: runs.map(r => new TextRun(r)),
});

// Helper: heading 1
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 200 },
  children: [new TextRun({ text })],
});

// Helper: bullet list item
const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 100, line: 300 },
  children: [new TextRun(text)],
});

// Helper: numbered list item
const numItem = (text) => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  spacing: { after: 100, line: 300 },
  children: [new TextRun(text)],
});

// Helper: blockquote-style paragraph (italic + indented + light fill via shading on a single-cell table)
const quote = (text) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 16, color: "1E40AF" }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: COLOR_QUOTE_FILL, type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 280, right: 200 },
          children: [new Paragraph({ children: [new TextRun({ text, italics: true, size: 22 })] })],
        }),
      ],
    }),
  ],
});

// Helper: header cell for table
const headerCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: COLOR_TABLE_HEADER_FILL, type: ShadingType.CLEAR },
  margins: { top: 120, bottom: 120, left: 160, right: 160 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: COLOR_TABLE_HEADER_TEXT, size: 22 })] })],
});

// Helper: body cell for table
const bodyCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  margins: { top: 120, bottom: 120, left: 160, right: 160 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ children: [new TextRun({ text, size: 22 })] })],
});

// Before/after comparison table
const beforeAfterTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [4680, 4680],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [headerCell("Before", 4680), headerCell("After", 4680)],
    }),
    new TableRow({ children: [
      bodyCell("Bot fabricated booking confirmations", 4680),
      bodyCell("Bot only confirms when the booking tool actually succeeded", 4680),
    ]}),
    new TableRow({ children: [
      bodyCell("Parents tagged as unaccompanied-minor referrals", 4680),
      bodyCell("Parents correctly routed to booking flow", 4680),
    ]}),
    new TableRow({ children: [
      bodyCell("Bot collected name and said “you’re booked” before ever calling the booking tool", 4680),
      bodyCell("Bot follows the right sequence: collect info, check calendar, book, confirm", 4680),
    ]}),
    new TableRow({ children: [
      bodyCell("Test bookings polluting Vacaville production calendar", 4680),
      bodyCell("Tests now isolated to GS Ads sandbox; safety rails prevent recurrence", 4680),
    ]}),
    new TableRow({ children: [
      bodyCell("Customer name in your CRM showed as “Testing X” instead of their real name", 4680),
      bodyCell("Real name is captured and saved correctly", 4680),
    ]}),
  ],
});

// Title block
const title = new Paragraph({
  spacing: { after: 80 },
  children: [new TextRun({ text: "Vacaville Bot Overhaul", bold: true, size: 44, color: COLOR_TITLE })],
});

const subtitle = new Paragraph({
  spacing: { after: 360 },
  children: [new TextRun({ text: "Quick rundown for Bobby - 2026-04-29 to 2026-05-01", size: 22, color: "6B7280", italics: true })],
});

const doc = new Document({
  creator: "Idriss",
  title: "Vacaville Bot Overhaul - Summary for Bobby",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: COLOR_HEADING },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: COLOR_HEADING },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      title,
      subtitle,

      p("We spent the last 3 days digging into the bot and found some real issues that were quietly breaking customer experience. All fixed now. Here's the short version."),

      h1("What was happening (the bad stuff)"),

      pRich([
        { text: "The bot was lying to customers. ", bold: true },
        { text: "When someone said “yes I want to book my kid for a class,” the bot would respond with something like:" },
      ]),

      quote("Perfect, you’re all set! See you tonight."),

      p("But it never actually booked anything. The customer would walk away thinking they had a class on the calendar. Coach Nick would never see them. Customer shows up, or worse, doesn't show up because they figured it was handled, and now you've got a confused lead and an awkward situation."),

      p("This was happening on roughly 1 in 3 conversations involving parents enrolling their kids."),

      pRich([
        { text: "Wrong people were getting routed to the wrong place. ", bold: true },
        { text: "Parents enrolling their kids were being tagged as “unaccompanied minor referrals”, meaning the bot's backend was filing them as “kid messaged us alone, please tell their parent to follow up.” The parent was right there in the conversation. The tag was wrong. Coach Nick wouldn't know whether to call the lead about a kid program or wait for them to come back." },
      ]),

      pRich([
        { text: "Test bookings were landing on your real calendar. ", bold: true },
        { text: "This is the one I'm most relieved we caught. Our automated tests were creating fake appointments on the actual Vacaville calendar. Coach Nick would have started seeing phantom Monday classes for “Tester Hayes” and “Tester Marsh” who don't exist. We caught it before any of them landed in his real inbox and cancelled all 4 future ones." },
      ]),

      h1("What we fixed"),

      beforeAfterTable,
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),

      h1("How we know it's better"),

      p("Built an automated test that runs 6 different customer scenarios end-to-end, picky parents, hostile leads, multi-kid families, kids messaging on their own, etc., and checks against your actual GHL data to confirm the bot did what it claimed."),

      pRich([
        { text: "Before the work: ", bold: true },
        { text: "about half of the scenarios had problems." },
      ]),
      pRich([
        { text: "After the work: ", bold: true },
        { text: "5 out of 6 consistently work clean. The one remaining issue (an unaccompanied-minor follow-up flow) is documented and queued." },
      ]),

      p("The whole test takes about 22 minutes and we can re-run it any time the bot changes to make sure nothing broke."),

      h1("What I need from you (small list)"),

      numItem("Kids 7-13 calendar in GS Ads, currently has only 4 slots per week (Mon-Thu @ 5:15 PM). That's enough for sandbox testing for now, but if you want to use this account for any real bookings you'd want to widen the availability windows."),
      numItem("Heads up, you may see a couple of leftover “Tester” contacts in your GS Ads CRM. Those are from the testing process and you can delete them whenever. They're not real leads."),

      h1("What's next on my side"),

      p("The bot is in significantly better shape than 72 hours ago. The remaining items are minor:"),
      bullet("One downstream flow refinement for kids messaging us without their parent"),
      bullet("A small intermittent bug where phone numbers occasionally don't save (working but inconsistent)"),
      bullet("A polish pass on the aggression-handling scenario"),

      p("I'll keep iterating on these and let you know as each one lands."),

      h1("Bottom line"),

      p("The bot now actually books people when it says it does. The CRM gets clean data. Your production calendar is protected from test pollution. And there's a repeatable test that'll catch any future regression in 22 minutes."),

      p("Let me know if you have questions."),
    ],
  }],
});

const out = "clients/ground-standard/vacaville_bot_summary_for_bobby.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log(`Wrote ${out} (${buf.length} bytes)`);
});
