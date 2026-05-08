// Shared Google API client helpers. Refresh-token based auth.
// Usage from other scripts in this folder:
//   import { getAccessToken, gcal } from './_client.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'google_test.log');

export function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

export function getEnv(key) {
  const value = process.env[key];
  if (!value) {
    log(`FATAL: Missing env var ${key}`);
    process.exit(1);
  }
  return value;
}

let cachedToken = null;
let cachedExpiresAt = 0;

export async function getAccessToken() {
  if (cachedToken && Date.now() < cachedExpiresAt - 30_000) return cachedToken;

  const body = new URLSearchParams({
    client_id: getEnv('GOOGLE_CLIENT_ID'),
    client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
    refresh_token: getEnv('GOOGLE_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Token refresh returned non-JSON: ${text}`); }
  if (!response.ok) throw new Error(`Token refresh failed (${response.status}): ${text}`);

  cachedToken = data.access_token;
  cachedExpiresAt = Date.now() + (data.expires_in * 1000);
  return cachedToken;
}

// Thin wrapper around the Google Calendar REST API.
// path: e.g. '/calendars/primary/events'
// opts.query: object of query params
// opts.method, opts.body: passed through
export async function gcal(pathSegment, opts = {}) {
  const token = await getAccessToken();
  const url = new URL(`https://www.googleapis.com/calendar/v3${pathSegment}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }
  }
  const response = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`Calendar API returned non-JSON: ${text}`); }
  if (!response.ok) throw new Error(`Calendar API ${response.status}: ${text}`);
  return data;
}
