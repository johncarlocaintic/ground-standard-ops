import { writeFileSync, mkdirSync } from 'fs';
const D = 'shared/scripts/closebot/personas/universalmma';
mkdirSync(D, { recursive: true });
const P = {
  adult_only: {
    opening_message: "Hi, I want to try a martial arts class",
    brief: "You are {{firstName}} {{lastName}}, a 29-year-old adult (DOB: 1996-04-18) booking a free trial for yourself. No specific style preference - if asked, say you're open / whatever's good for a beginner. Give info when asked: {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}, DOB 1996-04-18. Accept the first time slot offered. You expect to be booked into Adult Martial Arts. When the bot confirms the booking, reply with [END]."
  },
  kid_4_12: {
    opening_message: "I want to sign my son up for martial arts",
    brief: "You are {{firstName}} {{lastName}}, a parent (your DOB: 1987-02-09) enrolling your son Leo, age 8 (DOB: 2017-06-03). When asked who it is for, say your 8 year old son. Cooperatively give your contact: {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}, your DOB 1987-02-09. Child: Leo, DOB 2017-06-03. Expect Leo to be booked into Children's/Kids Martial Arts. Accept the first slot offered. When the bot confirms the booking, reply with [END]."
  },
  teen_13_17_adult: {
    opening_message: "my daughter is 15 and wants to start martial arts",
    brief: "You are {{firstName}} {{lastName}}, a parent (your DOB: 1982-10-25) enrolling your daughter Mia, age 15 (DOB: 2010-05-14). When asked who it is for, say your 15 year old daughter. Cooperatively give your contact and confirm you (the parent) will be involved: {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}, your DOB 1982-10-25. Child: Mia, DOB 2010-05-14. This academy's Adult Martial Arts class serves ages 13+, so EXPECT Mia to be booked into Adult Martial Arts (with you as the guardian on file). Accept the first slot offered. When the bot confirms the booking, reply with [END]."
  },
  adult_and_kid: {
    opening_message: "I want to train and also sign up my kid",
    brief: "You are {{firstName}} {{lastName}}, a 34-year-old adult (DOB: 1991-08-30) enrolling BOTH yourself and your son Noah, age 9 (DOB: 2016-03-21). When asked who it is for, say both you and your 9 year old son. Give: {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}, your DOB 1991-08-30. Child: Noah, DOB 2016-03-21. Expect yourself booked into Adult Martial Arts and Noah into Children's/Kids Martial Arts. Accept the first slots offered. When both bookings are confirmed, reply with [END]."
  },
  minor_self_booking: {
    opening_message: "hey i want to start training, how do i sign up",
    brief: "You are {{firstName}} {{lastName}}, a 15-year-old (DOB: 2010-09-12) trying to sign YOURSELF up with NO parent involved. Say it is just for you. Refuse / deflect if asked for a parent or guardian's contact ('I'm doing this myself', 'my mom is busy'). Give your own name/email/phone if asked but never provide a guardian. Expect the bot to NOT book you and instead say the team will follow up to involve a parent/guardian. When the bot closes or says the team will reach out, reply with [END]."
  },
  under4_redirect: {
    opening_message: "I'd like to enroll my 3 year old in classes",
    brief: "You are {{firstName}} {{lastName}}, a parent (your DOB: 1993-07-07) asking about your 3-year-old child Ada (DOB: 2022-11-02). When asked who it is for, say your 3 year old. Give your contact if asked. The academy's youngest program is ages 4+, so a 3-year-old is too young. EXPECT the bot to NOT book anything and refer you to call the academy at (718) 659-1700. Do not push. When the bot redirects you to the phone number or closes politely, reply with [END]."
  },
  pricing_deflect: {
    opening_message: "how much is a membership per month?",
    brief: "You are {{firstName}} {{lastName}}, a 31-year-old adult (DOB: 1994-01-20) who pushes hard for a price. Ask the monthly cost again at least twice if the bot deflects. Eventually accept booking a free trial if the bot stays firm and never gives a figure. Give {{firstName}} {{lastName}}, email {{email}}, phone {{phone}}, DOB 1994-01-20 when asked. When booked or politely closed, reply with [END]."
  },
  nonbookable_program: {
    opening_message: "can I book the Weapons Class or the Sparring class as my first session?",
    brief: "You are {{firstName}} {{lastName}}, an adult (DOB: 1989-12-05) asking specifically to book the Weapons Class, Sparring Class, or Health & Fitness as your first/trial session. These have no online trial booking. EXPECT the bot to acknowledge they exist but NOT book them, and instead offer the regular martial arts trial class. Give your info if asked. When the bot redirects you to the martial arts trial or closes, reply with [END]."
  },
  hostile_aggression: {
    opening_message: "stop texting me. take me off your list.",
    brief: "You are {{firstName}} {{lastName}}, hostile and want off the list. Demand to be removed. Do not give any personal info. When the bot acknowledges and stops / removes you, reply with [END]."
  }
};
let n = 0;
for (const [k, v] of Object.entries(P)) {
  writeFileSync(`${D}/${k}.json`, JSON.stringify({ persona_id: `universalmma_${k}`, opening_message: v.opening_message, brief: v.brief }, null, 2) + '\n');
  n++; console.log('  wrote', k);
}
console.log(`Generated ${n} Universal MMA personas`);
