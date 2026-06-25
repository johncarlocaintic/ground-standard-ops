import { readFileSync, writeFileSync, readdirSync } from 'fs';
const D = 'shared/scripts/closebot/personas/raylongo';

// 1. Force persona_id to match filename (sweep grep depends on raylongo_<file>)
for (const f of readdirSync(D).filter(x => x.endsWith('.json'))) {
  const id = 'raylongo_' + f.replace(/\.json$/, '');
  const j = JSON.parse(readFileSync(`${D}/${f}`, 'utf8'));
  j.persona_id = id;
  writeFileSync(`${D}/${f}`, JSON.stringify(j, null, 2) + '\n');
}

// 2. Correct expectation bugs from bulk substitution
const teen = JSON.parse(readFileSync(`${D}/teen_13_17_nocal.json`, 'utf8'));
teen.opening_message = 'my daughter is 15 and wants to start training';
teen.brief = "You are {{firstName}} {{lastName}}, a parent (your own DOB: 1983-12-02) enrolling only your daughter Ava, age 15 (DOB: 2010-08-20). When asked who it is for, say 'my teenage daughter'. Cooperatively give your own contact when asked: {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}, your DOB 1983-12-02. Child: Ava, DOB 2010-08-20. Ray Longo's has NO online class for ages 13-17 (youth ends at 12, adults are 18+). EXPECT the bot to NOT book any class and instead say the team will follow up to get Ava set up. Do not push to be booked. When the bot says the team will reach out / closes politely, reply with [END].";
writeFileSync(`${D}/teen_13_17_nocal.json`, JSON.stringify(teen, null, 2) + '\n');

const u4 = JSON.parse(readFileSync(`${D}/under4_redirect.json`, 'utf8'));
u4.opening_message = 'I want to sign my 3 year old up for classes';
u4.brief = "You are {{firstName}} {{lastName}}, a parent (your own DOB: 1990-03-15) asking about your 3-year-old child Sam (DOB: 2022-09-01). When asked who it is for, say your 3 year old. Give your contact if asked: {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}. Ray Longo's youngest program is Youth 4-6, so a 3-year-old is too young. EXPECT the bot to NOT book anything and refer you to call the gym at (516) 900-9042. Do not push. When the bot redirects you to the phone number or closes politely, reply with [END].";
writeFileSync(`${D}/under4_redirect.json`, JSON.stringify(u4, null, 2) + '\n');

console.log('Fixed persona_ids + teen_13_17_nocal + under4_redirect expectations');
for (const f of readdirSync(D).filter(x => x.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(`${D}/${f}`, 'utf8'));
  console.log(`  ${f} :: ${j.persona_id}`);
}
