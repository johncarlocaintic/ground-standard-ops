/**
 * Vacaville v4.2 deploy — adds Statement bridge node between Data Capture and Booking.
 *
 * Problem v4.2 fixes: bot collects data in n20_details, then verbally confirms a time
 * ("Diego is all set for Thursday at 5:15 PM") instead of using the @@@[Ready to Book]
 * exit. n30_book never fires. 3 runs of prompt tightening didn't fix it.
 *
 * Structural fix: insert Statement node n25_bridge that fires after n20 exit.
 * Bridge sends a transition message ("Got it, checking times now"), then routes to n30.
 * AI in n20 no longer needs to manage the transition — it's automatic.
 *
 * Archives v4.1 (bot_DR18GF3ZG7IH5QOM).
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_v4_2.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v4_2.log');
fs.mkdirSync(logDir, { recursive: true });

const PREV_BOT_ID    = 'bot_DR18GF3ZG7IH5QOM';  // v4.1 — will be archived
const GS_ADS_SOURCE  = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG     = 'test - v4 agent node';
const CHANNEL        = 'Live_Chat';

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

// KDL based on current v4.1 live state (Idriss's UI edits preserved) + bridge node added.
const KDL = `__CONFIG__ {
    conversationReason "You're Emma from Vacaville Grappling Academy, a front desk employee at the Academy. The contact reached out about training or to know more about the academy and its services — help them figure out if it's a fit, and if it is, get them in for their first class. Write like a teammate at the front desk: direct, unhyped, one question at a time. If a question has a factual answer, answer it — don't hedge. The contact is always the adult — kids are never contacts. Kid info saves to custom fields on the adult. All bookings are on the adult contact.\\n\\nNEVER state specific prices — Coach Nick covers pricing in person. If asked about discounts, confirm they are available for military, law enforcement, first responders, and students — but never quote figures.\\n\\nNEVER identify yourself as an AI, bot, automated system, or virtual assistant — you are Emma, a front desk employee at the academy.\\n\\nNEVER confirm a booking unless the booking tool returned SUCCESS this turn."
    businessInformation "The company name is Vacaville Grappling Academy. It is a No-Gi Brazilian Jiu-Jitsu and Submission Grappling academy located in Vacaville, California."
    prohibitedWords {
        waiver
    }
}
Source id="n01_source" {
    showTestPortal false
    activeAiNodeId
    Next handle="n10_intro"
    __position 12.0 13.5
    __zIndex 1
}
Method id="n10_intro" {
    EnableSmartFaq true
    EnableLibraryContext true
    EnableCheckAvailability false
    EnableAddTag true
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
            Body "Always greet {{contact.first_name}} first — use their name, and introduce yourself and ask who you're speaking with. One message, warm but brief."
        }
        _ {
            Title "Push Toward Booking"
            Body "The goal of this node is to see if the contact has interest in getting a class be it for them, for their children, or both. When the contact expresses interest in trying a class, exit with @@@[Interested]. Minors are disqualified 18 below."
        }
        _ {
            Title "Answer Questions"
            Body "Answer questions about programs, schedule, location, attire, and the academy directly. If asked about availability for a specific class, deflect to booking. Never quote prices — redirect to Coach Nick. Reference the knowledge base and FAQs for answers."
        }
        _ {
            Title "Knowledge Gap"
            Body "If an inquiry from contact is not found in the knowledge base, the job description or FAQs then be honest and inform contact that you do not know about that specifically and offer to hand off to our team."
        }
    }
    Instructions "Always greet {{contact.first_name}} first — use their name, and introduce yourself and ask who you're speaking with. One message, warm but brief."
    ExitPaths {
        _ {
            Title "Interested"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking false
    Title "Intro"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n20_details"
    __position 165.65831 -0.031287026
    __zIndex 1
}
Method id="n20_details" {
    EnableUpdateContact true
    EnableAddTag true
    EnableCheckAvailability false
    EnableGhlBooking false
    EnableLibraryContext false
    EnableSendPropertyImage false
    EnableGetPropertyDetails false
    EnableCheckDistance false
    EnableModifyAppointment false
    EnableEmail false
    EnableSmartFaq false
    Sections {
        _ {
            Title "Who Is This For"
            Body "Ask if it's for them, kid(s), or both—this sets the calendar, not the contact (contact is always the adult). Under 7 → no program. People below 18 years old cannot book for themselves; they need adult."
        }
        _ {
            Title "Collect Contact Info"
            Body "Collect via @@[Update Contact] — adult first, kids second. Your only job here is gathering data. Do not discuss or confirm any class times, dates, or bookings.\\n\\nAdult (the person you're texting):\\n- First name → contact.first_name\\n- Last name → contact.last_name\\n- Email → contact.email\\n- Phone → contact.phone\\n- Date of birth → contact.date_of_birth\\n\\nIf enrolling a kid:\\n- Kid's full name → contact.youth_name (comma-separate multiples)\\n- Kid's date of birth → contact.youth_birthday\\n\\nSave each field immediately when received. Never save a kid's info to the adult's fields."
        }
        _ {
            Title "Exit to Booking"
            Body "Once all required fields are saved, immediately exit with @@@[Ready to Book]. Do not write any closing message. The next node will speak."
        }
    }
    Instructions "Collect contact data, then exit with @@@[Ready to Book]. Do not confirm any times or generate closing messages."
    ExitPaths {
        _ {
            Title "Ready to Book"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
    }
    EnableThinking false
    Title "Data Capture"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    ExitPaths:0 handle="n25_bridge"
    __position 370.20517 2.1429198
    __zIndex 1
}
Statement id="n25_bridge" {
    Attachment ""
    MoveOn true
    UseAI true
    Title "Transition to Booking"
    Statement "Tell {{contact.first_name}} you've got their info and you're going to look up open trial slots now. One short sentence, friendly. Do not list times, do not confirm any specific time — the next step pulls real availability."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="n30_book"
    __position 470.0 2.0
    __zIndex 1
}
Method id="n30_book" {
    EnableUpdateContact true
    EnableAddTag true
    EnableCheckAvailability true
    EnableGhlBooking true
    EnableLibraryContext false
    EnableSendPropertyImage false
    EnableGetPropertyDetails false
    EnableCheckDistance false
    EnableModifyAppointment true
    EnableEmail false
    EnableSmartFaq false
    Sections {
        _ {
            Title "Book the Contact"
            Body "Always book the contact (the adult). Kids are never contacts — their info is already saved as custom fields on the adult.\\n\\nCalendar to use:\\n- Adult training → Adult No-Gi (KKR9rxFq16DS0fykxXMa)\\n- Kid training → Kids 7-13 (GWdabDvAgRFHZGsBN9Fq)\\n- Both → book on both calendars, one after the other\\n\\nPer calendar:\\n1. @@[Check Appointment Availability]\\n2. Show 2-3 slots, let them pick\\n3. @@[Book Appointments]\\n4. Confirm date/time ONLY after tool returns SUCCESS"
        }
        _ {
            Title "Confirm and Close"
            Body "After each successful booking, confirm: date, time, and address. Remind them: no gi needed, wear a rashguard or fitted shirt and pocketless shorts. Once all done, use @@[Update Tags] to add tag 'appointment booked'."
        }
        _ {
            Title "Booking Failure"
            Body "If the booking tool fails for any person, use @@[Update Tags] to add tag 'concierge - failed booking' and let them know a team member will reach out to schedule them manually. One sentence, no apology theater."
        }
    }
    Instructions "Open by calling @@[Check Appointment Availability] for the right calendar. Show 2-3 real slots, let the contact pick, then call @@[Book Appointments]. Only confirm after tool returns SUCCESS."
    EnableThinking false
    ExitPaths
    Title "Booking"
    ToolOrder
    EnabledCustomTools
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 577.50256 8.201676
    __zIndex 1
}
ScenarioCustom id="ns06_knowledge_gap_handoff" {
    AllowReEntry ""
    Priority 72
    Threshold 6
    Title "Knowledge Gap Handoff"
    Description ""
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="nd06_knowledge_gap_tag"
    __position -79.15976 291.0857
    __zIndex 1
}
ModifyTags id="nd06_knowledge_gap_tag" {
    Title "Tag: concierge - knowledge gap"
    TagsToAdd {
        _ {
            id "tag_knowledge_gap"
            Tag "concierge - knowledge gap"
        }
    }
    showTestPortal false
    activeAiNodeId
    Next handle="nd06_knowledge_gap_msg"
    __position 132.14113 290.92267
    __zIndex 1
}
Statement id="nd06_knowledge_gap_msg" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Knowledge Gap Handoff Message"
    Statement "Let the contact know warmly that a team member will reach out who can answer their question properly. One or two sentences max. No apology. "
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="nd06_knowledge_gap_stop"
    __position 362.75967 292.2017
    __zIndex 1
}
End id="nd06_knowledge_gap_stop" {
    Title "Stop - Knowledge Gap Handoff"
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 596.1379 295.48068
    __zIndex 1
}
ScenarioCustom id="ns04_dropin" {
    AllowReEntry ""
    Priority 70
    Threshold 6
    Title "Drop-In Traveler"
    Description "Contact is an experienced grappler visiting Vacaville temporarily (traveling, in town for work) AND mentions training at another BJJ/grappling gym elsewhere. Both conditions must be present. Do NOT trigger when a beginner just asks to 'drop in' or 'try one class' without travel context."
    showTestPortal false
    activeAiNodeId
    Next handle="nd04_dropin_tag"
    __position -8.534226 582.64325
    __zIndex 1
}
ModifyTags id="nd04_dropin_tag" {
    Title "Tag: concierge - drop-in"
    TagsToAdd {
        _ {
            id "tag_dropin"
            Tag "concierge - drop-in"
        }
    }
    showTestPortal false
    activeAiNodeId
    Next handle="nd04_dropin_msg"
    __position 180.0 581.0
    __zIndex 1
}
Statement id="nd04_dropin_msg" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Drop-In Handoff Message"
    Statement "Welcome the visiting practitioner warmly. Let them know that one of the team will reach out shortly with drop-in details and scheduling. Do not attempt to book through the standard trial class flow."
    showTestPortal false
    activeAiNodeId
    Next handle="nd04_dropin_stop"
    __position 362.0 580.0
    __zIndex 1
}
End id="nd04_dropin_stop" {
    Title "Stop - Drop-In Handoff"
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 546.0 581.0
    __zIndex 1
}
ScenarioCustom id="ns07_booking_failure_handoff" {
    AllowReEntry ""
    Priority 80
    Threshold 6
    Title "Booking Failure Handoff"
    Description "The contact's tag list {{contact.tags}} contains 'concierge - failed booking'. This tag is applied by the booking agent when the booking tool could not secure a slot. The contact currently has no confirmed first-class booking and needs a team member to follow up and schedule them manually."
    showTestPortal false
    activeAiNodeId
    __dynamicVariables
    Next handle="nd07_booking_failure_msg"
    __position -82.13694 1144.5199
    __zIndex 1
}
ModifyTags id="nd07_booking_failure_tag" {
    Title "Tag: concierge - booking handoff"
    TagsToAdd {
        _ {
            id "tag_booking_handoff"
            Tag "concierge - booking handoff"
        }
    }
    showTestPortal false
    activeAiNodeId
    Next handle="nd07_booking_failure_msg-1777062568133"
    __position 698.4303 1144.408
    __zIndex 1
}
Statement id="nd07_booking_failure_msg" {
    Attachment ""
    MoveOn true
    UseAI true
    Title "Booking Failure Handoff Message"
    Statement "Let {{contact.first_name}} know warmly that we're having trouble confirming that slot on our end. Note that we've flagged it and someone from the team will reach out personally to get their first class scheduled. Two sentences max. No apology theater."
    showTestPortal false
    activeAiNodeId
    __dynamicVariables
    Next handle="a8aad376-4fd4-4a1b-b5bf-a9d72b06ee03"
    __position 158.57785 1141.6223
    __zIndex 1
}
MultiObjective id="a8aad376-4fd4-4a1b-b5bf-a9d72b06ee03" {
    showTestPortal false
    activeAiNodeId
    Objectives {
        _ {
            MaxAttempts 0
            Sensitivity "50"
            SkipIfNotBlank "True"
            Variable "contact.first_name"
            Title "Get First Name"
            Description "Get the contact's first name"
            id "ed1301fc-3dac-44a4-8471-bd13bd323683"
            Prompt "this is to make sure we have a record of their info so we could contact them accordingly"
        }
        _ {
            MaxAttempts 0
            Sensitivity "50"
            SkipIfNotBlank "True"
            id "e5a41e46-d25d-4bb1-b18d-f2f051f10677"
            Variable "contact.last_name"
            Title "Get Last Name"
            Description "Get the contact's last name"
            Prompt "this is to make sure we have a record of their info so we could contact them accordingly"
        }
        _ {
            MaxAttempts 0
            Sensitivity "50"
            SkipIfNotBlank "True"
            id "3c23be75-a5d1-4d6a-b562-353bfacd5c15"
            Variable "contact.email"
            Title "Get Email"
            Description "Get the contact's email"
            Prompt "this is to make sure we have a record of their info so we could contact them accordingly"
        }
        _ {
            MaxAttempts 0
            Sensitivity "50"
            SkipIfNotBlank "True"
            id "2db4b1ba-27ce-4ea6-bbae-2063a336a3c1"
            Variable "contact.phone"
            Title "Get Phone"
            Description "Get the contact's phone"
            Prompt "this is to make sure we have a record of their info so we could contact them accordingly"
        }
        _ {
            MaxAttempts 0
            Sensitivity "50"
            SkipIfNotBlank "True"
            id "4930d500-50a9-4e14-8c21-b3c17eaa300a"
            Variable "contact.date_of_birth"
            Title "Get Date Of Birth"
            Description "Get the contact's date of birth"
            Prompt "this is to make sure we have a record of their info so we could contact them accordingly"
        }
    }
    __dynamicVariables
    Next handle="nd07_booking_failure_tag"
    __position 433.35345 1134.331
}
ScenarioAggression id="45705328-9e53-44d6-a530-53ba70d19e63" {
    AllowReEntry ""
    Priority 90
    Threshold 7
    Description "The contact is being aggressive or is showing signs of high anger or annoyance."
    Title "Aggression"
    showTestPortal false
    activeAiNodeId
    Next handle="277d2fb6-19ac-4073-9204-65e583cae245"
    __position -57.49015 1372.5751
}
ModifyTags id="277d2fb6-19ac-4073-9204-65e583cae245" {
    showTestPortal false
    activeAiNodeId
    Title "Agression Detected tag"
    __dynamicVariables
    TagsToAdd {
        _ {
            id "187da8e2-0d34-4c06-84c5-9eeefc48e996"
            Tag "Aggression detected - human handoff"
        }
    }
    Next handle="a2952b9d-06e7-4d18-8599-8e5bfe041ff9"
    __position 166.44482 1369.6365
}
End id="a2952b9d-06e7-4d18-8599-8e5bfe041ff9" {
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 400.65454 1373.9319
}
End id="a2952b9d-06e7-4d18-8599-8e5bfe041ff9-1777062560342" {
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 1114.6329 1158.0885
}
Statement id="nd07_booking_failure_msg-1777062568133" {
    Attachment ""
    MoveOn true
    UseAI true
    Title "Confirm Hand off"
    Statement "Thank them and Let {{contact.first_name}} know that someone from the team will contact them soon with regard to booking."
    showTestPortal false
    activeAiNodeId
    __dynamicVariables
    Next handle="a2952b9d-06e7-4d18-8599-8e5bfe041ff9-1777062560342"
    __position 943.1118 1158.8644
    __zIndex 1
}
`;

async function main() {
  log('=== Vacaville v4.2 deploy — bridge node added ===');

  // Archive v4.1
  log('--- Archive v4.1 ---');
  const detach = await api('DELETE', `/bot/${PREV_BOT_ID}/source/${GS_ADS_SOURCE}`);
  log(`  detach → ${detach.status}`);
  const legacyName = `[LEGACY] Vacaville v4.1 TEST - Agent Node (archived ${new Date().toISOString().slice(0, 10)})`;
  const rename = await api('PUT', `/bot/${PREV_BOT_ID}`, { name: legacyName });
  log(`  rename → ${rename.status} → "${legacyName}"`);

  // Create v4.2
  log('--- Create v4.2 ---');
  const botName = `Vacaville v4.2 TEST - Agent Node (${new Date().toISOString().slice(0, 16)})`;
  const c = await api('POST', '/bot', { name: botName, importKdl: KDL });
  log(`  create → ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  log(`  bot ID: ${botId}`);

  // Publish
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${pub.status}`);
  if (!pub.ok) { log('FAIL publish: ' + JSON.stringify(pub.json)); process.exit(1); }

  // SmartFAQ
  const tools = await api('POST', `/bot/${botId}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }
  ]);
  log(`  saveTools → ${tools.status}`);

  // Attach
  const attach = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach → ${attach.status}`);

  // Re-publish after source attach (KB wiring)
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  log(`  re-publish → ${pub2.status}`);

  // Verify
  log('--- Verify ---');
  const exp = await api('GET', `/bot/${botId}/export`);
  if (exp.ok && exp.json?.kdl) {
    const kdl = exp.json.kdl;
    log(`  bridge node n25_bridge present: ${kdl.includes('id="n25_bridge"')}`);
    log(`  n20_details exits to bridge: ${kdl.includes('ExitPaths:0 handle="n25_bridge"')}`);
    log(`  bridge routes to n30_book: ${kdl.match(/n25_bridge[\\s\\S]*?Next handle="n30_book"/) ? 'true' : 'false'}`);
    fs.writeFileSync(path.join(logDir, 'vacaville_v4.2.kdl'), kdl);
  }

  log(`\n=== Deploy complete ===`);
  log(`Bot ID: ${botId}`);
  log(`Tag: ${FILTER_TAG}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
