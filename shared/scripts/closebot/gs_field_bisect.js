// Field-level bisect on Source block: find which Vacaville extra field breaks import
const CB_KEY = process.env.CB_GS_API_KEY;

const config = `__CONFIG__ {
    conversationReason "test"
    businessInformation "test"
    prohibitedWords
}`;

const tail = `Method id="n10_method" {
    EnableSmartFaq false
    Sections {
        _ {
            Title "Test"
            Body "Just say hi back."
        }
    }
    Instructions "Just say hi back."
    EnableThinking false
    Title "Test"
    Next handle="EOC"
}`;

const tests = [
  { label: 'all_no_dupe_zindex', src: `Source id="src" {\n    __zIndex 1\n    showTestPortal false\n    activeAiNodeId\n    Next handle="n10_method"\n    __position 12.0 13.5\n}` },
  { label: 'dupe_zindex_only', src: `Source id="src" {\n    __zIndex 1\n    Next handle="n10_method"\n    __zIndex 1\n}` },
  { label: 'sTP_plus_aAN', src: `Source id="src" {\n    showTestPortal false\n    activeAiNodeId\n    Next handle="n10_method"\n}` },
  { label: 'all_four_orig', src: `Source id="src" {\n    __zIndex 1\n    showTestPortal false\n    activeAiNodeId\n    Next handle="n10_method"\n    __position 12.0 13.5\n    __zIndex 1\n}` },
];

(async () => {
  for (const t of tests) {
    const kdl = `${config}\n${t.src}\n${tail}`;
    const r = await fetch('https://api.closebot.com/bot', {
      method: 'POST',
      headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `fb_${t.label}_${Date.now()}`, importKdl: kdl }),
    });
    const body = (await r.text()).slice(0, 200);
    console.log(`[${r.status}] ${t.label}: ${body}`);
    await new Promise(res => setTimeout(res, 1500));
  }
})();
