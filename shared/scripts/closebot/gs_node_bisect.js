// Inverse bisect: start with minimal skeleton + Vacaville __CONFIG__, add ONE Vacaville node at a time
import fs from 'fs';
const CB_KEY = process.env.CB_GS_API_KEY;

const fullKdl = fs.readFileSync('shared/logs/vacaville_v4.1.kdl', 'utf8');

// Helper: extract a node block
function extractBlock(kdl, blockType, blockId) {
  const startMarker = `${blockType} id="${blockId}" {`;
  const startIdx = kdl.indexOf(startMarker);
  if (startIdx === -1) return null;
  let depth = 0;
  let i = kdl.indexOf('{', startIdx);
  for (; i < kdl.length; i++) {
    if (kdl[i] === '{') depth++;
    else if (kdl[i] === '}') { depth--; if (depth === 0) break; }
  }
  return kdl.slice(startIdx, i + 1);
}

// Vacaville config (we know this works)
const cReason = fullKdl.match(/conversationReason "([^"]+)"/s)[1];
const bInfo = fullKdl.match(/businessInformation "([^"]+)"/s)[1];
const config = `__CONFIG__ {
    conversationReason "${cReason.replace(/"/g, '\\"')}"
    businessInformation "${bInfo.replace(/"/g, '\\"')}"
    prohibitedWords {
        waiver
    }
}`;

// Minimal source + method that we know works
const minimalSourceAndMethod = `Source id="n01_source" {
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

// Vacaville's actual nodes - extract each one
const vacavSource = extractBlock(fullKdl, 'Source', 'n01_source');
const vacavN10 = extractBlock(fullKdl, 'Method', 'n10_intro');
const vacavN20 = extractBlock(fullKdl, 'Method', 'n20_details');
const vacavN30 = extractBlock(fullKdl, 'Method', 'n30_book');

const tests = [
  { label: 'baseline_minimal', kdl: `${config}\n${minimalSourceAndMethod}` },
  { label: 'vacav_source_only', kdl: `${config}\n${vacavSource}\n${minimalSourceAndMethod.split('\n').slice(3).join('\n')}` },
  { label: 'vacav_n10_intro_only', kdl: `${config}\nSource id="src" { Next handle="n10_intro" }\n${vacavN10}` },
  { label: 'vacav_n20_only', kdl: `${config}\nSource id="src" { Next handle="n20_details" }\n${vacavN20}` },
  { label: 'vacav_n30_only', kdl: `${config}\nSource id="src" { Next handle="n30_book" }\n${vacavN30}` },
];

(async () => {
  for (const t of tests) {
    const r = await fetch('https://api.closebot.com/bot', {
      method: 'POST',
      headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `nb_${t.label}_${Date.now()}`, importKdl: t.kdl }),
    });
    const body = (await r.text()).slice(0, 250);
    console.log(`[${r.status}] ${t.label} (${t.kdl.length} chars): ${body}`);
    await new Promise(res => setTimeout(res, 1500));
  }
})();
