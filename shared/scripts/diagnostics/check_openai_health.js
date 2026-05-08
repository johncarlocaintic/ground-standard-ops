/**
 * OpenAI health check.
 *
 * 1. Tiny chat.completions call → confirms key is valid + service reachable
 * 2. Try to fetch /v1/dashboard/billing/credit_grants (often deprecated but worth trying)
 * 3. Try /v1/usage (current month spend)
 *
 * If chat call returns 401/403 → key is deprecated/revoked
 * If 429 → rate limited or out of quota
 * If 5xx → vendor outage
 * If 200 → key valid, service up
 */
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

(async () => {
  console.log(`=== OpenAI health check ===\n`);

  // 1: tiny completion
  console.log(`[1] POST /v1/chat/completions (gpt-4o-mini, max_tokens=5)`);
  const t0 = Date.now();
  const c = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: H,
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'reply with OK' }], max_tokens: 5 }),
  });
  const elapsed = Date.now() - t0;
  const body = await c.text();
  console.log(`    → ${c.status} in ${elapsed}ms`);
  if (c.ok) {
    try { const j = JSON.parse(body); console.log(`    response: "${j.choices?.[0]?.message?.content}"`); }
    catch { console.log(`    body: ${body.slice(0, 200)}`); }
    console.log(`    headers x-ratelimit-remaining-requests: ${c.headers.get('x-ratelimit-remaining-requests') || '?'}`);
    console.log(`    headers x-ratelimit-remaining-tokens:   ${c.headers.get('x-ratelimit-remaining-tokens') || '?'}`);
  } else {
    console.log(`    body: ${body.slice(0, 400)}`);
  }
  console.log('');

  // 2: try billing endpoints (may be deprecated)
  console.log(`[2] GET /v1/organization/billing/credits  (newer)`);
  const b = await fetch('https://api.openai.com/v1/organization/billing/credits', { headers: H });
  console.log(`    → ${b.status}`);
  if (b.ok) console.log(`    body: ${(await b.text()).slice(0, 300)}`);

  console.log(`\n[3] GET /v1/dashboard/billing/credit_grants  (legacy)`);
  const cg = await fetch('https://api.openai.com/v1/dashboard/billing/credit_grants', { headers: H });
  console.log(`    → ${cg.status}`);
  if (cg.ok) console.log(`    body: ${(await cg.text()).slice(0, 300)}`);

  console.log(`\n[4] GET /v1/models  (sanity: list available models)`);
  const m = await fetch('https://api.openai.com/v1/models', { headers: H });
  console.log(`    → ${m.status}`);
  if (m.ok) {
    const j = await m.json();
    console.log(`    model count: ${(j.data || []).length}`);
  }

  // 5: do 5 quick consecutive completions to detect intermittent failures
  console.log(`\n[5] 5 quick completions to detect intermittent failures`);
  for (let i = 1; i <= 5; i++) {
    const t = Date.now();
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: H,
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'pong' }], max_tokens: 3 }),
    });
    console.log(`    attempt ${i}: ${r.status} in ${Date.now() - t}ms`);
  }
})().catch(e => console.log(`FATAL: ${e.message}`));
