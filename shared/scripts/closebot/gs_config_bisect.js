// Bisect __CONFIG__ - find which field (conversationReason / businessInformation / prohibitedWords) breaks import
import fs from 'fs';
const CB_KEY = process.env.CB_GS_API_KEY;

const fullKdl = fs.readFileSync('shared/logs/vacaville_v4.1.kdl', 'utf8');

// Extract Vacaville's CONFIG values
const cReason = fullKdl.match(/conversationReason "([^"]+)"/s)[1];
const bInfo = fullKdl.match(/businessInformation "([^"]+)"/s)[1];

// Minimal valid skeleton
const skeleton = (config) => `${config}
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

const tests = [
  // Baseline - minimal config
  { label: 'minimal_config', config: `__CONFIG__ {\n    conversationReason "test"\n    businessInformation "test"\n    prohibitedWords\n}` },
  // Vacaville conversationReason only
  { label: 'vacav_creason', config: `__CONFIG__ {\n    conversationReason "${cReason.replace(/"/g, '\\"')}"\n    businessInformation "test"\n    prohibitedWords\n}` },
  // Vacaville businessInformation only
  { label: 'vacav_binfo', config: `__CONFIG__ {\n    conversationReason "test"\n    businessInformation "${bInfo.replace(/"/g, '\\"')}"\n    prohibitedWords\n}` },
  // Vacaville prohibitedWords with value
  { label: 'vacav_prohib', config: `__CONFIG__ {\n    conversationReason "test"\n    businessInformation "test"\n    prohibitedWords {\n        waiver\n    }\n}` },
  // All three together
  { label: 'all_vacav', config: `__CONFIG__ {\n    conversationReason "${cReason.replace(/"/g, '\\"')}"\n    businessInformation "${bInfo.replace(/"/g, '\\"')}"\n    prohibitedWords {\n        waiver\n    }\n}` },
];

(async () => {
  for (const t of tests) {
    const kdl = skeleton(t.config);
    const r = await fetch('https://api.closebot.com/bot', {
      method: 'POST',
      headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `cfg_${t.label}_${Date.now()}`, importKdl: kdl }),
    });
    const body = (await r.text()).slice(0, 200);
    console.log(`[${r.status}] ${t.label}: ${body}`);
    await new Promise(res => setTimeout(res, 1500));
  }
})();
