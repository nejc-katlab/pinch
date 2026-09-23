import '../lib/parser.js';
import '../lib/convert.js';
import '../lib/extractor.js';

const RC = globalThis.RC;

const DEFAULT_URLS = [
  'https://sallysbakingaddiction.com/chocolate-chip-cookies/',
  'https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/',
  'https://www.budgetbytes.com/dragon-noodles/',
  'https://www.recipetineats.com/carbonara/',
  'https://minimalistbaker.com/easy-1-pot-lentil-dal/'
];

const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_URLS;

function recipeFromHtml(html) {
  const blocks = html.matchAll(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, block] of blocks) {
    const data = RC.parseJsonLenient(block.trim());
    if (!data) continue;
    const recipe = RC.extractFromJson(data);
    if (recipe) return recipe;
  }
  return null;
}

let pages = 0;
let found = 0;
let totalLines = 0;
let parsedLines = 0;
let convertedLines = 0;
const suspicious = [];

for (const url of urls) {
  pages++;
  let html;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' }
    });
    html = await res.text();
  } catch (e) {
    console.log(`\n✗ ${url}\n  fetch failed: ${e.message}`);
    continue;
  }
  const recipe = recipeFromHtml(html);
  if (!recipe) {
    console.log(`\n✗ ${url}\n  no recipe JSON-LD found`);
    continue;
  }
  found++;
  console.log(`\n✓ ${recipe.name}  (${url})`);
  for (const line of recipe.ingredients) {
    totalLines++;
    const p = RC.parseIngredient(line);
    const original = RC.renderIngredient(p, { system: 'original', factor: 1 });
    const metric = RC.renderIngredient(p, { system: 'metric', factor: 1 });
    if (p.qty != null) parsedLines++;
    const changed = metric !== original;
    if (changed) convertedLines++;
    const marker = p.qty == null ? '?' : changed ? '→' : '=';
    console.log(`  ${marker} ${line}`);
    if (changed) console.log(`      ${metric}`);
    if (changed && /\b(vinegar|juice|broth|stock|wine|beer)\b/i.test(p.item) && / g /.test(` ${metric} `)) {
      suspicious.push({ line, metric });
    }
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`pages: ${pages}, recipes extracted: ${found}`);
console.log(`ingredient lines: ${totalLines}, quantity parsed: ${parsedLines}, converted: ${convertedLines}`);
if (suspicious.length) {
  console.log(`\nSUSPICIOUS (liquid-word item converted to grams):`);
  for (const s of suspicious) console.log(`  ${s.line}\n    → ${s.metric}`);
  process.exit(1);
}
