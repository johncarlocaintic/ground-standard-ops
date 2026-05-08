/**
 * Try to create "ai off" tag in Vacaville source via CloseBot agency endpoints.
 * Vacaville GHL PIT lacks `tags` scope so we can't write directly there.
 *
 * Probes:
 *   POST /agency/source/{src}/tags { name }
 *   POST /agency/source/{src}/tag  { name }
 *   PUT  /agency/source/{src}/tags { tags: [...all + 'ai off'] }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/create_aioff_via_cb_agency.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const KEY = process.env.CB_GS_API_KEY;
const SRC = 'src_GDKORXSW4Q8RQUQ8';
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

async function attempt(method, ep, body) {
  log(`  ${method} ${ep}  body=${body ? JSON.stringify(body) : '(none)'}`);
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  log(`    → ${r.status} body="${t.slice(0, 200)}"`);
  return { status: r.status, ok: r.ok, raw: t };
}

async function main() {
  log('=== Try CloseBot agency to create "ai off" tag in Vacaville source ===');

  await attempt('POST', `/agency/source/${SRC}/tags`, { name: 'ai off' });
  await attempt('POST', `/agency/source/${SRC}/tag`,  { name: 'ai off' });
  await attempt('POST', `/agency/source/${SRC}/tags`, { tag: 'ai off' });
  await attempt('PUT',  `/agency/source/${SRC}/tags`, { name: 'ai off' });

  log('\n=== done ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
