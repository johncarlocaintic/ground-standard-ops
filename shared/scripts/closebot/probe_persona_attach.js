/**
 * Probe alternate persona-attach endpoints.
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BOT  = 'bot_SJNN1QEOEJUUU2MH';
const EMMA = 'pers_CB1LLPENDKDRB5S2';

async function probe(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  console.log(`${method} ${ep}  body=${body ? JSON.stringify(body).slice(0, 80) : '(none)'}`);
  console.log(`   → ${r.status}  resp="${t.slice(0, 200)}"`);
}

(async () => {
  await probe('POST', `/bot/${BOT}/persona/${EMMA}`, {});
  await probe('POST', `/bot/${BOT}/persona`, { personaId: EMMA });
  await probe('PUT',  `/bot/${BOT}/persona`, { personaId: EMMA });
  await probe('PUT',  `/bot/${BOT}/persona/${EMMA}`, {});
  await probe('PATCH',`/bot/${BOT}`, { personaIds: [EMMA] });
  // verify
  const r = await fetch(`https://api.closebot.com/bot/${BOT}`, { headers: H });
  const j = await r.json();
  console.log('\nFinal personaIds:', JSON.stringify(j.personaIds));
  console.log('Final tools:', (j.tools || []).map(t => t.type));

  // Probe SmartFAQ alternatives
  console.log('\n--- SmartFAQ probes ---');
  await probe('PUT',  `/bot/${BOT}`, { tools: [{ type: 'SmartFAQ', enabled: true, options: { $type: 'smart_faq' } }] });
  await probe('POST', `/bot/${BOT}/tools`, { type: 'SmartFAQ', enabled: true, options: { $type: 'smart_faq' } });
  await probe('POST', `/bot/${BOT}/smartFaq`, { enabled: true });
  const r2 = await fetch(`https://api.closebot.com/bot/${BOT}`, { headers: H });
  const j2 = await r2.json();
  console.log('Final tools:', (j2.tools || []).map(t => t.type));
})();
