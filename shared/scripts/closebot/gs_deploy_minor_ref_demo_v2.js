/**
 * MINOR REFERRAL — reference bot v2 (simplified).
 *
 * v1 was too invasive (added DOB-collection node + Comparator that demanded
 * flow restructuring). v2 is just a self-contained ScenarioCustom + a 4-node
 * referral capture sequence. Drops into any existing bot without touching
 * upstream nodes.
 *
 * Architecture:
 *   ns_minor_referral (ScenarioCustom, AI-detected from conversation context)
 *      → n_minor_ack (Statement, explains parent must book)
 *      → n_minor_parent (Method, collects parent name + phone + email)
 *      → n_minor_tag (ModifyTags, adds "parent referral lead" + "unaccompanied_minor")
 *      → n_minor_close (Statement, "team will follow up with parent in 24h")
 *      → End
 *
 * Trade-off vs v1:
 *   + Drops in next to existing scenarios. Zero edits to existing nodes.
 *   + Pattern matches knowledge_gap / drop-in / aggression scenarios already in the bot.
 *   - Trigger is pure AI judgment — will miss cases and have false positives.
 *   - A minor who lies about their age (claims 18+) bypasses entirely. Per Idriss
 *     2026-04-28 that's accepted: "if the kid lies about their age... we trust it
 *     as truth. it's up to the team when they come in to figure it out."
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_minor_ref_demo_v2.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_minor_ref_demo_v2.log');

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

// Minimal stub bot with one Method (so the bot is publish-able) plus the
// minor-referral scenario sub-flow. The Method is just a greet — the real
// production drop-in only adds the 5 minor_* nodes and the scenario.
const KDL = `__CONFIG__ {
    conversationReason "REFERENCE BOT — Unaccompanied Minor Referral. Architecture demo only. Do not attach to live sources. You are Emma, a front desk teammate at Vacaville Grappling Academy. Friendly, one question at a time, no pricing. NEVER identify yourself as an AI."
    businessInformation "Reference fixture demonstrating the unaccompanied-minor referral pattern as a single self-contained ScenarioCustom + 4-node capture sequence."
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
            Body "PLACEHOLDER node so this reference bot is publish-able. In production this is replaced by the existing intro/booking flow. The interesting structure is the ScenarioCustom + 4 nodes below."
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
    Statement "Acknowledge the contact warmly using their first name. Tell them clearly that booking a trial class needs to be done by a parent or guardian — this is normal academy policy. Reassure, do not apologize excessively. Keep it to two short sentences."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n_minor_parent"
    __position 250.0 300.0
    __zIndex 1
}
Method id="n_minor_parent" {
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
            Title "Collect Parent Contact Info"
            Body "Collect the parent or guardian's contact details so the team can follow up about getting the contact set up for a trial class. Frame as: 'What is the best way for our team to reach your parent or guardian about getting you set up?' Collect ONE field at a time. Required: parent first name, parent last name, parent phone, parent email. Save via @@[Update Contact] to contact.parent_first_name, contact.parent_last_name, contact.parent_phone, contact.parent_email respectively. Do NOT ask for the parent's date of birth."
        }
        _ {
            Title "Exit"
            Body "Once all four parent fields are saved, exit with @@@[Parent Captured]. Do not write a closing message."
        }
    }
    Instructions "Collect parent first name, last name, phone, and email. Exit @@@[Parent Captured] once all four are saved."
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
    Title "Collect Parent Contact (Referral)"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n_minor_tag"
    __position 500.0 300.0
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
    __position 750.0 300.0
    __zIndex 1
}
Statement id="n_minor_close" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Close — Referral Handoff"
    Statement "Thank the contact by their first name. Confirm the team will reach out to their parent or guardian within 24 hours about the trial class. Do NOT promise a specific day, time, or class. End the conversation politely."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n_minor_end"
    __position 1000.0 300.0
    __zIndex 1
}
End id="n_minor_end" {
    Title "Stop — Minor Referral Captured"
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 1250.0 300.0
    __zIndex 1
}
`;

async function main() {
  log('=== Minor Referral Reference Bot v2 (simplified) — deploy ===');
  log('Step 1: create bot via POST /bot { name, importKdl }');
  const create = await api('POST', '/bot', {
    name: 'REF — Minor Referral (scenario-only, drop-in pattern)',
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
  log('No source attached. No traffic will hit this bot. Open in CloseBot to inspect.');
  log('');
  log('To delete when done reviewing:');
  log(`  curl -X DELETE -H "X-CB-KEY: $CB_GS_API_KEY" https://api.closebot.com/bot/${botId}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
