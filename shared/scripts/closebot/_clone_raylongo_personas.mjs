import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const SRC = 'shared/scripts/closebot/personas/hammersports';
const DST = 'shared/scripts/closebot/personas/raylongo';
mkdirSync(DST, { recursive: true });

// Per-file: [srcFile, dstFile, [ [find,replace], ... ]]
const gymSubs = [
  ['Hammer Sports & Performance', "Ray Longo's MMA"],
  ['Hammer Sports', "Ray Longo's MMA"],
  ['Hammer', "Ray Longo's MMA"],
  ['(732) 795-5626', '(516) 900-9042'],
  ['732-795-5626', '516-900-9042'],
  ['"hammersports_', '"raylongo_'],
  ['hammersports_', 'raylongo_'],
];
const jobs = [
  ['adult_bjj_default.json', 'adult_mma_default.json', [['Brazilian Jiu-Jitsu', 'Mixed Martial Arts'], ['BJJ', 'MMA'], ['jiu-jitsu', 'MMA'], ['jiujitsu', 'MMA']]],
  ['adult_nogi.json', 'adult_kickboxing.json', [['No-Gi Brazilian Jiu-Jitsu', 'Kickboxing'], ['No-Gi', 'Kickboxing'], ['no-gi', 'kickboxing'], ['nogi', 'kickboxing']]],
  ['adult_muay_thai.json', 'adult_bjj.json', [['Muay Thai (Kickboxing)', 'Brazilian Jiu-Jitsu'], ['Muay Thai', 'Brazilian Jiu-Jitsu'], ['muay thai', 'Brazilian Jiu-Jitsu'], ['kickboxing', 'jiu-jitsu']]],
  ['adult_wrestling.json', 'adult_nogi.json', [['Wrestling', 'No-Gi Brazilian Jiu-Jitsu'], ['wrestling', 'no-gi jiu-jitsu']]],
  ['adult_kettlebell.json', 'adult_boxing.json', [['Kettle Bell Workout', 'Boxing'], ['Kettlebell', 'Boxing'], ['kettlebell', 'boxing'], ['conditioning', 'boxing']]],
  ['kid_youth.json', 'kid_4_6.json', [['Youth Martial Arts', 'Youth 4-6 Martial Arts'], ['5-12', '4-6'], ['5 to 12', '4 to 6'], ['2015-06-10', '2019-08-12']]],
  ['kid_youth.json', 'kid_7_12.json', [['Youth Martial Arts', 'Youth 7-12 Martial Arts'], ['5-12', '7-12'], ['5 to 12', '7 to 12'], ['2015-06-10', '2016-04-22'], ['"raylongo_kid_youth"', '"raylongo_kid_7_12"']]],
  ['teen.json', 'teen_13_17_nocal.json', [['Teen Martial Arts', 'no teen calendar'], ['13-17', '13-17']]],
  ['adult_and_kid.json', 'adult_and_kid.json', [['Brazilian Jiu-Jitsu', 'Mixed Martial Arts'], ['Youth Martial Arts', 'Youth 7-12 Martial Arts'], ['5-12', '7-12']]],
  ['minor_self_booking.json', 'minor_self_booking.json', []],
  ['under5_redirect.json', 'under4_redirect.json', [['under 5', 'under 4'], ['under-5', 'under-4'], ['5 years', '4 years'], ['age 5', 'age 4'], ['"raylongo_under5_redirect"', '"raylongo_under4_redirect"']]],
  ['pricing_deflect.json', 'pricing_deflect.json', []],
  ['nonbookable_mma.json', 'nonbookable_program.json', [['"raylongo_nonbookable_mma"', '"raylongo_nonbookable_program"']]],
  ['hostile_aggression.json', 'hostile_aggression.json', []],
];
let n = 0;
for (const [src, dst, subs] of jobs) {
  let txt = readFileSync(`${SRC}/${src}`, 'utf8');
  for (const [a, b] of subs) txt = txt.split(a).join(b);
  for (const [a, b] of gymSubs) txt = txt.split(a).join(b);
  JSON.parse(txt); // validate
  writeFileSync(`${DST}/${dst}`, txt);
  n++; console.log(`  ${src} -> ${dst}`);
}
console.log(`Cloned ${n} Ray Longo personas`);
