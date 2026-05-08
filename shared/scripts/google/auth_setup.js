// One-time OAuth setup for Google Calendar API.
// Run this once to obtain a refresh token, then paste the token into .env as GOOGLE_REFRESH_TOKEN.
//
// Usage (from repo root):
//   node --env-file=.env shared/scripts/google/auth_setup.js

import http from 'node:http';
import { URL } from 'node:url';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'google_test.log');

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const value = process.env[key];
  if (!value) {
    log(`FATAL: Missing env var ${key}`);
    process.exit(1);
  }
  return value;
}

const CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
const CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/calendar';

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Token endpoint returned non-JSON: ${text}`);
  }
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }
  return data;
}

function openBrowser(url) {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) log(`Could not auto-open browser. Paste this into your browser manually:\n${url}`);
  });
}

async function main() {
  log('Starting Google OAuth setup…');
  log(`Listening on ${REDIRECT_URI}`);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT_URI);
    if (url.pathname !== '/') {
      res.writeHead(404); res.end(); return;
    }
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h2>OAuth error: ${error}</h2><p>Check the terminal.</p>`);
      log(`OAuth error: ${error}`);
      server.close();
      process.exit(1);
    }
    if (!code) {
      res.writeHead(400); res.end('Missing ?code param'); return;
    }

    try {
      const tokens = await exchangeCode(code);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>✓ Auth complete.</h2><p>You can close this tab and return to the terminal.</p>');

      log('Success. Tokens received.');
      log(`Access token (expires in ${tokens.expires_in}s): ${tokens.access_token.slice(0, 20)}…`);

      if (!tokens.refresh_token) {
        log('WARNING: No refresh_token returned. This usually means you have already authorized this client before.');
        log('Fix: go to https://myaccount.google.com/permissions, revoke "JC Calendar Scripts", then rerun this script.');
      } else {
        log('');
        log('===== COPY THIS INTO .env =====');
        log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        log('===============================');
      }
      server.close();
      setTimeout(() => process.exit(0), 500);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h2>Exchange failed</h2><pre>${err.message}</pre>`);
      log(`FATAL: ${err.message}`);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    log(`Opening browser for consent…`);
    openBrowser(authUrl.toString());
    log(`If the browser did not open, paste this URL manually:\n${authUrl.toString()}`);
  });
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
