(function (root) {
  const VOL_ML = { cup: 240, tbsp: 15, tsp: 5, floz: 30, pint: 473, quart: 946, gallon: 3785 };

  const LIQUID = 'liquid';

  const CUP_TABLE = [
    ['all-purpose flour', 120], ['all purpose flour', 120], ['bread flour', 127],
    ['cake flour', 114], ['pastry flour', 106], ['whole wheat flour', 120],
    ['wholemeal flour', 120], ['rye flour', 106], ['almond flour', 96],
    ['coconut flour', 112], ['oat flour', 92], ['rice flour', 158],
    ['buckwheat flour', 120], ['self-rising flour', 113], ['self raising flour', 113],
    ['spelt flour', 102], ['chickpea flour', 92], ['tapioca flour', 122],
    ['semolina', 163], ['cornmeal', 138], ['polenta', 156], ['flour', 120],
    ['powdered sugar', 120], ['confectioners sugar', 120], ["confectioner's sugar", 120],
    ['icing sugar', 120], ['brown sugar', 213], ['caster sugar', 200],
    ['granulated sugar', 200], ['demerara sugar', 220], ['turbinado sugar', 180],
    ['coconut sugar', 154], ['sugar', 200],
    ['honey', 340], ['maple syrup', 322], ['molasses', 337], ['golden syrup', 340],
    ['corn syrup', 328], ['agave', 336], ['jam', 320], ['marmalade', 320],
    ['nutella', 296], ['tahini', 256], ['peanut butter', 258], ['almond butter', 256],
    ['cashew butter', 256], ['cookie butter', 296],
    ['butter', 227], ['margarine', 227], ['shortening', 205], ['lard', 205],
    ['coconut oil', 218], ['ghee', 218],
    ['greek yogurt', 285], ['yogurt', 245], ['sour cream', 230], ['cream cheese', 232],
    ['ricotta', 246], ['cottage cheese', 226], ['mascarpone', 225],
    ['condensed milk', 306], ['evaporated milk', 252], ['milk powder', 128],
    ['powdered milk', 128], ['creme fraiche', 240],
    ['parmesan', 100], ['pecorino', 100], ['cheddar', 113], ['mozzarella', 112],
    ['gruyere', 108], ['feta', 150], ['shredded cheese', 113], ['grated cheese', 100],
    ['sliced almonds', 92], ['slivered almonds', 108], ['ground almonds', 96],
    ['almonds', 143], ['walnuts', 117], ['pecans', 109], ['cashews', 137],
    ['peanuts', 146], ['pistachios', 123], ['hazelnuts', 135], ['pine nuts', 135],
    ['macadamia', 134], ['sunflower seeds', 140], ['pumpkin seeds', 129],
    ['sesame seeds', 144], ['chia seeds', 163], ['flaxseed', 150], ['flax seed', 150],
    ['poppy seeds', 145], ['hemp seeds', 160],
    ['steel-cut oats', 176], ['steel cut oats', 176], ['rolled oats', 90], ['oats', 90],
    ['oatmeal', 90], ['granola', 122], ['muesli', 100],
    ['arborio rice', 200], ['basmati rice', 180], ['brown rice', 190],
    ['jasmine rice', 185], ['wild rice', 160], ['rice', 185],
    ['quinoa', 170], ['couscous', 173], ['bulgur', 140], ['millet', 200],
    ['barley', 200], ['farro', 188], ['lentils', 192], ['split peas', 197],
    ['breadcrumbs', 108], ['bread crumbs', 108], ['panko', 60], ['cracker crumbs', 100],
    ['graham cracker crumbs', 100], ['crushed cornflakes', 28],
    ['cocoa', 85], ['cacao', 85], ['chocolate chips', 170], ['chocolate chunks', 170],
    ['white chocolate chips', 170], ['chopped chocolate', 168], ['carob', 103],
    ['espresso powder', 90], ['ground coffee', 82], ['matcha', 100],
    ['cornstarch', 120], ['corn starch', 120], ['arrowroot', 128], ['potato starch', 160],
    ['raisins', 145], ['sultanas', 145], ['currants', 144], ['dried cranberries', 120],
    ['dates', 147], ['dried apricots', 130], ['dried figs', 149], ['prunes', 161],
    ['shredded coconut', 93], ['desiccated coconut', 85], ['coconut flakes', 74],
    ['blueberries', 148], ['raspberries', 123], ['blackberries', 144],
    ['strawberries', 166], ['cherries', 154], ['cranberries', 100],
    ['mashed banana', 225], ['banana', 150], ['applesauce', 244], ['apple sauce', 244],
    ['pumpkin puree', 245], ['mashed potato', 210], ['mashed avocado', 230],
    ['tomato paste', 262], ['tomato sauce', 245], ['crushed tomatoes', 242],
    ['diced tomatoes', 180], ['salsa', 259], ['pesto', 232], ['hummus', 246],
    ['mayonnaise', 220], ['ketchup', 274], ['mustard', 249],
    ['sourdough starter', 240], ['pizza sauce', 250], ['lemon curd', 320],
    ['shredded carrot', 110], ['parsley', 60],
    ['chopped onion', 160], ['diced onion', 160], ['chopped celery', 101],
    ['grated carrot', 110], ['chopped carrot', 128], ['chopped bell pepper', 149],
    ['sliced mushrooms', 70], ['chopped mushrooms', 87], ['corn kernels', 165],
    ['peas', 145], ['shredded cabbage', 89], ['grated zucchini', 124],
    ['chopped spinach', 30], ['baby spinach', 30], ['chopped kale', 67],
    ['rice vinegar', LIQUID], ['wine vinegar', LIQUID], ['apple cider vinegar', LIQUID],
    ['balsamic vinegar', LIQUID], ['vinegar', LIQUID],
    ['water', LIQUID], ['milk', LIQUID], ['cream', LIQUID], ['buttermilk', LIQUID],
    ['oil', LIQUID], ['broth', LIQUID], ['stock', LIQUID], ['juice', LIQUID],
    ['wine', LIQUID], ['beer', LIQUID], ['cider', LIQUID], ['sauce', LIQUID],
    ['coffee', LIQUID], ['espresso', LIQUID], ['tea', LIQUID], ['extract', LIQUID],
    ['liqueur', LIQUID], ['rum', LIQUID], ['brandy', LIQUID], ['whiskey', LIQUID],
    ['bourbon', LIQUID], ['vodka', LIQUID], ['sherry', LIQUID], ['mirin', LIQUID],
    ['coconut water', LIQUID], ['kefir', LIQUID], ['eggnog', LIQUID]
  ];

  const MATCHERS = CUP_TABLE
    .map(([pattern, value]) => {
      const words = pattern.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:e?s)?');
      const body = words.join("(?:\\s+[\\w'-]+){0,2}?\\s+");
      return { re: new RegExp(`\\b${body}\\b`, 'i'), value, pattern, length: pattern.length };
    })
    .sort((a, b) => b.length - a.length);

  function lookupCupDetail(item) {
    let cleaned = String(item).replace(/\//g, ' ');
    for (let i = 0; i < 3 && cleaned.includes('('); i++) {
      cleaned = cleaned.replace(/\([^()]*\)/g, ' ');
    }
    for (const m of MATCHERS) {
      if (m.re.test(cleaned)) return { pattern: m.pattern, value: m.value };
    }
    return null;
  }

  function lookupCup(item) {
    const match = lookupCupDetail(item);
    return match ? match.value : null;
  }

  function roundG(g) {
    if (g < 10) return Math.round(g * 10) / 10;
    if (g < 100) return Math.round(g);
    return Math.round(g / 5) * 5;
  }

  function roundMl(ml) {
    if (ml < 15) return Math.round(ml);
    return Math.round(ml / 5) * 5;
  }

  function toMetric(qty, unit, item) {
    if (qty == null || !unit) return null;
    if (unit === 'oz') return { qty: roundG(qty * 28.35), unit: 'g' };
    if (unit === 'lb') {
      const g = qty * 453.6;
      return g >= 1000
        ? { qty: Math.round(g / 100) / 10, unit: 'kg' }
        : { qty: roundG(g), unit: 'g' };
    }
    if (unit === 'stick' && item.toLowerCase().includes('butter')) {
      return { qty: Math.round(qty * 113), unit: 'g' };
    }
    if (VOL_ML[unit] && unit !== 'tbsp' && unit !== 'tsp') {
      const ml = qty * VOL_ML[unit];
      const match = lookupCup(item);
      if (typeof match === 'number') return { qty: roundG(match * ml / 240), unit: 'g' };
      if (match === LIQUID) {
        return ml >= 1000
          ? { qty: Math.round(ml / 10) / 100, unit: 'l' }
          : { qty: roundMl(ml), unit: 'ml' };
      }
    }
    return null;
  }

  const LABELS = {
    cup: ['cup', 'cups'], tbsp: ['tbsp', 'tbsp'], tsp: ['tsp', 'tsp'],
    floz: ['fl oz', 'fl oz'], oz: ['oz', 'oz'], lb: ['lb', 'lb'],
    g: ['g', 'g'], kg: ['kg', 'kg'], ml: ['ml', 'ml'], l: ['l', 'l'],
    pint: ['pint', 'pints'], quart: ['quart', 'quarts'], gallon: ['gallon', 'gallons'],
    stick: ['stick', 'sticks'], pinch: ['pinch', 'pinches'], dash: ['dash', 'dashes'],
    clove: ['clove', 'cloves'], can: ['can', 'cans'], package: ['package', 'packages'],
    slice: ['slice', 'slices'], piece: ['piece', 'pieces'], bunch: ['bunch', 'bunches'],
    sprig: ['sprig', 'sprigs'], head: ['head', 'heads'], stalk: ['stalk', 'stalks'],
    handful: ['handful', 'handfuls']
  };

  function unitLabel(unit, qty) {
    const pair = LABELS[unit] || [unit, unit];
    return qty > 1 ? pair[1] : pair[0];
  }

  function metricAmount(qty, qtyMax, unit, item) {
    const m = toMetric(qty, unit, item);
    if (!m) return null;
    if (qtyMax != null) {
      const mMax = toMetric(qtyMax, unit, item);
      if (mMax && mMax.unit === m.unit) return `${m.qty}–${mMax.qty} ${m.unit}`;
    }
    return `${m.qty} ${m.unit}`;
  }

  function annotateAlternatives(item, qty, qtyMax, unit, mainText) {
    return item.replace(/\(([^()]*)\)/g, (full, content) => {
      if (!/^[,\s]*(?:or|sub(?:stitute)?)\b/i.test(content)) return full;
      for (const m of MATCHERS) {
        const hit = m.re.exec(content);
        if (!hit) continue;
        const alt = metricAmount(qty, qtyMax, unit, content);
        if (!alt || alt === mainText) return full;
        return `(${content.slice(0, hit.index)}${alt} ${content.slice(hit.index)})`;
      }
      return full;
    });
  }

  const TASTE_UNITS = new Set(['pinch', 'dash']);

  function stepDown(qty, qtyMax, unit) {
    const both = (mult, next) => stepDown(qty * mult, qtyMax != null ? qtyMax * mult : null, next);
    if (unit === 'cup' && qty < 0.25 - 1e-9) return both(16, 'tbsp');
    if (unit === 'tbsp' && qty < 1 - 1e-9) return both(3, 'tsp');
    return { qty, qtyMax, unit };
  }

  function pluralizeWord(w) {
    if (/(?:s|x|z|ch|sh)$/i.test(w)) return w + 'es';
    if (/[^aeiou]y$/i.test(w)) return w.slice(0, -1) + 'ies';
    if (/[^aeiou]o$/i.test(w)) return w + 'es';
    return w + 's';
  }

  function singularizeWord(w) {
    if (/(?:ss|us|is)$/i.test(w)) return w;
    if (/ies$/i.test(w)) return w.slice(0, -3) + 'y';
    if (/(?:ches|shes|sses|xes|zes|oes)$/i.test(w)) return w.slice(0, -2);
    if (/s$/i.test(w)) return w.slice(0, -1);
    return w;
  }

  const CONTAINER_WORDS = new Set(['can', 'jar', 'package', 'packet', 'bag', 'box', 'bottle', 'block', 'tub', 'bunch', 'head', 'clove', 'stalk', 'sprig', 'slice', 'piece', 'stick', 'sheet', 'loaf', 'ear', 'rack']);

  function adjustCountNoun(item, from, to) {
    const crossesUp = from === 1 && to > 1;
    const crossesDown = from > 1 && to === 1;
    if (!crossesUp && !crossesDown) return item;
    const lead = item.match(/^\([^)]*\)\s*/);
    const prefix = lead ? lead[0] : '';
    const body = item.slice(prefix.length);
    const first = body.match(/^([A-Za-z]+)(\s.*)?$/);
    if (first && CONTAINER_WORDS.has(singularizeWord(first[1]).toLowerCase())) {
      const word = crossesUp ? pluralizeWord(singularizeWord(first[1])) : singularizeWord(first[1]);
      return `${prefix}${word}${first[2] || ''}`;
    }
    const m = body.match(/^([^,(]*?)([A-Za-z]+)(\s*(?:[,(].*)?)$/);
    if (!m) return item;
    if (crossesUp && /s$/i.test(m[2])) return item;
    const word = crossesUp ? pluralizeWord(m[2]) : singularizeWord(m[2]);
    return `${prefix}${m[1]}${word}${m[3]}`;
  }

  function renderIngredientParts(parsed, opts) {
    const { system, factor } = opts;
    if (parsed.qty == null) return { amount: '', item: parsed.item || parsed.raw };
    let qty = parsed.qty * factor;
    let qtyMax = parsed.qtyMax != null ? parsed.qtyMax * factor : null;
    let unit = parsed.unit;
    let item = parsed.item;
    const isMetricUnit = unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'l';
    if (system === 'metric' && !isMetricUnit) {
      const main = metricAmount(qty, qtyMax, unit, item);
      item = annotateAlternatives(item, qty, qtyMax, unit, main);
      if (main) return { amount: main, item };
    }
    if (isMetricUnit) {
      qty = roundG(qty);
      if (qtyMax != null) qtyMax = roundG(qtyMax);
    } else if (unit) {
      ({ qty, qtyMax, unit } = stepDown(qty, qtyMax, unit));
      if (TASTE_UNITS.has(unit) && qty < 1) qty = 1;
      if (unit === 'tbsp' && qtyMax == null) {
        const whole = Math.floor(qty + 1e-9);
        const frac = qty - whole;
        if (frac > 1e-9 && Math.abs(frac - 0.5) > 1e-9 && spoonRepresentable(frac * 3)) {
          return { amount: `${whole} tbsp + ${root.RC.formatQty(frac * 3)} tsp`, item };
        }
      }
    } else if (qtyMax == null) {
      item = adjustCountNoun(item, parsed.qty, qty);
    }
    const fmt = isMetricUnit ? String : root.RC.formatQty;
    const range = qtyMax != null ? `${fmt(qty)}–${fmt(qtyMax)}` : fmt(qty);
    const label = unit ? ` ${unitLabel(unit, qtyMax || qty)}` : '';
    return { amount: `${range}${label}`, item };
  }

  function renderIngredient(parsed, opts) {
    const parts = renderIngredientParts(parsed, opts);
    return `${parts.amount} ${parts.item}`.trim();
  }

  function toCelsius(f) {
    return Math.round((parseFloat(f) - 32) * 5 / 9 / 5) * 5;
  }

  function convertTemps(text, system) {
    if (system !== 'metric') return text;
    return text
      .replace(/(\d{2,3})\s*(?:°\s*F?|degrees?(?:\s+F(?:ahrenheit)?)?)?\s*(-|–|—|to)\s*(\d{2,3})\s*(?:°\s*|degrees?\s+)?F(?:ahrenheit)?\b/gi,
        (full, f1, sep, f2) => {
          if (parseFloat(f1) < 90) return `${f1} ${sep} ${toCelsius(f2)}°C`.replace(/ (-|–|—) /, '$1');
          const joiner = sep.toLowerCase() === 'to' ? ' to ' : '–';
          return `${toCelsius(f1)}${joiner}${toCelsius(f2)}°C`;
        })
      .replace(/(\d{2,3})\s*(?:°\s*|degrees?\s+)?F(?:ahrenheit)?\b/gi, (_, f) => `${toCelsius(f)}°C`);
  }

  const TSP_PER = { tsp: 1, tbsp: 3, cup: 48, floz: 6, pint: 96, quart: 192, gallon: 768, stick: 24 };
  const GRAMS_PER = { g: 1, kg: 1000, ml: 1, l: 1000, oz: 28.35, lb: 453.6 };

  function spoonRepresentable(tsp) {
    return tsp >= 0.125 - 1e-9 && Math.abs(tsp * 8 - Math.round(tsp * 8)) < 1e-6;
  }

  function isWhole(n) {
    return Math.abs(n - Math.round(n)) < 1e-9 && n >= 1 - 1e-9;
  }

  function scaleBlockers(ingredients, factor, system = 'original') {
    const blockers = [];
    for (const raw of ingredients) {
      const p = root.RC.parseIngredient(raw);
      if (p.qty == null) continue;
      const unit = p.unit;
      if (unit && TASTE_UNITS.has(unit)) continue;
      const scaled = p.qty * factor;
      let ok;
      if (unit && GRAMS_PER[unit]) {
        ok = scaled * GRAMS_PER[unit] >= 1 - 1e-9;
      } else if (unit && TSP_PER[unit]) {
        const m = system === 'metric' ? toMetric(scaled, unit, p.item) : null;
        ok = m ? m.qty >= 1 : spoonRepresentable(scaled * TSP_PER[unit]);
      } else {
        ok = isWhole(scaled);
      }
      if (!ok) blockers.push({ raw, scaled: Math.round(scaled * 100) / 100 });
    }
    return blockers;
  }

  const VESSEL = /\b(?:pans?|dish(?:es)?|tins?|loa(?:f|ves)|pies?|cakes?|tarts?|skillets?|sheets?|trays?|bundts?|rings?|molds?|rounds?|quiches?|galettes?)\b/i;

  function scaleYield(yieldText, factor) {
    if (!yieldText || factor === 1) return yieldText;
    const text = String(yieldText);
    const scaled = scaleYieldNumbers(text, factor);
    if (VESSEL.test(text) && /\d\.\d/.test(scaled.replace(/\d+x\d+/gi, ''))) {
      return `${root.RC.formatQty(factor)}× (${text})`;
    }
    return scaled;
  }

  function scaleYieldNumbers(text, factor) {
    return text.replace(/\d+(?:[.,]\d+)?/g, (n, offset) => {
      const after = text.slice(offset + n.length);
      const before = text.slice(0, offset);
      if (/^\s*(?:-|–)?\s*(?:inch|in\b|cm|mm|")/i.test(after)) return n;
      if (/^\s*[x×]\s*\d/i.test(after) || /[x×]\s*$/i.test(before)) return n;
      return String(Math.round(parseFloat(n.replace(',', '.')) * factor * 10) / 10);
    });
  }

  root.RC = root.RC || {};
  root.RC.renderIngredient = renderIngredient;
  root.RC.renderIngredientParts = renderIngredientParts;
  root.RC.convertTemps = convertTemps;
  root.RC.scaleYield = scaleYield;
  root.RC.scaleBlockers = scaleBlockers;
  root.RC.lookupCup = lookupCup;
  root.RC.lookupCupDetail = lookupCupDetail;
  root.RC.cupTable = CUP_TABLE;
  root.RC.LIQUID = LIQUID;
})(globalThis);
