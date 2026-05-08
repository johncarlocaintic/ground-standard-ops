/**
 * Vacaville v0.0.14 — minor referral integrated (v3 data model), CORRECTED WIRING.
 *
 * Previous script (v1) deployed bot_VUL7PWNJYQEHO2T4 with content correct but
 * wiring broken: Acknowledge Minor still pointed straight at parent_capture,
 * leaving kid_capture orphaned. v2 fixes that — Acknowledge Minor's Next is
 * redirected to kid_capture, which exits to parent_capture.
 *
 * Architectural target (the wiring you want to see in the test bench):
 *
 *   ScenarioCustom (Unaccompanied Minor)
 *      ↓
 *   Acknowledge Minor (Statement)
 *      ↓
 *   Capture Kid Info (Method, NEW)         ← kid full name + DOB → youth_name + youth_birthday
 *      ↓
 *   Capture Parent Info (Method, REWRITTEN) ← parent first/last/phone/email OVERWRITE main contact
 *      ↓
 *   Tag (ModifyTags) ← parent referral lead + unaccompanied_minor
 *      ↓
 *   Close (Statement)
 *      ↓
 *   End
 *
 * Note: this new bot will likely be silent at runtime due to the still-active
 * CloseBot Agent Node backend bug (logged 2026-04-25, re-confirmed 2026-04-29).
 * Purpose is reference-for-UI-edit only — Idriss inspects it and replicates
 * the structure into bot_J56AWZ5TYQI9HKJS via the editor.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_v0_14_minor_integrated_v2.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_v0_14_minor_integrated_v2.log');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); }
  return process.env[k];
}
async function api(method, ep, body) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

const SOURCE_BOT = 'bot_J56AWZ5TYQI9HKJS';
const KID_NODE_ID = 'n_minor_kid_capture';
const PARENT_METHOD_ID = 'c005a11a-a41f-490f-af8f-980f91c82572';
const ACK_STATEMENT_ID = '2e79ef42-7908-4399-86e5-3f5a83081403';

async function main() {
  log('=== v0.0.14 minor-integrated v2 (corrected wiring) deploy ===');

  log(`Step 1: export KDL from ${SOURCE_BOT}`);
  const exp = await api('GET', `/bot/${SOURCE_BOT}/export`);
  if (!exp.ok) { log(`  FAILED: ${JSON.stringify(exp.json).slice(0, 400)}`); process.exit(1); }
  let kdl = exp.json.kdl;
  log(`  exported ${kdl.length} chars, source version: ${exp.json.version}`);

  log('Step 2: rewrite parent_capture body to overwrite main contact fields');
  const newParentBody = `From this point on, the contact represents the PARENT, not the kid. Capture the parent's first name, last name, phone, and email. Frame: 'What is the best way for our team to reach your parent or guardian about getting you set up for a trial class?' Save via @@[Update Contact], OVERWRITING any kid-default values currently in these slots: parent first name → contact.first_name, parent last name → contact.last_name, parent phone → contact.phone, parent email → contact.email. Collect ONE field per turn, friendly tone. Do NOT ask the parent for their date of birth.`;
  kdl = kdl.replace(/Collect the parent or guardian's contact details[\s\S]*?Do NOT ask for the parent's date of birth\./, newParentBody);
  log('  parent body rewritten.');

  log('Step 3: rewrite parent_capture Instructions');
  kdl = kdl.replace(
    /Instructions "Collect the parent or guardian's contact details[\s\S]*?Do NOT ask for the parent's date of birth\."/,
    `Instructions "Capture parent first/last/phone/email and OVERWRITE contact.first_name, contact.last_name, contact.phone, contact.email respectively. Exit @@@[Parent Captured]."`
  );
  log('  instructions rewritten.');

  log('Step 4: set Method Title (was empty)');
  kdl = kdl.replace(
    /(SmartFAQ true\n    Email false\n    )Title ""/,
    `$1Title "Capture Parent Info → OVERWRITES main contact fields"`
  );
  log('  title set.');

  log('Step 5: redirect Acknowledge Minor Next from parent_capture to kid_capture (THE WIRING FIX)');
  // The Acknowledge Minor Statement currently has:
  //   Next handle="c005a11a-..."
  //   __position 150.98398 435.09167
  // (The position is the unique signature for the Acknowledge Minor node.)
  const beforeWiring = kdl;
  kdl = kdl.replace(
    `Next handle="${PARENT_METHOD_ID}"\n    __position 150.98398 435.09167`,
    `Next handle="${KID_NODE_ID}"\n    __position 150.98398 435.09167`
  );
  if (kdl === beforeWiring) {
    log('  FAILED: did not find Acknowledge Minor wiring anchor.');
    process.exit(1);
  }
  log('  Acknowledge Minor → kid_capture wired.');

  log('Step 6: insert kid-capture Method (exits to parent_capture)');
  const kidCaptureBlock = `
Method id="${KID_NODE_ID}" {
    EnableUpdateContact true
    EnableSmartFaq false
    EnableLibraryContext false
    EnableCheckAvailability false
    EnableAddTag false
    EnableGhlBooking false
    EnableSendPropertyImage false
    EnableGetPropertyDetails false
    EnableCheckDistance false
    EnableModifyAppointment false
    EnableEmail false
    Sections {
        _ {
            Title "Capture the Kid's Info"
            Body "Capture the kid's full name and date of birth so the team has context when reaching out to the parent. Ask one field at a time, in this order: kid's full name, then kid's date of birth. Save via @@[Update Contact]: full name → contact.youth_name, date of birth → contact.youth_birthday. Do NOT save kid's name to contact.first_name or contact.last_name — those slots are reserved for the parent in the next node. Do NOT ask the kid for their phone or email."
        }
        _ {
            Title "Exit"
            Body "Once contact.youth_name and contact.youth_birthday are saved, exit with @@@[Kid Info Captured]. No closing message — the next node speaks."
        }
    }
    Instructions "Save kid full name to contact.youth_name and kid DOB to contact.youth_birthday. Exit @@@[Kid Info Captured]."
    ExitPaths {
        _ {
            Title "Kid Info Captured"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking false
    Title "Capture Kid Info → youth_name + youth_birthday"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    ExitPaths:0 handle="${PARENT_METHOD_ID}"
    __position 280.0 435.0
}
`;
  kdl = kdl.trimEnd() + kidCaptureBlock;
  log(`  inserted ${KID_NODE_ID}.`);

  log('Step 7: dedup duplicate __zIndex 1 per node block');
  const lines = kdl.split('\n');
  const out = [];
  let depth = 0;
  let zSeenInBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (depth === 0) zSeenInBlock = false;
    if (trimmed === '__zIndex 1' && depth >= 1) {
      if (zSeenInBlock) continue;
      zSeenInBlock = true;
    }
    out.push(line);
    depth += opens - closes;
    if (depth === 0) zSeenInBlock = false;
  }
  kdl = out.join('\n');

  const modifiedPath = path.join(logDir, 'vacaville_v0_14_v2.kdl');
  fs.writeFileSync(modifiedPath, kdl);
  log(`  wrote ${modifiedPath} (${kdl.length} chars)`);

  log('Step 8: deploy');
  const create = await api('POST', '/bot', {
    name: 'Vacaville v0.0.14 - minor referral integrated (v3 data model, corrected wiring)',
    importKdl: kdl,
  });
  log(`  status: ${create.status}`);
  if (!create.ok) { log(`  FAILED: ${JSON.stringify(create.json).slice(0, 800)}`); process.exit(1); }
  const newBotId = create.json?.bot?.id || create.json?.id;
  log(`  new bot id: ${newBotId}`);

  log('Step 9: publish');
  const pub = await api('POST', `/bot/${newBotId}/publish`, {});
  log(`  status: ${pub.status}`);

  log('');
  log('=== DONE ===');
  log(`Reference bot id: ${newBotId}`);
  log(`Wiring (verify in editor): ScenarioCustom → Acknowledge Minor → Capture Kid Info → Capture Parent Info → Tag → Close → End`);
  log(`Expected runtime behavior: SILENT (Agent Node bug still active). Use as visual reference only.`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
