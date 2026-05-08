/**
 * MINOR REFERRAL — reference bot v3 (corrected data model).
 *
 * v2 collected parent info into NEW custom fields (parent_first_name etc).
 * v3 corrects this: the contact IS the parent. Kid info goes to existing
 * youth_name + youth_birthday. Parent info OVERWRITES whatever the inbound
 * landed in contact.first_name/last_name/phone/email. Same data shape the
 * bot already uses for normal parent-booking-for-kid flow.
 *
 * Flow when ScenarioCustom fires:
 *   1. n_minor_ack          — "your parent needs to book this"
 *   2. n_minor_kid_capture  — kid full name + DOB → youth_name + youth_birthday
 *   3. n_minor_parent_capture — parent first/last/phone/email → OVERWRITES contact fields
 *   4. n_minor_tag          — adds "parent referral lead" + "unaccompanied_minor"
 *   5. n_minor_close        — "team will text your parent within 24h"
 *   6. End
 *
 * Kid's own phone (from inbound) is intentionally discarded per Idriss
 * 2026-04-29: "we don't care about the kids phone. doesn't matter if the
 * kid uses their phone to contact us."
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_minor_ref_demo_v3.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_minor_ref_demo_v3.log');

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

const KDL = `__CONFIG__ {
    conversationReason "REFERENCE BOT — Unaccompanied Minor Referral v3. Architecture demo only. Do not attach to live sources. You are Emma at Vacaville Grappling Academy. Friendly, one question at a time, never quote prices. NEVER identify yourself as an AI."
    businessInformation "Reference fixture. When the bot detects it is talking to a minor with no parent involved, the contact gets repurposed: kid info → youth fields, parent info → main contact fields (overwriting). Tag for team follow-up."
}
Source id="n01_source" {
    showTestPortal false
    activeAiNodeId
    Next handle="n10_intro"
    __position 0.0 0.0
    __zIndex 1
}
Method id="n10_intro" {
    EnableSmartFaq false
    EnableLibraryContext false
    EnableCheckAvailability false
    EnableAddTag false
    EnableUpdateContact false
    EnableGhlBooking false
    EnableSendPropertyImage false
    EnableGetPropertyDetails false
    EnableCheckDistance false
    EnableModifyAppointment false
    EnableEmail false
    Sections {
        _ {
            Title "Stub Greet"
            Body "PLACEHOLDER node so this reference bot is publish-able. In production this is replaced by the existing Vacaville intro/booking flow. The interesting structure is the ScenarioCustom + sub-flow below."
        }
    }
    Instructions "Greet briefly and exit."
    ExitPaths
    EnableThinking false
    Title "Stub Intro (placeholder)"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 200.0 0.0
    __zIndex 1
}
ScenarioCustom id="ns_minor_referral" {
    AllowReEntry ""
    Priority 80
    Threshold 6
    Title "Unaccompanied Minor Referral"
    Description "Lead is the prospective student themselves, under 18, with no parent or guardian identified as the booking party."
    showTestPortal false
    activeAiNodeId
    Next handle="n_minor_ack"
    __position 0.0 300.0
    __zIndex 1
}
Statement id="n_minor_ack" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Acknowledge Minor"
    Statement "Acknowledge the contact warmly. Tell them clearly that booking a trial class needs to be done by a parent or guardian — this is normal academy policy. Reassure, do not apologize excessively. Two short sentences max."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n_minor_kid_capture"
    __position 250.0 300.0
    __zIndex 1
}
Method id="n_minor_kid_capture" {
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
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n_minor_parent_capture"
    __position 500.0 300.0
    __zIndex 1
}
Method id="n_minor_parent_capture" {
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
            Title "Capture the Parent's Info (becomes the contact)"
            Body "From this point on, the contact represents the PARENT, not the kid. Capture the parent's first name, last name, phone, and email. Frame the ask: 'What's the best way for our team to reach your parent or guardian about getting you set up for a trial class?' Save via @@[Update Contact], OVERWRITING any kid-default values currently in these slots: parent first name → contact.first_name, parent last name → contact.last_name, parent phone → contact.phone, parent email → contact.email. Collect ONE field per turn, friendly tone."
        }
        _ {
            Title "Exit"
            Body "Once all four parent fields are saved (first_name, last_name, phone, email), exit with @@@[Parent Captured]. No closing message — the next node tags and closes."
        }
    }
    Instructions "Capture parent first/last/phone/email and OVERWRITE contact.first_name, contact.last_name, contact.phone, contact.email respectively. Exit @@@[Parent Captured]."
    ExitPaths {
        _ {
            Title "Parent Captured"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking false
    Title "Capture Parent Info → OVERWRITES main contact fields"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n_minor_tag"
    __position 750.0 300.0
    __zIndex 1
}
ModifyTags id="n_minor_tag" {
    Title "Tag: parent referral lead + unaccompanied_minor"
    TagsToAdd {
        _ {
            id "tag_parent_referral_lead"
            Tag "parent referral lead"
        }
        _ {
            id "tag_unaccompanied_minor"
            Tag "unaccompanied_minor"
        }
    }
    showTestPortal false
    activeAiNodeId
    Next handle="n_minor_close"
    __position 1000.0 300.0
    __zIndex 1
}
Statement id="n_minor_close" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Close — Referral Handoff"
    Statement "Thank the contact warmly. Confirm the team will reach out to their parent or guardian within 24 hours about the trial class. Do NOT promise a specific day, time, or class. End the conversation politely."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n_minor_end"
    __position 1250.0 300.0
    __zIndex 1
}
End id="n_minor_end" {
    Title "Stop — Minor Referral Captured"
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 1500.0 300.0
    __zIndex 1
}
`;

async function main() {
  log('=== Minor Referral Reference Bot v3 (corrected data model) — deploy ===');
  log('Step 1: create bot via POST /bot { name, importKdl }');
  const create = await api('POST', '/bot', {
    name: 'REF — Minor Referral v3 (kid → youth_*, parent → main contact)',
    importKdl: KDL,
  });
  log(`  status: ${create.status}`);
  if (!create.ok) {
    log(`  FAILED: ${JSON.stringify(create.json).slice(0, 800)}`);
    process.exit(1);
  }
  const botId = create.json?.bot?.id || create.json?.id;
  log(`  bot_id: ${botId}`);

  log('Step 2: publish (so the editor renders cleanly — does NOT attach to any source)');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`  status: ${pub.status}`);
  if (!pub.ok) log(`  publish warning: ${JSON.stringify(pub.json).slice(0, 400)}`);

  log('');
  log('=== DONE ===');
  log(`Reference bot ID: ${botId}`);
  log('No source attached. No traffic will hit this bot.');
  log('');
  log('To delete:');
  log(`  curl -X DELETE -H "X-CB-KEY: $CB_GS_API_KEY" https://api.closebot.com/bot/${botId}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
