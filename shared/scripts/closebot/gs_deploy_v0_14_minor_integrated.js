/**
 * Vacaville v0.0.14 — minor referral integrated, v3 data model.
 *
 * Source: exports KDL from current eval target bot_J56AWZ5TYQI9HKJS (v0.0.13)
 * which has the v2 minor-referral design (wrong: writes to non-existent
 * parent_* custom fields, no kid info capture).
 *
 * Fixes applied to that KDL:
 *   1. Insert NEW kid_capture Method between Acknowledge Minor and Collect Parent.
 *      Saves kid full name → contact.youth_name, kid DOB → contact.youth_birthday.
 *      Both fields already exist in Vacaville GHL.
 *   2. Rewrite parent_capture Method body to OVERWRITE main contact slots
 *      (contact.first_name/last_name/phone/email) instead of writing to
 *      parent_first_name etc. (which don't exist in GHL).
 *   3. Set the parent_capture Method's Title (was empty).
 *
 * Deploys as a NEW bot. Does not touch v0.0.13. No source attach.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_v0_14_minor_integrated.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_v0_14_minor_integrated.log');

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
const NEW_KID_NODE_ID = 'n_minor_kid_capture';

async function main() {
  log('=== v0.0.14 minor-integrated deploy ===');

  log(`Step 1: export KDL from ${SOURCE_BOT}`);
  const exp = await api('GET', `/bot/${SOURCE_BOT}/export`);
  if (!exp.ok) {
    log(`  FAILED export: ${JSON.stringify(exp.json).slice(0, 400)}`);
    process.exit(1);
  }
  let kdl = exp.json.kdl;
  log(`  exported ${kdl.length} chars, source version: ${exp.json.version}`);

  log('Step 2: rewrite parent_capture body to overwrite main contact fields');
  const oldParentBody = `Collect the parent or guardian's contact details so the team can follow up about getting the contact set up for a trial class. Frame as: 'What is the best way for our team to reach your parent or guardian about getting you set up?' Collect ONE field at a time. Required: parent first name, parent last name, parent phone, parent email. Save via @@[Update Contact] to contact.parent_first_name, contact.parent_last_name, contact.parent_phone, contact.parent_email respectively. Do NOT ask for the parent's date of birth.`;
  const newParentBody = `From this point on, the contact represents the PARENT, not the kid. Capture the parent's first name, last name, phone, and email. Frame: 'What is the best way for our team to reach your parent or guardian about getting you set up for a trial class?' Save via @@[Update Contact], OVERWRITING any kid-default values currently in these slots: parent first name → contact.first_name, parent last name → contact.last_name, parent phone → contact.phone, parent email → contact.email. Collect ONE field per turn, friendly tone. Do NOT ask the parent for their date of birth.`;
  if (!kdl.includes(oldParentBody.replace(/'/g, "'"))) {
    log('  WARN: did not find verbatim parent body in KDL — falling back to fuzzy replace.');
    // Fallback: replace by anchor phrase
    const anchor = "Save via @@[Update Contact] to contact.parent_first_name";
    if (!kdl.includes(anchor)) {
      log(`  FAILED: cannot locate parent body anchor.`);
      process.exit(1);
    }
  }
  // Use simple includes check + manual splice since the body is a long single string in the KDL JSON
  // The KDL JSON was returned with escaped chars, so the literal "parent_first_name" is present.
  kdl = kdl.replace(/Collect the parent or guardian's contact details[\s\S]*?Do NOT ask for the parent's date of birth\./, newParentBody);
  log('  parent body rewritten.');

  log('Step 3: rewrite parent_capture Instructions field similarly');
  kdl = kdl.replace(
    /Instructions "Collect the parent or guardian's contact details[\s\S]*?Do NOT ask for the parent's date of birth\."/,
    `Instructions "Capture parent first/last/phone/email and OVERWRITE contact.first_name, contact.last_name, contact.phone, contact.email respectively. Exit @@@[Parent Captured]."`
  );
  log('  instructions rewritten.');

  log('Step 4: set Method Title (was empty)');
  // Fix the empty Title on the parent_capture Method. Use literal newlines in regex.
  kdl = kdl.replace(
    /(SmartFAQ true\n    Email false\n    )Title ""/,
    `$1Title "Capture Parent Info → OVERWRITES main contact fields"`
  );
  log('  title set.');

  log('Step 5: insert kid-capture Method between Acknowledge Minor and Collect Parent');
  // The Acknowledge Minor Statement currently has Next handle="c005a11a-a41f-490f-af8f-980f91c82572"
  // (the parent_capture Method). Redirect it to the new kid_capture Method, which then
  // exits to the parent_capture Method.
  const PARENT_METHOD_ID = 'c005a11a-a41f-490f-af8f-980f91c82572';
  // Re-point the acknowledge Statement's Next to kid_capture
  kdl = kdl.replace(
    `Next handle=\\"${PARENT_METHOD_ID}\\"\\n    __position 150.98398 435.09167\\n}`,
    `Next handle=\\"${NEW_KID_NODE_ID}\\"\\n    __position 150.98398 435.09167\\n}`
  );

  // Build the new kid_capture Method KDL block
  const kidCaptureKdl = `\\nMethod id=\\"${NEW_KID_NODE_ID}\\" {\\n    EnableUpdateContact true\\n    EnableSmartFaq false\\n    EnableLibraryContext false\\n    EnableCheckAvailability false\\n    EnableAddTag false\\n    EnableGhlBooking false\\n    EnableSendPropertyImage false\\n    EnableGetPropertyDetails false\\n    EnableCheckDistance false\\n    EnableModifyAppointment false\\n    EnableEmail false\\n    Sections {\\n        _ {\\n            Title \\"Capture the Kid's Info\\"\\n            Body \\"Capture the kid's full name and date of birth so the team has context when reaching out to the parent. Ask one field at a time, in this order: kid's full name, then kid's date of birth. Save via @@[Update Contact]: full name → contact.youth_name, date of birth → contact.youth_birthday. Do NOT save kid's name to contact.first_name or contact.last_name — those slots are reserved for the parent in the next node. Do NOT ask the kid for their phone or email.\\"\\n        }\\n        _ {\\n            Title \\"Exit\\"\\n            Body \\"Once contact.youth_name and contact.youth_birthday are saved, exit with @@@[Kid Info Captured]. No closing message — the next node speaks.\\"\\n        }\\n    }\\n    Instructions \\"Save kid full name to contact.youth_name and kid DOB to contact.youth_birthday. Exit @@@[Kid Info Captured].\\"\\n    ExitPaths {\\n        _ {\\n            Title \\"Kid Info Captured\\"\\n            Description \\"\\"\\n            MustHaveTags\\n            CantHaveTags\\n            UseTagRules false\\n        }\\n    }\\n    EnableThinking false\\n    Title \\"Capture Kid Info → youth_name + youth_birthday\\"\\n    ToolOrder\\n    EnabledCustomTools\\n    __dynamicVariables\\n    ExitPaths:0 handle=\\"${PARENT_METHOD_ID}\\"\\n    __position 280.0 435.0\\n    __zIndex 1\\n}\\n`;

  // Append the new Method block at the end of the KDL (before the closing newline)
  kdl = kdl.trimEnd() + kidCaptureKdl;
  log(`  inserted ${NEW_KID_NODE_ID}.`);

  log('Step 6: dedup duplicate __zIndex per node (per 2026-04-25 lesson — import 500s otherwise)');
  // Decode any literal \n / \" we appended in step 5
  let readable = kdl.replace(/\\n/g, '\n').replace(/\\"/g, '"');

  // Strip duplicate "__zIndex 1" within a single block. Walk line by line, tracking
  // brace depth; reset zIndex-seen at depth 0 (block boundary).
  const lines = readable.split('\n');
  const out = [];
  let depth = 0;
  let zSeenInBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    // Detect block boundaries by depth change
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (depth === 0) zSeenInBlock = false;
    if (trimmed === '__zIndex 1' && depth >= 1) {
      if (zSeenInBlock) continue; // skip duplicate
      zSeenInBlock = true;
    }
    out.push(line);
    depth += opens - closes;
    if (depth === 0) zSeenInBlock = false;
  }
  readable = out.join('\n');

  const modifiedPath = path.join(logDir, 'vacaville_v0_14.kdl');
  fs.writeFileSync(modifiedPath, readable);
  log(`  wrote ${modifiedPath} (${readable.length} chars)`);

  log('Step 7: deploy new bot');
  const create = await api('POST', '/bot', {
    name: 'Vacaville v0.0.14 - minor referral integrated (v3 data model)',
    importKdl: readable,
  });
  log(`  status: ${create.status}`);
  if (!create.ok) {
    log(`  FAILED: ${JSON.stringify(create.json).slice(0, 800)}`);
    process.exit(1);
  }
  const newBotId = create.json?.bot?.id || create.json?.id;
  log(`  new bot id: ${newBotId}`);

  log('Step 8: publish');
  const pub = await api('POST', `/bot/${newBotId}/publish`, {});
  log(`  status: ${pub.status}`);
  if (!pub.ok) log(`  publish warning: ${JSON.stringify(pub.json).slice(0, 400)}`);

  log('');
  log('=== DONE ===');
  log(`New bot id: ${newBotId}`);
  log(`Modified KDL saved to: ${modifiedPath}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
