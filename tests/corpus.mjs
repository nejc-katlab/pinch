import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import '../lib/parser.js';
import '../lib/convert.js';

const RC = globalThis.RC;
const dir = path.dirname(url.fileURLToPath(import.meta.url));
const corpus = JSON.parse(fs.readFileSync(path.join(dir, 'corpus.json'), 'utf8'));

let failures = 0;
let parsed = 0;
let converted = 0;

for (const entry of corpus) {
  const p = RC.parseIngredient(entry.line);
  const original = RC.renderIngredient(p, { system: 'original', factor: 1 });
  const metric = RC.renderIngredient(p, { system: 'metric', factor: 1 });
  if (p.qty != null) parsed++;
  if (metric !== original) converted++;
  if (entry.metric != null && metric !== entry.metric) {
    failures++;
    console.error(`FAIL ${entry.line}\n  expected: ${entry.metric}\n  actual:   ${metric}`);
  }
}

const pct = n => `${Math.round(n / corpus.length * 100)}%`;
console.log(`corpus: ${corpus.length} lines`);
console.log(`  quantity parsed: ${parsed} (${pct(parsed)})`);
console.log(`  metric-converted: ${converted} (${pct(converted)})`);
console.log(`  golden expectations: ${corpus.filter(e => e.metric != null).length}, failures: ${failures}`);

if (failures) process.exit(1);
console.log('\nCorpus passed');
