/**
 * v6.3 — apply 3 fixes to v4.1 PROD KDL:
 *   1. Drop "free trial" / "free class" / "free session" language
 *   2. Fix Friday calendar logic (verify per-calendar slots before claiming "same day works")
 *   3. Add retry-before-handoff for booking failures
 */
import fs from 'fs';
const CB_KEY = process.env.CB_GS_API_KEY;

async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let json; try { json = JSON.parse(t); } catch { json = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json };
}

(async () => {
  console.log('=== Pulling base KDL from PROD ===');
  const exp = await api('GET', '/bot/bot_DR18GF3ZG7IH5QOM/export');
  let kdl = exp.json.kdl;
  console.log(`  base: ${kdl.length} chars`);

  // FIX 1: append explicit prohibition to conversationReason
  console.log('\n=== Fix 1: prohibit free-class language ===');
  const fix1 = '\\n\\nNEVER use the words \\"free trial\\", \\"free class\\", or \\"free session\\". The first class is on us — that\'s how we describe it. Do not say it is free.';
  kdl = kdl.replace(
    /conversationReason "([^"]+)"/,
    (match, body) => `conversationReason "${body}${fix1}"`
  );
  console.log(`  applied. KDL now: ${kdl.length} chars`);

  // FIX 2: rewrite n30_book "Book the Contact" Section
  console.log('\n=== Fix 2: same-day verification + per-calendar check ===');
  const oldBookBody = `Body "Always book the contact (the adult). Kids are never contacts — their info is already saved as custom fields on the adult.\\n\\nCalendar to use:\\n- Adult training → Adult No-Gi (KKR9rxFq16DS0fykxXMa)\\n- Kid training → Kids 7-13 (GWdabDvAgRFHZGsBN9Fq)\\n- Both → book on both calendars, one after the other\\n\\nPer calendar:\\n1. @@[Check Appointment Availability]\\n2. Show 2-3 slots, let them pick\\n3. @@[Book Appointments]\\n4. Confirm date/time ONLY after tool returns SUCCESS"`;
  const newBookBody = `Body "Book the contact (always the adult). Calendars: Adult No-Gi (KKR9rxFq16DS0fykxXMa), Kids 7-13 (GWdabDvAgRFHZGsBN9Fq).\\n\\nFor each enrollee: @@[Check Appointment Availability] FIRST. If lead asks for same day for multiple enrollees, you MUST check availability on EACH calendar separately. Only claim a day works if BOTH calendars show slots on that exact date. Kids 7-13 only runs Mon-Thu, Adult runs Mon-Fri. Never assume one calendar's availability matches another's.\\n\\nThen show 2-3 real slots from the tool result, let them pick, @@[Book Appointments]. Confirm date/time ONLY after tool returns SUCCESS."`;
  if (kdl.includes(oldBookBody)) {
    kdl = kdl.replace(oldBookBody, newBookBody);
    console.log('  applied. matched + replaced.');
  } else {
    console.log('  WARN: exact old body not found, trying loose match...');
    // Fallback - find by signature and replace
    kdl = kdl.replace(
      /Body "Always book the contact[^"]+SUCCESS"/,
      newBookBody
    );
    console.log(`  loose match applied. KDL now: ${kdl.length} chars`);
  }

  // FIX 3: retry on booking failure
  console.log('\n=== Fix 3: retry before handoff on booking failure ===');
  const oldFailBody = `Body "If the booking tool fails for any person, use @@[Update Tags] to add tag 'concierge - failed booking' and let them know a team member will reach out to schedule them manually. One sentence, no apology theater."`;
  const newFailBody = `Body "If the booking tool fails: do NOT immediately hand off. Re-call @@[Check Appointment Availability] for that enrollee's calendar to get fresh slots, present 2-3 alternatives to the lead. Only after a SECOND failed booking attempt, use @@[Update Tags] to add 'concierge - failed booking' and tell them a team member will reach out. One sentence, no apology."`;
  if (kdl.includes(oldFailBody)) {
    kdl = kdl.replace(oldFailBody, newFailBody);
    console.log('  applied.');
  } else {
    console.log('  WARN: exact failure body not found');
  }

  // Strip duplicate __zIndex (required for import)
  console.log('\n=== Strip duplicate __zIndex ===');
  const before = (kdl.match(/__zIndex/g) || []).length;
  const lines = kdl.split('\n');
  const out = [];
  for (const line of lines) {
    const isZ = /^__zIndex\b/.test(line.trim());
    if (isZ) {
      const recent = out.slice(-3).map(l => l.trim());
      if (recent.some(r => r.startsWith('__zIndex'))) continue;
    }
    out.push(line);
  }
  kdl = out.join('\n');
  const after = (kdl.match(/__zIndex/g) || []).length;
  console.log(`  __zIndex: ${before} → ${after}`);

  // Save the final KDL
  fs.writeFileSync('shared/logs/vacaville_v6_3_fixes.kdl', kdl);
  console.log(`\n=== Final KDL saved: shared/logs/vacaville_v6_3_fixes.kdl (${kdl.length} chars) ===`);

  // Try POST /bot { importKdl }
  console.log('\n=== Try create new bot ===');
  const c = await api('POST', '/bot', {
    name: `Vacaville v6.3 - 3 fixes ${new Date().toISOString().slice(0, 16)}`,
    importKdl: kdl,
  });
  console.log(`  POST /bot → ${c.status}`);
  if (c.ok) {
    console.log(`  bot ID: ${c.json.id}`);
    const pub = await api('POST', `/bot/${c.json.id}/publish`, {});
    console.log(`  publish → ${pub.status}`);
  } else {
    console.log(`  body: ${JSON.stringify(c.json).slice(0, 200)}`);
    console.log('  IMPORT BROKEN, but KDL file is ready at shared/logs/vacaville_v6_3_fixes.kdl');
    console.log('  Next options: paste into UI manually, OR wait for CloseBot fix');
  }
})();
