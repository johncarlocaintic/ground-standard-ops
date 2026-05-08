// Phase 1B — GoHighLevel (GHL) API Test
// Script: shared/scripts/ghl/test_create_contact.js
//
// What this does:
//   1. Creates a test contact in the specified GHL location (sandbox)
//   2. Retrieves the contact to confirm creation
//   3. Logs the contactId
//
// Run with:
//   node --env-file=../../../.env test_create_contact.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'ghl_test.log');

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.error(`ERROR: ${key} is not set. Make sure you run with --env-file=.env`);
    process.exit(1);
  }
  return value;
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function ghlRequest(method, endpoint, body = null) {
  const token = getEnv('GHL_AGENCY_API_TOKEN');
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': API_VERSION,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
  };
  
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${method} ${endpoint}: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
  }
  
  return data;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure log directory exists
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const locationId = getEnv('GHL_AGENCY_LOCATION_ID');

  log('=== Phase 1B — GHL API Test Starting ===');
  log(`Using Location ID: ${locationId}`);

  // Step 1: Create a test contact
  log('Step 1: Creating a test contact...');
  const newContactPayload = {
    locationId: locationId,
    firstName: 'Test-API',
    lastName: 'DoNotUse',
    email: `test-api-${Date.now()}@propertybots.ai`,
    tags: ['test api do not use'],
  };

  const createResponse = await ghlRequest('POST', '/contacts/', newContactPayload);
  const contactId = createResponse.contact.id;
  
  log(`Step 1 SUCCESS: Contact created — ID: ${contactId}`);

  // Step 2: Retrieve the contact to confirm
  log('Step 2: Retrieving contact to confirm...');
  const getResponse = await ghlRequest('GET', `/contacts/${contactId}`);
  
  const retrievedContact = getResponse.contact;
  log(`Step 2 SUCCESS: Verified contact exists — Name: ${retrievedContact.firstName} ${retrievedContact.lastName}, Email: ${retrievedContact.email}`);

  // Step 3: Write summary log
  const summary = {
    timestamp: new Date().toISOString(),
    location_id: locationId,
    contact_id: contactId,
    contact_email: retrievedContact.email,
    status: 'CREATED — SAFE TO DELETE IN GHL DASHBOARD'
  };

  log('=== SUMMARY ===');
  log(`contact_id: ${summary.contact_id}`);
  log(`Log file:   ${LOG_FILE}`);
  log('=== Phase 1B Complete ===');

  fs.appendFileSync(LOG_FILE, '\nSUMMARY JSON:\n' + JSON.stringify(summary, null, 2) + '\n');
}

main().catch((err) => {
  const msg = `FATAL ERROR: ${err.message}`;
  console.error(msg);
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (_) {}
  process.exit(1);
});
