import { writeFileSync } from 'fs';
const K = process.env.CB_GS_API_KEY;
const r = await fetch('https://api.closebot.com/library/files/file_WSF3D54UJ6PGSX7M', { headers: { 'X-CB-KEY': K } });
const j = await r.json();
const c = await fetch(j.uri);
const txt = await c.text();
writeFileSync('clients/ground-standard/closebot/_sugoi-legacy-kb-REFERENCE.txt', txt);
console.log('Saved', txt.length, 'chars to _sugoi-legacy-kb-REFERENCE.txt');
