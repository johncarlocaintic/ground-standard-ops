// Quick state check before running a sweep against the live Vacaville bot.
// Confirms: (1) bot ID resolves, (2) name matches what todo.md claims,
// (3) source attachment includes the prod source.
const BOT_ID = 'bot_GBIF5HQVM8FPQ0XJ';
const PROD_SOURCE = 'src_GDKORXSW4Q8RQUQ8';

const apiKey = process.env.CB_GS_API_KEY;
if (!apiKey) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const headers = { 'X-CB-KEY': apiKey, 'Accept': 'application/json' };

async function main() {
  const botRes = await fetch(`https://api.closebot.com/bot/${BOT_ID}`, { headers });
  const botText = await botRes.text();
  if (!botRes.ok) {
    console.error(`Bot fetch failed: ${botRes.status}\n${botText}`);
    process.exit(1);
  }
  const bot = JSON.parse(botText);
  console.log(`Bot ID:        ${bot.id || bot._id || BOT_ID}`);
  console.log(`Bot name:      ${bot.name}`);
  console.log(`Bot status:    ${bot.status || bot.publishedStatus || '(unknown)'}`);
  console.log(`Sources:       ${(bot.sources || bot.sourceIds || []).join(', ') || '(none on bot object)'}`);
  console.log('');

  // Cross-check via source endpoint
  const srcRes = await fetch(`https://api.closebot.com/source/${PROD_SOURCE}`, { headers });
  if (srcRes.ok) {
    const src = JSON.parse(await srcRes.text());
    console.log(`Source ${PROD_SOURCE}:`);
    console.log(`  name: ${src.name}`);
    console.log(`  attached bot: ${src.botId || src.bot || '(none)'}`);
  } else {
    console.log(`(source fetch returned ${srcRes.status} — skipping cross-check)`);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
