/**
 * champion_fix_via_save.mjs
 * Uses the correct POST /save path (per lessons.md 2026-05-22) to apply:
 *   1. whyText scrub — remove Karate/S&C, update age bands (Judo 5+, JJ 7+, adult 13+), keep under 1000 chars
 *   2. n10_intro Sections — remove karate/conditioning from program lists, enhance Knowledge Gap with alert-tag handoff
 *   3. n30_book Sections — remove karate/conditioning calendar mappings, fix age bands
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/champion_fix_via_save.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'champion_fix_via_save.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to apply.\n');

const key = process.env.CB_GS_API_KEY;
const botId = 'bot_GEGYNE5WQNOYH7UB';
const BASE = 'https://api.closebot.com';

async function cb(method, ep, body) {
  const r = await fetch(BASE + ep, {
    method,
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

// Bobby's canon for Champion (2026-05-21):
// - Programs: Judo + Carlson Gracie Brazilian Jiu-Jitsu only (no Karate, no Strength & Conditioning)
// - Judo: ages 5+ (Youth 5-12, Adult 13+)
// - Jiu-Jitsu: ages 7+ (Youth 7-12, Adult 13+)
// - Adult cutoff: 13
const NEW_WHY_TEXT = `You are part of the front desk team named Emma who works for Champion Martial Arts. We offer Judo and Carlson Gracie Brazilian Jiu-Jitsu at our Pasadena, Texas academy. Your goal is to help leads schedule a free trial class so they can experience the gym firsthand. Always confirm which program the lead wants — Judo or Jiu-Jitsu — before booking. Age gates you must enforce: Judo is for ages 5 and up. Jiu-Jitsu is for ages 7 and up — for under-7, offer Judo as an alternative. Anyone 13 or older books into the adult class for that program. For any youth enrollment, always confirm the child's date of birth before confirming program availability. Write like a teammate at the front desk: direct, no hype, one question at a time. Never mention pricing. Never confirm a booking unless the booking tool returned SUCCESS this turn. NEVER identify yourself as an AI, bot, or automated system — you are Emma, a front desk employee at the academy.`;

const NEW_N10_PUSH_BODY = `The goal of this node is to see if the contact has interest in getting a class. Ask: 'And just to set you up right — is this class for yourself, your child, or both?' Then ask which program interests them — 'Are you interested in Judo or Jiu-Jitsu?'

IMPORTANT — coming soon programs: If the lead asks about Boxing, Kickboxing, Muay Thai, Shootboxing, or MMA — these programs are coming soon to Champion Martial Arts but are NOT yet available. Acknowledge that the program is on the way, then state plainly: 'That program is coming soon but isn't available yet — what we can get you scheduled for is a free trial class in Judo or Jiu-Jitsu, which is the right starting point for anyone new to the gym. You can ask the coach about the new program when you come in.' Then redirect to the trial flow.

IMPORTANT — BJJ Open Mat: If the lead asks specifically about the Saturday BJJ Open Mat or Technique Review — acknowledge it exists but state plainly that it isn't available for online booking; offer a free trial class instead.

Do NOT silently route any lead into a booking slot without first confirming their program preference.

When the contact confirms they want to sign up for THEMSELVES (alone or with a child), exit with @@@[Interested]. When the contact confirms they want to sign up a CHILD ONLY and they are the parent or guardian doing so, exit with @@@[Parent for Child]. DO NOT DISCUSS BOOKING, AVAILABLE SLOTS, OR CAPTURE CONTACT INFORMATION IN THIS NODE.`;

const NEW_N10_KNOWLEDGE_GAP = `Use the knowledge base when answering questions. If an inquiry from the contact is NOT found in the knowledge base or FAQs, do not guess or fabricate an answer. Respond with: "That's a great question — let me get the team to follow up with you on that." Then use @@[Update Tags] to add the 'alert' tag so a teammate can step in. Continue the conversation normally only if the lead has another question you can answer; otherwise wait for their reply.`;

const NEW_N30_INSTRUCTIONS = `Use the program preference and enrollment type from conversation context to determine the correct calendar.

ADULTS (age 13+):
- Jiu-Jitsu → use "Adult Brazilian Jiu-Jitsu" calendar
- Judo → use "Adult Judo" calendar

YOUTH (calculate age from {{contact.youth_birthday}} AND program preference from conversation context):
- Jiu-Jitsu + age 7-12 → use "Youth Jiu-Jitsu" calendar
- Jiu-Jitsu + age under 7 → inform the contact that Jiu-Jitsu here is for ages 7 and up. Offer Judo (ages 5+) as an alternative for the trial.
- Judo + age 5-12 → use "Youth Judo" calendar
- Judo + age under 5 → inform the contact that the youngest program available is Judo for ages 5 and up; suggest they contact the gym directly.

For multi-enrollee, check each calendar separately and quote specific slot pairs (e.g. "Tue: kid 5:15 PM + adult 6:30 PM"). Never describe slots vaguely as "morning" or "evening" — always quote the exact time returned by the tool.

Find open slots with @@[Check Appointment Availability]. Quote 2-3 real slots exactly as returned, let them pick. Once they pick, book with @@[Book Appointments] using their EXACT slot — never substitute a different time. If the booking tool returns SUCCESS, confirm the booking and the program. If it does NOT succeed, do NOT confirm — apologize, take the @@@[Booking Failed] exit so a human can follow up.`;

(async () => {
  W(`=== Champion Fix via POST /save — ${new Date().toISOString()} ===\n`);

  // 1. Get current bot to find latest version
  const botMeta = await cb('GET', `/bot/${botId}`);
  const versions = botMeta.json.versions || [];
  const latestVer = versions[versions.length - 1]?.version || '0.0.2';
  W(`Latest version: ${latestVer}`);

  // 2. GET /steps
  W('\n[1] GET /steps');
  const steps = await cb('GET', `/bot/${botId}/steps?botVersion=${latestVer}`);
  if (!steps.ok) { W(`  FAIL: ${steps.status} ${steps.raw.slice(0,200)}`); process.exit(1); }
  const botSteps = steps.json;
  W(`  nodes: ${botSteps.nodes.length}, edges: ${botSteps.edges?.length || 0}`);
  W(`  whyText: ${botSteps.variables.business.whyText.length} chars`);

  // 3. Apply mutations
  W('\n[2] Mutate botSteps');

  // 3a. whyText
  const oldWhyLen = botSteps.variables.business.whyText.length;
  botSteps.variables.business.whyText = NEW_WHY_TEXT;
  W(`  whyText: ${oldWhyLen} → ${NEW_WHY_TEXT.length} chars (limit 1000)`);
  if (NEW_WHY_TEXT.length >= 1000) { W(`  WARN: new whyText is over 1000 chars, halting`); process.exit(1); }

  // 3b. n10_intro Sections
  const n10 = botSteps.nodes.find(n => n.id === 'n10_intro');
  if (n10 && n10.data?.Sections) {
    for (const s of n10.data.Sections) {
      if (s.Title === 'Push Toward Booking') {
        s.Body = NEW_N10_PUSH_BODY;
        W(`  n10_intro "Push Toward Booking" updated`);
      } else if (s.Title === 'Knowledge Gap') {
        s.Body = NEW_N10_KNOWLEDGE_GAP;
        W(`  n10_intro "Knowledge Gap" updated (with alert-tag handoff)`);
      }
    }
    // Make sure AddTag tool is enabled (it already is, but be safe)
    n10.data.EnableAddTag = true;
  }

  // 3c. n30_book Instructions — both Sections[0].Body AND top-level Instructions field carry the same content
  const n30 = botSteps.nodes.find(n => n.id === 'n30_book');
  if (n30 && n30.data) {
    const instrSec = n30.data.Sections?.find(s => s.Title === 'Instructions');
    if (instrSec) {
      instrSec.Body = NEW_N30_INSTRUCTIONS;
      W(`  n30_book Sections "Instructions" updated`);
    }
    if (typeof n30.data.Instructions === 'string') {
      n30.data.Instructions = NEW_N30_INSTRUCTIONS;
      W(`  n30_book top-level Instructions updated`);
    }
  }

  // 4. Quick scan for any remaining karate/conditioning references in node bodies
  W('\n[3] Verify scrub');
  const blob = JSON.stringify(botSteps);
  const karateHits = (blob.match(/karate/gi) || []).length;
  const condHits = (blob.match(/champion conditioning|strength and conditioning|conditioning/gi) || []).length;
  W(`  karate refs in serialized botSteps: ${karateHits}`);
  W(`  conditioning refs: ${condHits}`);
  if (karateHits > 0 || condHits > 0) {
    W(`  WARN: still has references — scan locations:`);
    for (const n of botSteps.nodes) {
      const nb = JSON.stringify(n);
      if (/karate|conditioning/i.test(nb)) {
        W(`    ${n.id} (${n.type}) — has hits`);
      }
    }
  }

  if (!EXECUTE) { W('\n[DRY] would POST /save + publish'); return; }

  // 5. POST /save
  W('\n[4] POST /save');
  const save = await cb('POST', `/bot/${botId}/save`, { botSteps, layoutOnly: false });
  W(`  status: ${save.status}`);
  if (!save.ok) { W(`  FAIL: ${save.raw.slice(0, 400)}`); process.exit(1); }
  W(`  response: ${JSON.stringify(save.json).slice(0, 300)}`);
  const newVer = save.json.version;
  W(`  new version: ${newVer}`);

  await new Promise(r => setTimeout(r, 2000));

  // 6. POST /publish
  W('\n[5] POST /publish');
  const pub = await cb('POST', `/bot/${botId}/publish`, {});
  W(`  status: ${pub.status}`);

  await new Promise(r => setTimeout(r, 2000));

  // 7. Verify via re-fetch
  W('\n[6] Verify');
  const after = await cb('GET', `/bot/${botId}/steps?botVersion=${newVer}`);
  if (after.ok) {
    const newKarate = (JSON.stringify(after.json).match(/karate/gi) || []).length;
    const newCond = (JSON.stringify(after.json).match(/champion conditioning|strength and conditioning|conditioning/gi) || []).length;
    W(`  v${newVer} karate: ${newKarate} | conditioning: ${newCond}`);
    W(`  v${newVer} whyText length: ${after.json.variables.business.whyText.length}`);
    W(`  whyText starts with: "${after.json.variables.business.whyText.slice(0, 100)}"`);
  }

  // Re-check bot meta for new version
  const botAfter = await cb('GET', `/bot/${botId}`);
  W(`\n  Bot versions after: ${(botAfter.json.versions || []).map(v => v.version).join(', ')}`);

  W(`\nLog: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
