const token = process.env.GHL_VACAVILLE_API_TOKEN;
const loc   = process.env.GHL_VACAVILLE_LOCATION_ID;
const KDL_ADULT = 'eP72M7eCi37bpN7Shg2a';
const KDL_KIDS  = '5BZ9V5do89DR1sKxXfrM';

const r = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${loc}`, {
  headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
});
const j = await r.json();
const list = j.calendars || [];

console.log(`Total GHL calendars at Vacaville: ${list.length}`);
list.forEach(c => console.log(`  id=${c.id}  name="${c.name}"`));

const adult = list.find(c => c.id === KDL_ADULT);
const kids  = list.find(c => c.id === KDL_KIDS);

console.log('');
console.log(`KDL Adult (${KDL_ADULT}): ${adult ? `OK - "${adult.name}"` : 'NOT FOUND in GHL'}`);
console.log(`KDL Kids  (${KDL_KIDS}):  ${kids  ? `OK - "${kids.name}"` : 'NOT FOUND in GHL'}`);
