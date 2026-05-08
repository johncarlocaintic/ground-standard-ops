// Pull CloseBot's nodeDescriptors to learn canonical tool names + see if Reference Documents / LibraryContext is still a real tool.
const KEY = process.env.CB_GS_API_KEY;
const res = await fetch('https://api.closebot.com/bot/nodeDescriptors', {
  headers: { 'X-CB-KEY': KEY, 'Accept': 'application/json' },
});
const text = await res.text();
console.log(`Status: ${res.status}, body length: ${text.length}`);
console.log('First 500 chars:');
console.log(text.slice(0, 500));
import('fs').then(({ default: fs }) => {
  fs.writeFileSync('shared/logs/node_descriptors_raw.txt', text);
  console.log('\nWrote shared/logs/node_descriptors_raw.txt');
});
