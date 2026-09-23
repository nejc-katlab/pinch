import '../lib/parser.js';
import '../lib/convert.js';
import '../lib/extractor.js';
import '../lib/markdown.js';

const RC = globalThis.RC;
let failures = 0;

function eq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok   ${label}`);
  }
}

const p = RC.parseIngredient;

eq(p('2 cups all-purpose flour').qty, 2, 'qty: whole number');
eq(p('2 cups all-purpose flour').unit, 'cup', 'unit: cups');
eq(p('2 cups all-purpose flour').item, 'all-purpose flour', 'item text');
eq(p('1 1/2 tsp vanilla extract').qty, 1.5, 'qty: mixed fraction');
eq(p('½ cup milk').qty, 0.5, 'qty: unicode fraction');
eq(p('1½ cups sugar').qty, 1.5, 'qty: attached unicode fraction');
eq(p('1 and 1/4 cups chocolate chips').qty, 1.25, 'qty: "X and Y/Z" spelling');
eq(p('1-1/2 tsp steak seasoning').qty, 1.5, 'qty: hyphenated mixed number');
eq(p('1-1/2 tsp steak seasoning').qtyMax, null, 'qty: hyphenated mixed number is not a range');
eq(p('2-3/4 cups flour').qty, 2.75, 'qty: hyphenated mixed number 2-3/4');
eq(p('1-2 tbsp olive oil').qtyMax, 2, 'qty: integer range still parses');

const dirty = '{"@type":"Recipe","name":"Bad\n\tJSON","recipeIngredient":["1 cup flour"],"recipeInstructions":"Mix."}';
const lenient = RC.parseJsonLenient(dirty);
eq(lenient !== null, true, 'lenient JSON: control chars recovered');
eq(RC.extractFromJson(lenient).ingredients, ['1 cup flour'], 'lenient JSON: recipe extracted');

const labeled = RC.extractFromJson({ '@type': 'Recipe', name: 'X', recipeIngredient: ['1 cup flour'], recipeYield: 'Servings: 12 to 16' });
eq(labeled.servings, '12 to 16', 'yield: label prefix stripped');
eq(RC.scaleYield(labeled.servings, 2), '24 to 32', 'yield: stripped label scales cleanly');
eq(p('1-2 tbsp olive oil').qtyMax, 2, 'qty range: dash');
eq(p('1 to 2 cloves garlic').qtyMax, 2, 'qty range: to');
eq(p('3 large eggs').unit, null, 'no unit');
eq(p('3 large eggs').item, 'large eggs', 'no-unit item');
eq(p('1 cup of warm water').item, 'warm water', 'strips "of"');
eq(p('salt to taste').qty, null, 'unparseable qty');
eq(p('8 oz cream cheese').unit, 'oz', 'unit: oz');
eq(p('2 lbs chicken thighs').unit, 'lb', 'unit: lbs');
eq(p('1 fl oz lemon juice').unit, 'floz', 'unit: two-word fl oz');
eq(p('250 g butter').unit, 'g', 'unit: grams');
eq(p('0.5 l water').unit, 'l', 'unit: liter');

const r = (raw, system, factor = 1) => RC.renderIngredient(p(raw), { system, factor });

eq(r('2 cups all-purpose flour', 'metric'), '240 g all-purpose flour', 'metric: flour by density');
eq(r('1 cup milk', 'metric'), '240 ml milk', 'metric: liquid to ml');
eq(r('8 oz cream cheese', 'metric'), '225 g cream cheese', 'metric: oz to g');
eq(r('2 lbs chicken thighs', 'metric'), '905 g chicken thighs', 'metric: lb to g');
eq(r('1 stick butter', 'metric'), '113 g butter', 'metric: stick of butter');
eq(r('1 cup chopped leeks', 'metric'), '1 cup chopped leeks', 'metric: unknown solid unchanged');
eq(r('1 cup chopped onion', 'metric'), '160 g chopped onion', 'metric: chopped onion now in table');
eq(r('2 tbsp soy sauce', 'metric'), '2 tbsp soy sauce', 'metric: spoons unchanged');
eq(r('2 cups all-purpose flour', 'original'), '2 cups all-purpose flour', 'original: unchanged');
eq(r('2 cups all-purpose flour', 'original', 2), '4 cups all-purpose flour', 'scale 2x imperial');
eq(r('2 cups all-purpose flour', 'metric', 0.5), '120 g all-purpose flour', 'scale 0.5x metric');
eq(r('1 cup milk', 'original', 0.5), '½ cup milk', 'scale to fraction display');
eq(r('3 large eggs', 'original', 2), '6 large eggs', 'scale unitless');
eq(r('250 g butter', 'original', 0.5), '125 g butter', 'scale metric input');
eq(r('3/4 cup sugar', 'original', 0.25), '3 tbsp sugar', 'step-down: sub-quarter cup becomes tbsp');
eq(r('2 tbsp olive oil', 'original', 1 / 3), '2 tsp olive oil', 'step-down: sub-tbsp becomes tsp');
eq(r('1/4 cup milk', 'original', 1), '¼ cup milk', 'step-down: exactly quarter cup stays');
eq(r('1 pinch salt', 'original', 0.25), '1 pinch salt', 'pinch floors at 1');
eq(r('4 large eggs', 'original', 0.25), '1 large egg', 'count noun: singularize at 1');
eq(r('1 large egg, at room temperature', 'original', 2), '2 large eggs, at room temperature', 'count noun: pluralize before comma');
eq(r('1 ripe banana (mashed)', 'original', 3), '3 ripe bananas (mashed)', 'count noun: pluralize before parenthesis');
eq(r('2 tomatoes', 'original', 0.5), '1 tomato', 'count noun: -oes singular');
eq(r('1 cherry', 'original', 2), '2 cherries', 'count noun: -y plural');
eq(r('1 (400g) can chopped tomatoes', 'original', 2), '2 (400g) cans chopped tomatoes', 'count noun: skips leading parenthetical');
eq(r('3 large eggs', 'original', 2), '6 large eggs', 'count noun: untouched when not crossing 1');
eq(r('2 cans chopped tomatoes', 'original', 0.5), '1 can chopped tomatoes', 'count noun: leading container singularized');
eq(r('1 bunch cilantro', 'original', 2), '2 bunches cilantro', 'count noun: -ch container plural');
eq(r('1 bag frozen peas', 'original', 3), '3 bags frozen peas', 'count noun: container keeps plural contents');

eq(RC.convertTemps('Bake at 350°F for 20 minutes.', 'metric'), 'Bake at 175°C for 20 minutes.', 'temp: 350F');
eq(RC.convertTemps('Preheat oven to 425 degrees F.', 'metric'), 'Preheat oven to 220°C.', 'temp: degrees F');
eq(RC.convertTemps('Bake at 350°F.', 'original'), 'Bake at 350°F.', 'temp: original untouched');
eq(RC.convertTemps('Bake at 350-375°F for 20 minutes.', 'metric'), 'Bake at 175–190°C for 20 minutes.', 'temp range: dash converts both ends');
eq(RC.convertTemps('Bake at 350 to 375 degrees F.', 'metric'), 'Bake at 175 to 190°C.', 'temp range: "to" converts both ends');
eq(RC.convertTemps('Roast at 400°F–425°F until golden.', 'metric'), 'Roast at 205–220°C until golden.', 'temp range: both ends marked');
eq(RC.convertTemps('Preheat oven to 350°F (177°C).', 'metric'), 'Preheat oven to 175°C (177°C).', 'temp: existing celsius untouched');
eq(RC.convertTemps('Bake 20-25 minutes at 350°F.', 'metric'), 'Bake 20-25 minutes at 175°C.', 'temp: minute range not treated as temperature');

eq(r('1 cup rice vinegar', 'metric'), '240 ml rice vinegar', 'metric: rice vinegar is liquid, not rice');
eq(r('1 cup condensed milk', 'metric'), '305 g condensed milk', 'metric: condensed milk by density, not liquid');
eq(r('1 cup milk powder', 'metric'), '130 g milk powder', 'metric: milk powder by density, not liquid');
eq(r('1 cup almond flour', 'metric'), '96 g almond flour', 'metric: almond flour density');
eq(r('1/2 cup applesauce', 'metric'), '120 g applesauce', 'metric: applesauce vs sauce-liquid');
eq(r('2 cups chicken broth', 'metric'), '480 ml chicken broth', 'metric: broth liquid');
eq(r('1 cup steel-cut oats', 'metric'), '175 g steel-cut oats', 'metric: steel-cut beats plain oats');
eq(r('1 cup greek yogurt', 'metric'), '285 g greek yogurt', 'metric: greek yogurt beats yogurt');

eq(RC.parseDuration('PT1H30M'), 90, 'duration: 1h30m');
eq(RC.parseDuration('PT45M'), 45, 'duration: 45m');
eq(RC.parseDuration('PT2H'), 120, 'duration: 2h');

eq(RC.scaleYield('4 servings', 2), '8 servings', 'yield scaling');
eq(RC.scaleYield('10-12 people', 2), '20-24 people', 'yield: range scales both ends');
eq(RC.scaleYield('10-12 people', 3), '30-36 people', 'yield: range at 3x');
eq(RC.scaleYield('10-12 people', 0.5), '5-6 people', 'yield: range at half');
eq(RC.scaleYield('1 9-inch pie', 2), '2 9-inch pie', 'yield: pan size not scaled');
eq(RC.scaleYield('one 9x13 pan', 2), 'one 9x13 pan', 'yield: pan dimensions not scaled');
eq(RC.scaleYield('2 dozen', 2), '4 dozen', 'yield: dozen count scales');
eq(RC.scaleYield('1 9x13 inch pan', 0.5), '½× (1 9x13 inch pan)', 'yield: fractional pan keeps original with factor');
eq(RC.scaleYield('2 loaves', 0.5), '1 loaves', 'yield: whole vessel count still scales');
eq(RC.scaleYield('3 servings', 0.5), '1.5 servings', 'yield: servings may be fractional');
eq(RC.parseDuration('PT0M'), null, 'duration: zero is treated as missing');
eq(RC.extractFromJson({ '@type': 'Recipe', name: 'X', recipeIngredient: ['1 cup flour'], url: 'javascript:alert(1)' }).source, null, 'source: non-http url rejected');
eq(RC.extractFromJson({ '@type': 'Recipe', name: 'X', recipeIngredient: ['1 cup flour'], url: ' https://example.com/a ' }).source, 'https://example.com/a', 'source: http url trimmed and kept');
eq(RC.toMarkdown({ name: 'X', ingredients: [], steps: [], source: 'https://example.com/a_(b)' }, { system: 'original', factor: 1 }).includes('[Source](https://example.com/a_%28b%29)'), true, 'md: parentheses in source url encoded');

const sb = (ings, f) => RC.scaleBlockers(ings, f).map(b => b.raw);
eq(sb(['250 g flour', '1 cup milk', '2 tbsp oil', '1 pinch salt'], 1 / 4), [], 'blockers: all measurable -> none');
eq(sb(['1 tsp vanilla'], 1 / 3), ['1 tsp vanilla'], 'blockers: third of a teaspoon is not a spoon');
eq(sb(['1/2 tsp salt'], 1 / 4), [], 'blockers: eighth teaspoon is a spoon');
eq(sb(['1/4 tsp salt'], 1 / 3), ['1/4 tsp salt'], 'blockers: twelfth teaspoon blocked');
eq(sb(['1 tbsp oil'], 1 / 4), [], 'blockers: quarter tbsp = 3/4 tsp ok');
eq(sb(['1 cup milk'], 1 / 3), [], 'blockers: third cup is a cup measure');
eq(sb(['1/2 cup milk'], 1 / 3), [], 'blockers: sixth cup = 2 tbsp + 2 tsp ok');
eq(sb(['2 g salt'], 1 / 4), ['2 g salt'], 'blockers: half a gram not weighable');
eq(sb(['40 g salt'], 1 / 4), [], 'blockers: 10 g fine');
eq(sb(['1 cup flour'], 1 / 3, 'metric'), [], 'blockers: metric mode weighs flour -> ok');
eq(sb(['1 tsp vanilla'], 1 / 3, 'metric'), ['1 tsp vanilla'], 'blockers: metric mode still spoons for tsp');
eq(r('1/2 cup milk', 'original', 1 / 3), '2 tbsp + 2 tsp milk', 'render: odd tbsp decomposes into tsp');
eq(r('1 1/2 tbsp butter', 'original', 1), '1½ tbsp butter', 'render: half tbsp stays');
eq(r('1 tbsp oil', 'original', 1 / 4), '¾ tsp oil', 'render: quarter tbsp as tsp');
eq(sb(['4 large eggs', '200 g sugar'], 1 / 4), [], 'blockers: 4 eggs at quarter -> 1 egg ok');
eq(sb(['4 large eggs', '200 g sugar'], 1 / 3), ['4 large eggs'], 'blockers: 4 eggs at third blocked');
eq(sb(['3 large eggs'], 1 / 3), [], 'blockers: 3 eggs at third -> 1 egg ok');
eq(sb(['1 large egg'], 1 / 2), ['1 large egg'], 'blockers: single egg at half blocked');
eq(sb(['2 cloves garlic'], 1 / 2), [], 'blockers: 2 cloves at half ok');
eq(sb(['1 clove garlic'], 1 / 2), ['1 clove garlic'], 'blockers: 1 clove at half blocked');
eq(sb(['1 (400g) can chopped tomatoes'], 1 / 2), ['1 (400g) can chopped tomatoes'], 'blockers: one can at half blocked');
eq(sb(['salt to taste', 'juice of 1 lemon'], 1 / 4), [], 'blockers: unquantified lines never block');
eq(sb(['1 large egg'], 2), [], 'blockers: multiplying never blocks');
eq(RC.scaleBlockers(['3 large eggs'], 1 / 2)[0].scaled, 1.5, 'blockers: reports the fractional result');

const recipe = {
  name: 'Test Cookies',
  ingredients: ['2 cups flour', '1 cup milk', '3 large eggs'],
  steps: ['Preheat oven to 350°F.', 'Mix and bake.'],
  prep: 15,
  cook: 30,
  total: 45,
  servings: '12 cookies',
  nutrition: { calories: 270, fat: 13, carbs: 34, protein: 4, servingSize: '1 cookie' },
  source: 'https://example.com/cookies'
};
const md = RC.toMarkdown(recipe, { system: 'metric', factor: 2 });
eq(md.includes('# Test Cookies'), true, 'md: title');
eq(md.includes('**Yield:** 24 cookies'), true, 'md: scaled yield');
eq(md.includes('- [ ] 480 g flour'), true, 'md: converted+scaled ingredient');
eq(md.includes('1. Preheat oven to 175°C.'), true, 'md: converted step');
eq(md.includes('[Source](https://example.com/cookies)'), true, 'md: source link');
eq(md.includes('**Per serving (1 cookie):** 270 kcal · 13 g fat · 34 g carbs · 4 g protein'), true, 'md: nutrition line');

const grouped = { ...recipe, groups: [{ name: null, start: 0, count: 1 }, { name: 'Cream', start: 1, count: 2 }] };
const gmd = RC.toMarkdown(grouped, { system: 'original', factor: 1 });
eq(gmd.includes('**Cream**'), true, 'md: group header rendered');
eq(gmd.indexOf('2 cups flour') < gmd.indexOf('**Cream**'), true, 'md: unnamed group precedes header');
eq(gmd.indexOf('**Cream**') < gmd.indexOf('1 cup milk'), true, 'md: header precedes its items');
eq(RC.nutritionParts(null), [], 'nutrition: null safe');

let collisionFailures = 0;
for (const [pattern, value] of RC.cupTable) {
  const winner = RC.lookupCup(`some ${pattern} here`);
  if (winner !== value) {
    collisionFailures++;
    failures++;
    console.error(`FAIL collision: "${pattern}" resolves to ${JSON.stringify(winner)} instead of ${JSON.stringify(value)}`);
  }
}
console.log(`ok   collision suite: ${RC.cupTable.length - collisionFailures}/${RC.cupTable.length} table entries win their own lookup`);

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll tests passed');
