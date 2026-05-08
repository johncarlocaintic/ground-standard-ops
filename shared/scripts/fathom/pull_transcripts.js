import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'shared', 'transcripts', 'fathom');
const LOG_DIR = path.join(REPO_ROOT, 'shared', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'fathom_pull.log');
const BASE_URL = 'https://api.fathom.ai/external/v1';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

function getEnv(key) {
  const val = process.env[key];
  if (!val) { console.error(`Missing required env var: ${key}`); process.exit(1); }
  return val;
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function slug(str) {
  return (str || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function fathomGet(apiKey, path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(i => url.searchParams.append(k, i));
    else url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), { headers: { 'X-Api-Key': apiKey } });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${json.message || text}`);
    return json;
  } catch (e) {
    throw new Error(`Parse error (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
}

function formatTranscript(meeting) {
  const date = new Date(meeting.created_at).toISOString().split('T')[0];
  const lines = [
    `Meeting: ${meeting.title || 'Untitled'}`,
    `Date: ${date}`,
    `Recording ID: ${meeting.recording_id}`,
    `URL: ${meeting.url || 'N/A'}`,
    `Duration: ${meeting.duration_seconds ? Math.round(meeting.duration_seconds / 60) + ' min' : 'N/A'}`,
    '',
    '---',
    '',
  ];

  const transcript = meeting.transcript || [];
  if (transcript.length === 0) {
    lines.push('(No transcript available)');
  } else {
    for (const seg of transcript) {
      const speaker = seg.speaker?.display_name || 'Unknown';
      lines.push(`[${seg.timestamp}] ${speaker}: ${seg.text}`);
    }
  }

  return lines.join('\n');
}

async function main() {
  const apiKey = getEnv('FATHOM_API_KEY');

  // Optional: filter to last N days via CLI arg (default: all time)
  const daysBack = parseInt(process.argv[2]) || null;
  const params = {
    include_transcript: 'true',
    limit: '50',
  };
  if (daysBack) {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();
    params.created_after = since;
    log(`Fetching meetings from last ${daysBack} day(s) (after ${since})`);
  } else {
    log('Fetching all meetings with transcripts');
  }

  let cursor = null;
  let total = 0;
  let saved = 0;

  do {
    if (cursor) params.cursor = cursor;
    const data = await fathomGet(apiKey, '/meetings', params);
    const items = data.items || [];
    log(`Page: ${items.length} meeting(s)`);

    for (const meeting of items) {
      total++;
      const date = new Date(meeting.created_at).toISOString().split('T')[0];
      const filename = `${date}_${meeting.recording_id}_${slug(meeting.title)}.txt`;
      const filepath = path.join(OUTPUT_DIR, filename);

      if (fs.existsSync(filepath)) {
        log(`  SKIP (exists): ${filename}`);
        continue;
      }

      const content = formatTranscript(meeting);
      fs.writeFileSync(filepath, content, 'utf8');
      log(`  SAVED: ${filename}`);
      saved++;
    }

    cursor = data.next_cursor || null;
  } while (cursor);

  log(`Done. ${total} meeting(s) checked, ${saved} new transcript(s) saved to ${OUTPUT_DIR}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
