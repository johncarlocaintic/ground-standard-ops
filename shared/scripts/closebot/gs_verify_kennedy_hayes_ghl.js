/**
 * Verify the test contact "Kennedy Hayes" was actually written to Vacaville GHL
 * with all 5 fields populated (first_name, last_name, email, phone, DOB).
 *
 * Lookup by email: tester.hayes.sujj@donotuse.com
 *
 * Closes the phone-bug verification: if phone field is populated → bug fixed.
 * If phone is blank or missing despite update_contact returning success → bug still live.
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
if (!TOKEN || !LOC) { console.error('Missing GHL_VACAVILLE_* env vars'); process.exit(1); }

const EMAIL = 'tester.hayes.sujj@donotuse.com';
const H = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

(async () => {
  // GHL V2 contact search by email
  const url = `https://services.leadconnectorhq.com/contacts/search?locationId=${LOC}`;
  const body = {
    locationId: LOC,
    query: EMAIL,
    pageLimit: 5,
  };
  const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { console.log('NON-JSON:', t.slice(0, 500)); process.exit(1); }

  if (!r.ok) {
    console.log(`Search failed: ${r.status}`);
    console.log(JSON.stringify(j, null, 2).slice(0, 800));
    process.exit(1);
  }

  const contacts = j.contacts || j.data || [];
  console.log(`=== GHL contact search for ${EMAIL} ===`);
  console.log(`Matches: ${contacts.length}`);

  if (contacts.length === 0) {
    console.log('\n❌ NO CONTACT FOUND. The bot never created the contact in Vacaville GHL.');
    console.log('   This would mean update_contact silently failed at a step before today\'s ones too.');
    process.exit(0);
  }

  for (const c of contacts) {
    console.log('\n---');
    console.log(`id:           ${c.id}`);
    console.log(`firstName:    ${c.firstName || c.firstNameLowerCase || '(blank)'}`);
    console.log(`lastName:     ${c.lastName || c.lastNameLowerCase || '(blank)'}`);
    console.log(`email:        ${c.email || '(blank)'}`);
    console.log(`phone:        ${c.phone || '(blank)'}     ← phone bug check`);
    console.log(`dateOfBirth:  ${c.dateOfBirth || '(blank)'}`);
    console.log(`tags:         ${(c.tags || []).join(', ') || '(none)'}`);
    console.log(`dateAdded:    ${c.dateAdded || ''}`);
    console.log(`source:       ${c.source || ''}`);

    console.log('\n=== VERDICT ===');
    const phoneOk = !!c.phone && c.phone.trim().length > 0;
    const firstOk = !!c.firstName;
    const lastOk = !!c.lastName;
    const emailOk = !!c.email;
    const dobOk = !!c.dateOfBirth;
    console.log(`first_name:    ${firstOk ? '✅' : '❌'} ${c.firstName || ''}`);
    console.log(`last_name:     ${lastOk ? '✅' : '❌'} ${c.lastName || ''}`);
    console.log(`email:         ${emailOk ? '✅' : '❌'} ${c.email || ''}`);
    console.log(`phone:         ${phoneOk ? '✅' : '❌'} ${c.phone || '(BLANK — phone bug still live)'}`);
    console.log(`date_of_birth: ${dobOk ? '✅' : '❌'} ${c.dateOfBirth || ''}`);

    if (phoneOk) {
      console.log('\n🎉 Phone bug appears RESOLVED. update_contact actually wrote phone to GHL.');
    } else {
      console.log('\n⚠️  Phone bug STILL LIVE. Tool reported success but GHL phone field is blank.');
    }
  }
})();
