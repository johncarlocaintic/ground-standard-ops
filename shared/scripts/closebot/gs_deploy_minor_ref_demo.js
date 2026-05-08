/**
 * MINOR REFERRAL — reference bot ONLY.
 *
 * Purpose: lets Idriss inspect the unaccompanied-minor handoff architecture firsthand.
 * NOT for live traffic. NOT attached to any source. NOT a Vacaville prod successor.
 *
 * What it shows:
 *   1. A self-path DOB collection node (asks DOB even when not booking the lead)
 *   2. A Comparator (True/False) that routes on DOB year using AI judgment
 *   3. A ScenarioCustom catch-all for leads who self-identify as a minor upfront
 *   4. A 4-node referral capture sequence: ack → collect parent info → tag → close
 *   5. A placeholder "adult continues here" branch so the structure reads cleanly
 *
 * Architecture is deliberately minimal — focuses on the minor path, no full booking flow.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_minor_ref_demo.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_minor_ref_demo.log');

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
    conversationReason "REFERENCE BOT — Unaccompanied Minor Referral Architecture. You are Emma, a front desk teammate. The contact reached out about training. Stay friendly, one question at a time, no hype. Never quote prices. Never confirm a booking unless the booking tool returned SUCCESS this turn. NEVER identify yourself as an AI. This bot exists for architecture review only — do not attach to live sources."
    businessInformation "Reference fixture demonstrating the unaccompanied-minor handoff pattern: collect DOB on self-path, route via Comparator on DOB year, fire ScenarioCustom for catch-all, and capture parent contact info as a referral lead instead of booking the minor."
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
            Title "Greet"
            Body "Greet the contact warmly using their first name if known. Introduce yourself as Emma. One short message."
        }
        _ {
            Title "Who Is This For"
            Body "Ask whether the class is for them, their kid(s), or both. When the contact confirms it is for THEMSELVES, exit with @@@[Self Path]. Other paths are out of scope for this reference bot."
        }
    }
    Instructions "Greet, ask who the class is for, exit @@@[Self Path] when the contact says it is for themselves."
    ExitPaths {
        _ {
            Title "Self Path"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking false
    Title "Intro + Who Is This For"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n20_self_dob"
    __position 200.0 0.0
    __zIndex 1
}
Method id="n20_self_dob" {
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
            Title "Collect Date of Birth"
            Body "Ask the contact for their date of birth in a friendly, low-friction way. Example: 'Quick one to set you up correctly — what's your date of birth?' Save it via @@[Update Contact] to contact.date_of_birth. If they refuse, reframe once ('we just need it to make sure you are set up in the right age group') then accept whatever answer they give. Do NOT collect email, phone, or last name in this node — that comes later, only after age qualification."
        }
        _ {
            Title "Exit"
            Body "Once contact.date_of_birth is saved, exit with @@@[DOB Captured]. Do not write a closing message. The next node decides where the conversation goes."
        }
    }
    Instructions "Collect date of birth into contact.date_of_birth, then exit @@@[DOB Captured]."
    ExitPaths {
        _ {
            Title "DOB Captured"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking false
    Title "Self-Path DOB Collection"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n30_age_gate"
    __position 400.0 0.0
    __zIndex 1
}
Comparator id="n30_age_gate" {
    ExpressionOperator "Contains"
    UseAI true
    Title "Age Gate (under 18 = TRUE)"
    ExpressionLeftValue "{{contact.date_of_birth}}"
    ExpressionRightValue "a year of 2008 or later (today is April 28, 2026 — anyone born 2008-04-29 or later is currently under 18)"
    True handle="n40_minor_ack"
    False handle="n90_adult_continue"
    __position 600.0 0.0
    __zIndex 1
}
ScenarioCustom id="ns_minor_self_id" {
    AllowReEntry ""
    Priority 80
    Threshold 6
    Title "Minor Self-Identifies"
    Description "Lead is the prospective student themselves, under 18, with no parent or guardian identified as the booking party."
    showTestPortal false
    activeAiNodeId
    Next handle="n40_minor_ack"
    __position 600.0 200.0
    __zIndex 1
}
Statement id="n40_minor_ack" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Acknowledge Minor"
    Statement "Acknowledge the contact warmly using their first name. Tell them clearly that booking a trial class needs to be done by a parent or guardian — this is normal academy policy. Reassure, do not apologize excessively. Keep it to two short sentences."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n50_minor_parent"
    __position 800.0 100.0
    __zIndex 1
}
Method id="n50_minor_parent" {
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
    ExitPaths:0 handle="n60_minor_tag"
    __position 1000.0 100.0
    __zIndex 1
}
ModifyTags id="n60_minor_tag" {
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
    Next handle="n70_minor_close"
    __position 1200.0 100.0
    __zIndex 1
}
Statement id="n70_minor_close" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Close — Referral Handoff"
    Statement "Thank the contact by their first name. Confirm the team will reach out to their parent or guardian within 24 hours about the trial class. Do NOT promise a specific day, time, or class. End the conversation politely."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n80_minor_end"
    __position 1400.0 100.0
    __zIndex 1
}
End id="n80_minor_end" {
    Title "Stop — Minor Referral Captured"
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 1600.0 100.0
    __zIndex 1
}
Statement id="n90_adult_continue" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Adult Path (Placeholder)"
    Statement "PLACEHOLDER: in the production bot, the adult booking flow continues here — collect remaining adult contact info, run the booking node, etc. For this reference bot the conversation simply confirms the contact is over 18 and ends."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n91_adult_end"
    __position 800.0 -100.0
    __zIndex 1
}
End id="n91_adult_end" {
    Title "Stop — Adult Path (Reference Only)"
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 1000.0 -100.0
    __zIndex 1
}
`;

async function main() {
  log('=== Minor Referral Reference Bot — deploy ===');
  log('Step 1: create bot via POST /bot { name, importKdl }');
  const create = await api('POST', '/bot', {
    name: 'REF — Unaccompanied Minor Referral (architecture demo, do not attach)',
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
  log('No source attached. No traffic will hit this bot. Open it in CloseBot to inspect the architecture.');
  log('');
  log('To delete when done reviewing:');
  log(`  curl -X DELETE -H "X-CB-KEY: $CB_GS_API_KEY" https://api.closebot.com/bot/${botId}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
