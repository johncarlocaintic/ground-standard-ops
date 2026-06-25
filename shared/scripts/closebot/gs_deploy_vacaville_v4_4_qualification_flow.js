/**
 * Deploy: Vacaville v4.4 — Qualification flow + structural minor gate
 *
 * Option A: Move minor detection OUT of the ambient ScenarioCustom
 * (which reads conversation history and false-positives on parent+child flows)
 * INTO structural routing decisions:
 *
 * Patch 1 — n10_intro Push Toward Booking body: adds qualification question
 *   ("for yourself, your child, or both?") with @@@[Parent for Child] exit.
 * Patch 2 — n10_intro ExitPaths: adds "Parent for Child" entry.
 * Patch 3 — n10_intro routing: adds ExitPaths:1 → n20_details (same as ExitPaths:0).
 * Patch 4 — n20_details instruction: adds minor check after DOB save — if age ≤ 17,
 *   exit via @@@[Minor Detected]. replaceAll hits both Sections.Body and Instructions.
 * Patch 5 — n20_details ExitPaths: adds "Minor Detected" entry.
 * Patch 6 — n20_details routing: adds ExitPaths:1 → 2e79ef42 (Acknowledge Minor).
 * Patch 7 — ScenarioCustom e9b707e6: Description → "disabled" (neutralized).
 *
 * Base KDL: archive/closebot-bots/vacaville-v4.3-minor-fix_2026-05-12.kdl
 * Set DRY_RUN=1 to preview without creating a bot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const SANDBOX_SOURCE_ID = 'src_4R4DUIQTMMX2NFPU';
const BOT_NAME = 'Vacaville SANDBOX - v4.4 qualification flow (2026-05-12)';
const KDL_BASE = path.join(REPO_ROOT, 'archive/closebot-bots/vacaville-v4.3-minor-fix_2026-05-12.kdl');
const DRY_RUN = process.env.DRY_RUN === '1';

const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

async function api(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

function dedupeZIndex(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  const seenZAtDepth = [];
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    const isZ = /^__zIndex\b/.test(trimmed);
    if (isZ) {
      if (seenZAtDepth[depth]) { continue; }
      else { seenZAtDepth[depth] = true; }
    }
    out.push(line);
    for (let i = 0; i < opens; i++) { depth++; seenZAtDepth[depth] = false; }
    for (let i = 0; i < closes; i++) { seenZAtDepth[depth] = false; depth = Math.max(0, depth - 1); }
  }
  return out.join('\n');
}

function assertOne(kdl, anchor, label) {
  const count = kdl.split(anchor).length - 1;
  if (count === 0) { console.error(`ERROR: anchor not found — ${label}`); process.exit(1); }
  if (count > 1) { console.error(`ERROR: anchor matches ${count} times (not unique) — ${label}`); process.exit(1); }
}

function patchAll(kdl) {
  // Patch 1 — n10_intro Push Toward Booking body
  const P1_A = 'Body "The goal of this node is to see if the contact has interest in getting a class be it for them, for their children, or both. When the contact expresses ANY interest in trying a class, exit with @@@[Interested]. DO NOT DISCUSS BOOKING, AVAILABLE SLOTS, OR CAPTURE CONTACT INFORMATION IN THIS NODE."';
  const P1_P = 'Body "The goal of this node is to see if the contact has interest in getting a class. Ask once: \'And just to set you up right — is this class for yourself, your child, or both?\' When the contact confirms they want to sign up for THEMSELVES (alone or with a child), exit with @@@[Interested]. When the contact confirms they want to sign up a CHILD ONLY and they are the parent or guardian doing so, exit with @@@[Parent for Child]. DO NOT DISCUSS BOOKING, AVAILABLE SLOTS, OR CAPTURE CONTACT INFORMATION IN THIS NODE."';
  assertOne(kdl, P1_A, 'Patch 1 — n10_intro body');
  kdl = kdl.replace(P1_A, P1_P);
  console.log('  Patch 1: n10_intro Push Toward Booking body — OK');

  // Patch 2 — n10_intro ExitPaths: add "Parent for Child"
  const P2_A = `    ExitPaths {
        _ {
            Title "Interested"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking true
    Title "Intro"`;
  const P2_P = `    ExitPaths {
        _ {
            Title "Interested"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
        _ {
            Title "Parent for Child"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking true
    Title "Intro"`;
  assertOne(kdl, P2_A, 'Patch 2 — n10_intro ExitPaths');
  kdl = kdl.replace(P2_A, P2_P);
  console.log('  Patch 2: n10_intro ExitPaths "Parent for Child" — OK');

  // Patch 3 — n10_intro routing: add ExitPaths:1 (same dest as ExitPaths:0)
  const P3_A = `    ExitPaths:0 handle="n20_details-1777550082426"
    __position 171.93933 6.6071315
}`;
  const P3_P = `    ExitPaths:0 handle="n20_details-1777550082426"
    ExitPaths:1 handle="n20_details-1777550082426"
    __position 171.93933 6.6071315
}`;
  assertOne(kdl, P3_A, 'Patch 3 — n10_intro routing');
  kdl = kdl.replace(P3_A, P3_P);
  console.log('  Patch 3: n10_intro ExitPaths:1 routing — OK');

  // Patch 4 — n20_details instruction: add minor check after ISO dates line
  // replaceAll hits both Sections.Body and Instructions (identical content in this node)
  // Note: \n inside KDL quoted strings are literal backslash-n two-char sequences in the file
  const P4_A = 'Never pass plain English or MM/DD/YYYY.\\n\\nSave each field immediately when received.';
  const P4_P = 'Never pass plain English or MM/DD/YYYY.\\n\\nMinor check: immediately after saving contact.date_of_birth, calculate the contact\'s age from that YYYY-MM-DD value. If they are 17 years old or younger, exit via @@@[Minor Detected].\\n\\nSave each field immediately when received.';
  const p4count = kdl.split(P4_A).length - 1;
  if (p4count === 0) { console.error('ERROR: Patch 4 anchor not found'); process.exit(1); }
  kdl = kdl.replaceAll(P4_A, P4_P);
  console.log(`  Patch 4: n20_details minor check instruction — ${p4count} occurrence(s) patched`);

  // Patch 5 — n20_details ExitPaths: add "Minor Detected"
  const P5_A = `            FrontendExitId "bd2fccdb-9297-40be-9705-b13e72e1f6b7"
        }
    }
    EnableThinking true
    Title "Data Capture v2"`;
  const P5_P = `            FrontendExitId "bd2fccdb-9297-40be-9705-b13e72e1f6b7"
        }
        _ {
            Title "Minor Detected"
            Description ""
            UseTagRules false
        }
    }
    EnableThinking true
    Title "Data Capture v2"`;
  assertOne(kdl, P5_A, 'Patch 5 — n20_details ExitPaths');
  kdl = kdl.replace(P5_A, P5_P);
  console.log('  Patch 5: n20_details ExitPaths "Minor Detected" — OK');

  // Patch 6 — n20_details routing: add ExitPaths:1 → Acknowledge Minor
  const P6_A = `    ExitPaths:0 handle="n30_book"
    __position 489.36124 1.2539959
}`;
  const P6_P = `    ExitPaths:0 handle="n30_book"
    ExitPaths:1 handle="2e79ef42-7908-4399-86e5-3f5a83081403"
    __position 489.36124 1.2539959
}`;
  assertOne(kdl, P6_A, 'Patch 6 — n20_details routing');
  kdl = kdl.replace(P6_A, P6_P);
  console.log('  Patch 6: n20_details ExitPaths:1 → Acknowledge Minor — OK');

  // Patch 7 — ScenarioCustom e9b707e6: disable
  const P7_A = 'Description "{{contact.first_name}}\'s date of birth {{contact.date_of_birth}} indicates they are 17 years old or younger."';
  const P7_P = 'Description "disabled"';
  assertOne(kdl, P7_A, 'Patch 7 — ScenarioCustom disabled');
  kdl = kdl.replace(P7_A, P7_P);
  console.log('  Patch 7: ScenarioCustom e9b707e6 disabled — OK');

  return kdl;
}

async function main() {
  console.log('=== Deploy: Vacaville v4.4 qualification flow ===');
  if (DRY_RUN) console.log('  [DRY RUN — will not call API]\n');

  const base = fs.readFileSync(KDL_BASE, 'utf8');
  console.log(`Loaded base KDL (v4.3): ${base.length} chars\n`);

  console.log('--- Patching ---');
  let kdl = patchAll(base);

  console.log('\n--- Deduping __zIndex ---');
  const before = (kdl.match(/__zIndex/g) || []).length;
  kdl = dedupeZIndex(kdl);
  const after = (kdl.match(/__zIndex/g) || []).length;
  console.log(`  __zIndex: ${before} → ${after}`);

  const archiveDir = path.join(REPO_ROOT, 'archive/closebot-bots');
  const patchedPath = path.join(archiveDir, 'vacaville-v4.4-qualification-flow_2026-05-12.kdl');
  fs.writeFileSync(patchedPath, kdl);
  console.log(`  archived: ${path.relative(REPO_ROOT, patchedPath)}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Stopped before API calls. Review archived KDL to verify patch.');
    process.exit(0);
  }

  console.log('\n--- Creating bot ---');
  const create = await api('POST', '/bot', { name: BOT_NAME, importKdl: kdl });
  console.log(`  POST /bot → ${create.status}`);
  if (!create.ok) {
    console.error('FATAL create failed:', JSON.stringify(create.json).slice(0, 400));
    process.exit(1);
  }
  const newBotId = create.json.id || create.json._id;
  console.log(`  bot id: ${newBotId}`);

  console.log('\n--- Publishing ---');
  const pub = await api('POST', `/bot/${newBotId}/publish`, {});
  console.log(`  publish → ${pub.status}`);
  if (!pub.ok) console.error('  WARN publish failed:', JSON.stringify(pub.json).slice(0, 200));

  console.log('\n--- Attaching to GS Ads sandbox ---');
  const attach = await api('POST', `/bot/${newBotId}/source/${SANDBOX_SOURCE_ID}`, { tags: [], channels: [] });
  console.log(`  attach → ${attach.status}`);
  if (!attach.ok) {
    console.log('  attach got non-200, retrying once...');
    const retry = await api('POST', `/bot/${newBotId}/source/${SANDBOX_SOURCE_ID}`, { tags: [], channels: [] });
    console.log(`  retry → ${retry.status}`);
  }

  console.log('\n=== Done ===');
  console.log(`  Bot ID:   ${newBotId}`);
  console.log(`  Bot name: ${BOT_NAME}`);
  console.log(`  Source:   ${SANDBOX_SOURCE_ID} (GS Ads sandbox)`);
  console.log(`  Archive:  ${path.relative(REPO_ROOT, patchedPath)}`);
  console.log('\n  Next evals:');
  console.log('    vac_cooperative_scheduler — parent enrolling child, minor check MUST NOT fire');
  console.log('    vac_kid_only              — self-enrolling minor, minor check MUST fire');
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
