/**
 * Seeds CloseBot Smart FAQ entries for Vacaville Grappling Academy.
 * Targets both sources: VGA prod + GS Ads test.
 * Based on hallucination patterns observed in v3.10 adversarial sweep (2026-04-22).
 *
 * Endpoint: POST /smart-faq  { sourceId, question, answer }
 * Auth: X-CB-KEY header
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_seed_smart_faq.log');
fs.mkdirSync(logDir, { recursive: true });

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
    method, headers: H, body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

const SOURCES = [
  { id: 'src_GDKORXSW4Q8RQUQ8', name: 'VGA prod' },
  { id: 'src_4R4DUIQTMMX2NFPU', name: 'GS Ads test' },
];

// FAQ pairs derived from v3.10 sweep hallucinations + known gaps
const FAQS = [
  // ── Address (hallucinated 4x as "1651 E Monte Vista") ─────────────────────
  {
    question: "What is the address?",
    answer: "310 E Monte Vista Ave # B, Vacaville, CA 95688. Parking is available in front, on the street, and overflow in the back.",
  },
  {
    question: "Where are you located?",
    answer: "310 E Monte Vista Ave # B, Vacaville, CA 95688.",
  },
  {
    question: "How do I get there?",
    answer: "The academy is at 310 E Monte Vista Ave # B, Vacaville, CA 95688. Nearby landmarks include an athletic track. Parking is available in front, on the street, and overflow in the back.",
  },

  // ── Schedule (hallucinated noon classes, wrong days for mornings) ──────────
  {
    question: "What are the class times?",
    answer: "Kids 7-13 Jiu-Jitsu: Monday through Thursday, 5:15–6:00 PM. Adult No-Gi Submission Grappling (ages 14+): Monday through Friday evenings 6:30–7:30 PM, plus Monday through Thursday mornings 6:30–7:30 AM.",
  },
  {
    question: "What is the class schedule?",
    answer: "Kids 7-13: Mon–Thu 5:15–6:00 PM. Adult No-Gi (14+): Mon–Fri evenings 6:30–7:30 PM and Mon–Thu mornings 6:30–7:30 AM. No weekend or midday classes.",
  },
  {
    question: "What days are the morning classes?",
    answer: "Adult morning classes run Monday through Thursday only, 6:30–7:30 AM. There are no Friday morning classes.",
  },
  {
    question: "Do you have noon classes?",
    answer: "No. There are no noon or midday classes. Adult classes are mornings (Mon–Thu 6:30 AM) and evenings (Mon–Fri 6:30 PM) only.",
  },
  {
    question: "Do you have daytime classes?",
    answer: "The only daytime option is the early morning class, Monday through Thursday at 6:30 AM. There are no midday or noon classes.",
  },

  // ── Weekend (t18 fix — now passing but FAQ locks it in permanently) ─────────
  {
    question: "Do you have Saturday classes?",
    answer: "No. The academy does not run classes on Saturdays. All classes are Monday through Friday only.",
  },
  {
    question: "Do you have Sunday classes?",
    answer: "No. The academy does not run classes on Sundays. All classes are Monday through Friday only.",
  },
  {
    question: "Do you have weekend classes?",
    answer: "No. There are no weekend classes. All classes run Monday through Friday only.",
  },

  // ── Non-existent programs ──────────────────────────────────────────────────
  {
    question: "Do you have a Kids 3-5 program?",
    answer: "No. The youngest program is Kids 7-13 Jiu-Jitsu, starting at age 7. There is no program for children under 7.",
  },
  {
    question: "Do you have a Kids 10-14 program?",
    answer: "No. Ages 10-13 train in the Kids 7-13 program. Age 14 and up trains in the Adult No-Gi class. There is no separate 10-14 age group.",
  },
  {
    question: "Do you have a Little Ninjas program?",
    answer: "No. The academy runs two programs only: Kids 7-13 Jiu-Jitsu and Adult No-Gi Submission Grappling (ages 14+).",
  },
  {
    question: "Do you have a separate teen class?",
    answer: "No. Teens age 14 and up train in the Adult No-Gi Submission Grappling class alongside adults. There is no standalone teen class.",
  },

  // ── Program count anchor ──────────────────────────────────────────────────
  {
    question: "What programs do you offer?",
    answer: "Two programs: (1) Kids 7-13 Jiu-Jitsu for ages 7–13, and (2) Adult No-Gi Submission Grappling for ages 14 and up. Teens 14+ train in the adult class. No gi (kimono) classes are offered — the academy is No-Gi only.",
  },
];

async function main() {
  log(`=== Vacaville Smart FAQ seed — ${FAQS.length} entries × ${SOURCES.length} sources ===`);

  for (const src of SOURCES) {
    log(`\n--- Source: ${src.name} (${src.id}) ---`);
    let ok = 0, fail = 0;
    for (const faq of FAQS) {
      const r = await api('POST', '/smart-faq', {
        sourceId: src.id,
        question: faq.question,
        answer: faq.answer,
      });
      if (r.ok) {
        ok++;
        log(`  ✓ [${r.status}] "${faq.question.slice(0, 60)}"`);
      } else {
        fail++;
        log(`  ✗ [${r.status}] "${faq.question.slice(0, 60)}" → ${JSON.stringify(r.json).slice(0, 200)}`);
      }
    }
    log(`  ${src.name}: ${ok} created, ${fail} failed`);
  }

  log('\n=== SEED COMPLETE ===');
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
