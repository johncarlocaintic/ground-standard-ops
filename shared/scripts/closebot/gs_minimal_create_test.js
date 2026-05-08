// Minimal KDL create test - see if POST /bot accepts ANY content right now
const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

const minimalKdl = `__CONFIG__ {
    conversationReason "test"
    businessInformation "test"
    prohibitedWords
}
Source id="n01_source" {
    Next handle="n10_method"
}
Method id="n10_method" {
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

(async () => {
  for (let i = 1; i <= 3; i++) {
    console.log(`\n=== Attempt ${i} ===`);
    const r = await fetch('https://api.closebot.com/bot', {
      method: 'POST',
      headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `minimal_test_${Date.now()}`, importKdl: minimalKdl }),
    });
    const t = await r.text();
    console.log(`Status: ${r.status}`);
    console.log(`Body: ${t.slice(0, 500)}`);
    if (r.ok) { console.log('SUCCESS - create works'); break; }
    if (i < 3) await new Promise(res => setTimeout(res, 3000));
  }
})();
