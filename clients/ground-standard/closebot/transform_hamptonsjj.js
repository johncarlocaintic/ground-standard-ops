// Transform Mason Dixon clean KDL → Hamptons JJ raw KDL
// Run: node transform_hamptonsjj.js
import { readFileSync, writeFileSync } from 'fs';

let kdl = readFileSync('clients/ground-standard/closebot/masondixon-bot-clean.kdl', 'utf8');

// 1. conversationReason — full replace
kdl = kdl.replace(
  /conversationReason "You are part of the front desk team named Emma who works for Mason Dixon Jiu-Jitsu\. Your goal is to help new leads learn about our martial arts programs and book a free trial class\. Never quote membership pricing — redirect all pricing questions to the instructor consultation after the trial\. When the booking tool is active, do not list or recite available class times — let the booking calendar show available slots\."/,
  `conversationReason "You are part of the front desk team named Emma who works for Hamptons Jiu-Jitsu. Your goal is to help new leads learn about our martial arts programs and book a free trial class. Never quote membership pricing — redirect all pricing questions to the coach or staff when they come in. If a contact's date of birth shows they are between 13 and 17 years old and they are booking without a parent present, collect their name, DOB, and a parent or guardian's name and phone number. Then say: 'Our team will reach out to get your trial scheduled — just have a parent or guardian available when they call.' Do not ask for a parent date of birth. Do not proceed to booking."`
);

// 2. businessInformation
kdl = kdl.replace(
  /businessInformation "The company name is Mason Dixon Jiu-Jitsu\."/,
  `businessInformation "The company name is Hamptons Jiu-Jitsu."`
);

// 3. Gym name in intro prompt
kdl = kdl.replace(
  /Prompt "Give a short introduction of Mason Dixon Jiu-Jitsu then ask for their name\."/,
  `Prompt "Give a short introduction of Hamptons Jiu-Jitsu then ask for their name."`
);

// 4. Adult BJJ calendar (Mason Dixon: "Adult Fundamentals BJJ" → "Adult BJJ")
kdl = kdl.replace(/CalendarName "Adult Fundamentals BJJ"/g, 'CalendarName "Adult BJJ"');
kdl = kdl.replace(/Title "Booking Adult BJJ"/g, 'Title "Booking Adult BJJ"');  // stays same

// 5. Adult Striking calendar → Adult Muay Thai
kdl = kdl.replace(/CalendarName "Adult Striking"/g, 'CalendarName "Adult Muay Thai"');
kdl = kdl.replace(/Title "Booking Adult Striking"/g, 'Title "Booking Adult Muay Thai"');
kdl = kdl.replace(
  /Description "Book a free trial Muay Thai \/ striking class for the contact"/g,
  'Description "Book a free trial Muay Thai / striking class for the contact"'
);

// 6. Kids 4-7 calendar
kdl = kdl.replace(/CalendarName "Kids 4-7 Martial Arts"/g, 'CalendarName "Kids 4-7 BJJ"');

// 7. Kids 8-13 calendar → Kids 8-12
kdl = kdl.replace(/CalendarName "Kids 8-13 Martial Arts"/g, 'CalendarName "Kids 8-12 BJJ"');

// 8. Age range case names: 8 to 13 → 8 to 12
kdl = kdl.replace(/CaseName "Age range 8 to 13 years old"/g, 'CaseName "Age range 8 to 12 years old"');

// 9. Kids class prompt descriptions
kdl = kdl.replace(
  /Prompt "There are two kids martial arts classes: \\"Kids 4-7 Martial Arts\\" for kids ages 4 to 7 years old, and \\"Kids 8-13 Martial Arts\\" for kids ages 8 to 13 years old\.\\n"/g,
  `Prompt "There are two kids BJJ classes: \\"Kids 4-7 BJJ\\" for kids ages 4 to 7 years old, and \\"Kids 8-12 BJJ\\" for kids ages 8 to 12 years old.\\n"`
);

// 10. Discipline switch prompt (ask about BJJ or Muay Thai)
kdl = kdl.replace(
  /Prompt "Ask \{\{contact\.first_name\}\} which program they are most interested in — our BJJ\/Jiu-Jitsu classes or our Muay Thai Striking classes\."/g,
  `Prompt "Ask {{contact.first_name}} which program they are most interested in — our Adult BJJ classes or our Muay Thai classes (which also include Judo, Wrestling, and MMA)."`
);

// 11. Discipline switch description
kdl = kdl.replace(
  /Description "Is the contact interested in BJJ \/ grappling \/ no-gi jiu-jitsu or in Striking \/ Muay Thai"/g,
  'Description "Is the contact interested in BJJ / grappling / jiu-jitsu or in Muay Thai / striking / MMA / judo / wrestling"'
);

// 12. Discipline switch case name for striking → include judo/wrestling/MMA
kdl = kdl.replace(
  /CaseName "Striking or Muay Thai or kickboxing or MMA"/g,
  'CaseName "Muay Thai or striking or MMA or judo or wrestling or kickboxing"'
);

// 13. Booking Adult BJJ title stays correct, just verify descriptions reference "BJJ"
// No change needed — already says "Book a free trial class for..."

// 14. Any remaining "Mason Dixon" references in node descriptions/titles
kdl = kdl.replace(/Mason Dixon Jiu-Jitsu/g, 'Hamptons Jiu-Jitsu');
kdl = kdl.replace(/Mason Dixon/g, 'Hamptons JJ');

writeFileSync('clients/ground-standard/closebot/hamptonsjj-bot-raw.kdl', kdl, 'utf8');
console.log('Written: hamptonsjj-bot-raw.kdl');

// Sanity check for remaining placeholders
const placeholders = [...kdl.matchAll(/\[PLACEHOLDER[^\]]*\]|\[CALENDAR[^\]]*\]|\[GYM[^\]]*\]/g)];
if (placeholders.length > 0) {
  console.error('REMAINING PLACEHOLDERS:', placeholders.map(m => m[0]));
} else {
  console.log('No placeholders remaining.');
}
