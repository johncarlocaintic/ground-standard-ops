import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';

const SRC = 'shared/scripts/closebot/personas/ombjj';
const DST = 'shared/scripts/closebot/personas/sugoi';
mkdirSync(DST, { recursive: true });

// Order matters: longer/more-specific strings first.
const subs = [
  ['OM Brazilian Jiu-Jitsu and Judo', 'Sugoi Submissions'],
  ['OM Brazilian Jiu-Jitsu & Judo', 'Sugoi Submissions'],
  ['OM Brazilian Jiu Jitsu', 'Sugoi Submissions'],
  ['OM BJJ', 'Sugoi Submissions'],
  ['Adult Brazilian Jiu-Jitsu & Judo', 'Adult Fundamentals BJJ'],
  ['Adult NoGi Brazilian Jiu-Jitsu', 'Adult Fundamentals BJJ'],
  ['Adult No-Gi Brazilian Jiu-Jitsu', 'Adult Fundamentals BJJ'],
  ['Kids 4-9 BJJ', 'Kids 4-8 Fundamentals Jiu-Jitsu'],
  ['Teens 10-15 BJJ', 'Teens 9-15 Fundamentals Jiu-Jitsu'],
  ['Kids 4-9', 'Kids 4-8'],
  ['Teens 10-15', 'Teens 9-15'],
  ['ages 4-9', 'ages 4-8'],
  ['ages 4 to 9', 'ages 4 to 8'],
  ['10-15', '9-15'],
  ['10 to 15', '9 to 15'],
  ['4-9', '4-8'],
  ['(631) 327-8094', '(361) 336-0859'],
  ['631-327-8094', '361-336-0859'],
  ['6313278094', '3613360859'],
  // OM non-bookable programs -> Sugoi non-bookable programs
  ['Jeet Kune Do', "Women's Only Jiu-Jitsu"],
  ['JKD Striking', 'Open Mat'],
  ['JKD/Striking', 'Open Mat'],
  ['JKD', 'Open Mat'],
  ['Striking', 'Wrestling'],
  ['Judo', 'No-Gi'],
  ['Private lessons', 'Mat Mobility'],
  ['private lesson', 'Mat Mobility session'],
  ['"ombjj_', '"sugoi_'],
  ['ombjj_', 'sugoi_'],
];

let n = 0;
for (const f of readdirSync(SRC).filter(x => x.endsWith('.json'))) {
  let txt = readFileSync(`${SRC}/${f}`, 'utf8');
  for (const [a, b] of subs) txt = txt.split(a).join(b);
  // adult_nogi has no Sugoi analogue (single discipline) -> repurpose as adult_inquisitive
  let outName = f;
  if (f === 'adult_nogi.json') {
    outName = 'adult_inquisitive.json';
    txt = txt.split('"sugoi_adult_nogi"').join('"sugoi_adult_inquisitive"');
  }
  // sanity: must still be valid JSON
  JSON.parse(txt);
  writeFileSync(`${DST}/${outName}`, txt);
  n++;
  console.log(`  ${f} -> ${outName}`);
}
console.log(`Cloned ${n} personas to ${DST}`);
