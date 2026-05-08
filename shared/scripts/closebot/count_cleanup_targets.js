/**
 * List all bots and categorize them so user can confirm cleanup count.
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY };

(async () => {
  const r = await fetch('https://api.closebot.com/bot', { headers: H });
  const j = await r.json();
  const bots = j.bots || j.data || (Array.isArray(j) ? j : []);
  console.log(`Total bots in account: ${bots.length}\n`);

  const KEEP_IDS = new Set([
    'bot_J56AWZ5TYQI9HKJS',  // live launch
    'bot_DR18GF3ZG7IH5QOM',  // backup PROD
  ]);

  const buckets = {
    'KEEP — Vacaville PROD live': [],
    'KEEP — DEMO templates': [],
    'KEEP — non-Vacaville client (PropertyBots, LeadKast, etc.)': [],
    'DELETE — [LEGACY] sweep': [],
    'DELETE — [STRESS-...]': [],
    'DELETE — [SEQ-...]': [],
    'DELETE — [API-PROBE-...]': [],
    'DELETE — [PROBE-A...] / [PROBE-B...]': [],
    'DELETE — [ISOLATION-PROBE]': [],
    'DELETE — [BROKEN-API-...]': [],
    'DELETE — other test/temp (cfg_, fb_, nb_, smoketest, bisect, etc.)': [],
    '?? — needs review': [],
  };

  for (const b of bots) {
    const n = (b.name || '');
    if (KEEP_IDS.has(b.id)) buckets['KEEP — Vacaville PROD live'].push(b);
    else if (/DEMO/i.test(n)) buckets['KEEP — DEMO templates'].push(b);
    else if (/^\[LEGACY\]/i.test(n)) buckets['DELETE — [LEGACY] sweep'].push(b);
    else if (/^\[STRESS-/i.test(n)) buckets['DELETE — [STRESS-...]'].push(b);
    else if (/^\[SEQ-/i.test(n)) buckets['DELETE — [SEQ-...]'].push(b);
    else if (/^\[API-PROBE-/i.test(n)) buckets['DELETE — [API-PROBE-...]'].push(b);
    else if (/^\[PROBE-[AB]/i.test(n)) buckets['DELETE — [PROBE-A...] / [PROBE-B...]'].push(b);
    else if (/^\[ISOLATION-PROBE/i.test(n)) buckets['DELETE — [ISOLATION-PROBE]'].push(b);
    else if (/^\[BROKEN-API/i.test(n)) buckets['DELETE — [BROKEN-API-...]'].push(b);
    else if (/^(cfg_|fb_|nb_|smoketest|bisect|api-check|REF —|Agent Node TEST|v4\.1 dupe)/i.test(n)) buckets['DELETE — other test/temp (cfg_, fb_, nb_, smoketest, bisect, etc.)'].push(b);
    else buckets['?? — needs review'].push(b);
  }

  let totalKeep = 0, totalDelete = 0;
  for (const [label, list] of Object.entries(buckets)) {
    if (list.length === 0) continue;
    console.log(`${label}  (${list.length})`);
    if (label.startsWith('KEEP') || label.startsWith('??')) {
      for (const b of list) console.log(`  ${b.id}  | "${b.name?.slice(0, 80)}"`);
    } else {
      // for DELETE buckets show count + first/last for sanity
      console.log(`  (first 3:)`);
      for (const b of list.slice(0, 3)) console.log(`    ${b.id}  | "${b.name?.slice(0, 80)}"`);
      if (list.length > 3) console.log(`    ... and ${list.length - 3} more`);
    }
    console.log('');
    if (label.startsWith('KEEP')) totalKeep += list.length;
    else if (label.startsWith('DELETE')) totalDelete += list.length;
  }

  console.log(`====================`);
  console.log(`KEEP total:   ${totalKeep}`);
  console.log(`DELETE total: ${totalDelete}`);
  console.log(`?? review:    ${buckets['?? — needs review'].length}`);
  console.log(`Sum:          ${totalKeep + totalDelete + buckets['?? — needs review'].length} (vs reported ${bots.length})`);
})();
