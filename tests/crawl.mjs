import '../lib/parser.js';
import '../lib/convert.js';
import '../lib/extractor.js';

const RC = globalThis.RC;

const SITES = [
  'https://sallysbakingaddiction.com',
  'https://www.budgetbytes.com',
  'https://www.recipetineats.com',
  'https://pinchofyum.com',
  'https://www.gimmesomeoven.com',
  'https://cookieandkate.com',
  'https://www.loveandlemons.com',
  'https://smittenkitchen.com',
  'https://www.halfbakedharvest.com',
  'https://minimalistbaker.com',
  'https://www.ambitiouskitchen.com',
  'https://www.wellplated.com',
  'https://damndelicious.net',
  'https://www.skinnytaste.com',
  'https://www.101cookbooks.com',
  'https://www.davidlebovitz.com'
];

const PER_SITE = parseInt(process.argv[2] || '5', 10);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const VOL_ML = { cup: 240, floz: 30, pint: 473, quart: 946, gallon: 3785 };

async function get(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal, redirect: 'follow' });
    return res.ok ? await res.text() : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
}

async function discover(site) {
  for (const path of ['/sitemap_index.xml', '/sitemap.xml', '/wp-sitemap.xml']) {
    const xml = await get(site + path);
    if (!xml || !xml.includes('<loc>')) continue;
    let urls = locs(xml);
    const subs = urls.filter(u => /\.xml/.test(u) && /post|recipe|page-?\d|posts-post/i.test(u));
    if (subs.length) {
      urls = [];
      for (const sub of subs.slice(0, 5)) {
        const subXml = await get(sub);
        if (subXml) urls.push(...locs(subXml));
      }
    }
    const pages = urls.filter(u =>
      !/\.(xml|jpg|jpeg|png|webp|pdf)$/i.test(u) &&
      !/\/(category|tag|author|about|contact|shop|privacy)\//i.test(u) &&
      u.replace(/\/$/, '').split('/').length > 3);
    if (pages.length) {
      const sample = [];
      const pool = [...pages];
      while (sample.length < PER_SITE && pool.length) {
        sample.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      return sample;
    }
  }
  return [];
}

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

const issues = [];
function issue(type, url, detail) {
  issues.push({ type, url, detail });
}

function amountValue(s) {
  const metric = String(s).match(/^(\d+(?:\.\d+)?)(?:–\d+(?:\.\d+)?)?\s*(g|kg|ml|l)\b/);
  if (metric) {
    const mult = metric[2] === 'kg' || metric[2] === 'l' ? 1000 : 1;
    return parseFloat(metric[1]) * mult;
  }
  const m = String(s).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function checkLine(url, raw) {
  let p;
  try {
    p = RC.parseIngredient(raw);
  } catch (e) {
    return issue('parse-crash', url, `${raw} :: ${e.message}`);
  }
  let one, two;
  try {
    one = RC.renderIngredientParts(p, { system: 'metric', factor: 1 });
    two = RC.renderIngredientParts(p, { system: 'metric', factor: 2 });
  } catch (e) {
    return issue('convert-crash', url, `${raw} :: ${e.message}`);
  }
  if (p.qty != null && (p.qty <= 0 || p.qty > 1000)) issue('absurd-qty', url, `${p.qty} :: ${raw}`);
  if (p.qty != null && p.qtyMax != null && p.qtyMax < p.qty) issue('inverted-range', url, raw);
  const gm = one.amount.match(/^(\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\s*g$/);
  if (gm && p.unit && VOL_ML[p.unit]) {
    const gPerCup = parseFloat(gm[1]) * 240 / (p.qty * VOL_ML[p.unit]);
    if (gPerCup < 20 || gPerCup > 400) {
      issue('implausible-density', url, `${gPerCup.toFixed(0)} g/cup :: ${raw} -> ${one.amount}`);
    }
    if (/\b(vinegar|juice|broth|stock|wine|beer|coffee)\b/i.test(one.item)) {
      issue('liquid-as-grams', url, `${raw} -> ${one.amount}`);
    }
  }
  const a = amountValue(one.amount);
  const b = amountValue(two.amount);
  if (a != null && b != null && a > 0 && Math.abs(b - 2 * a) > Math.max(10, 0.12 * 2 * a)) {
    issue('bad-scaling', url, `${raw} :: 1x=${one.amount} 2x=${two.amount}`);
  }
}

const stats = { fetched: 0, blocked: 0, recipes: 0, skipped: 0, lines: 0 };

async function processSite(site) {
  const urls = await discover(site);
  if (!urls.length) {
    console.log(`✗ ${site} — sitemap unavailable/blocked`);
    return;
  }
  let siteRecipes = 0;
  for (const url of urls) {
    await new Promise(r => setTimeout(r, 400));
    const html = await get(url);
    stats.fetched++;
    if (!html) { stats.blocked++; continue; }
    const recipe = recipeFromHtml(html);
    if (!recipe) {
      if (/"@type"\s*:\s*"?\[?[^\]"]*Recipe/i.test(html)) issue('extract-fail', url, 'Recipe JSON-LD present but extractor returned null');
      else stats.skipped++;
      continue;
    }
    stats.recipes++;
    siteRecipes++;
    for (const raw of recipe.ingredients) {
      stats.lines++;
      checkLine(url, raw);
    }
    for (const step of recipe.steps) {
      try {
        const converted = RC.convertTemps(step, 'metric');
        if (/\d{2,3}\s*(?:°\s*|degrees?\s+)F\b/i.test(converted)) {
          issue('missed-temp', url, converted.slice(0, 100));
        }
      } catch (e) {
        issue('temp-crash', url, e.message);
      }
    }
  }
  console.log(`✓ ${site} — ${urls.length} pages, ${siteRecipes} recipes`);
}

await Promise.all(SITES.map(processSite));
const { fetched, blocked, recipes, skipped, lines } = stats;

console.log(`\n${'─'.repeat(60)}`);
console.log(`pages fetched: ${fetched} (blocked/failed: ${blocked}, non-recipe: ${skipped})`);
console.log(`recipes exercised: ${recipes}, ingredient lines: ${lines}`);
console.log(`issues: ${issues.length}`);
const byType = {};
for (const i of issues) (byType[i.type] = byType[i.type] || []).push(i);
for (const [type, list] of Object.entries(byType)) {
  console.log(`\n== ${type} (${list.length}) ==`);
  for (const i of list.slice(0, 15)) console.log(`  ${i.detail}\n    ${i.url}`);
}
if (Object.keys(byType).some(t => t.endsWith('crash') || t === 'extract-fail')) process.exit(1);
