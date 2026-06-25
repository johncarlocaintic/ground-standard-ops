import { readFileSync, writeFileSync } from 'fs';

const input = process.argv[2];
const output = process.argv[3];
const raw = readFileSync(input, 'utf8');

const lines = raw.split('\n');
const cleaned = [];
const stack = [];
let blockCounter = 0;

for (const line of lines) {
  const trimmed = line.trim();

  if (trimmed.includes('{')) {
    stack.push({ id: blockCounter++, seen: new Set() });
  }

  if (trimmed.startsWith('__zIndex') && stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.seen.has('__zIndex')) continue;
    frame.seen.add('__zIndex');
  }

  cleaned.push(line);

  if (trimmed.includes('}') && stack.length > 0) {
    stack.pop();
  }
}

writeFileSync(output, cleaned.join('\n'), 'utf8');
console.log(`Stripped. Output: ${output}`);
