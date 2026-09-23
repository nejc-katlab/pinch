(function (root) {
  const FRACTIONS = {
    '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3',
    '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6',
    '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8'
  };

  const UNITS = {};
  [
    ['cup', 'cup', 'cups'],
    ['tbsp', 'tablespoon', 'tablespoons', 'tbsp', 'tbsps', 'tbs', 'tbl'],
    ['tsp', 'teaspoon', 'teaspoons', 'tsp', 'tsps'],
    ['floz', 'fl oz', 'fluid ounce', 'fluid ounces'],
    ['oz', 'ounce', 'ounces', 'oz'],
    ['lb', 'pound', 'pounds', 'lb', 'lbs'],
    ['g', 'gram', 'grams', 'g'],
    ['kg', 'kilogram', 'kilograms', 'kg'],
    ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres', 'ml'],
    ['l', 'liter', 'liters', 'litre', 'litres', 'l'],
    ['pint', 'pint', 'pints'],
    ['quart', 'quart', 'quarts', 'qt', 'qts'],
    ['gallon', 'gallon', 'gallons', 'gal'],
    ['stick', 'stick', 'sticks'],
    ['pinch', 'pinch', 'pinches'],
    ['dash', 'dash', 'dashes'],
    ['clove', 'clove', 'cloves'],
    ['can', 'can', 'cans'],
    ['package', 'package', 'packages', 'pkg'],
    ['slice', 'slice', 'slices'],
    ['piece', 'piece', 'pieces'],
    ['bunch', 'bunch', 'bunches'],
    ['sprig', 'sprig', 'sprigs'],
    ['head', 'head', 'heads'],
    ['stalk', 'stalk', 'stalks'],
    ['handful', 'handful', 'handfuls']
  ].forEach(([key, ...aliases]) => aliases.forEach(a => { UNITS[a] = key; }));

  function normalize(text) {
    let out = String(text);
    for (const [ch, frac] of Object.entries(FRACTIONS)) {
      out = out.replace(new RegExp(ch, 'g'), ' ' + frac + ' ');
    }
    return out
      .replace(/(\d+)\s+and\s+(\d+\/\d+)/gi, '$1 $2')
      .replace(/(\d+)-(\d+\/\d+)/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function num(s) {
    if (s.includes('/')) {
      const [a, b] = s.split('/');
      return parseFloat(a) / parseFloat(b);
    }
    return parseFloat(s.replace(',', '.'));
  }

  const NUM_RE = '\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?';
  const QTY_RE = new RegExp(`^\\s*(${NUM_RE})(?:\\s*(?:-|–|—|\\bto\\b)\\s*(${NUM_RE}))?\\s*`);

  function parseQty(text) {
    const m = text.match(QTY_RE);
    if (!m) return null;
    const val = t => t.trim().split(/\s+/).reduce((acc, p) => acc + num(p), 0);
    return { qty: val(m[1]), qtyMax: m[2] ? val(m[2]) : null, rest: text.slice(m[0].length) };
  }

  function parseIngredient(raw) {
    const text = normalize(raw);
    const q = parseQty(text);
    if (!q || !q.qty) {
      return { raw, qty: null, qtyMax: null, unit: null, item: text };
    }
    let words = q.rest.split(/\s+/).filter(Boolean);
    let unit = null;
    const strip = w => (w || '').toLowerCase().replace(/[.,;:]+$/g, '');
    const two = strip(words.slice(0, 2).join(' '));
    const one = strip(words[0]);
    if (UNITS[two]) {
      unit = UNITS[two];
      words = words.slice(2);
    } else if (UNITS[one]) {
      unit = UNITS[one];
      words = words.slice(1);
    }
    const item = words.join(' ').replace(/^of\s+/i, '').trim();
    return { raw, qty: q.qty, qtyMax: q.qtyMax, unit, item };
  }

  const DISPLAY_FRACTIONS = [
    [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'], [0.5, '½'],
    [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞']
  ];

  function formatQty(q) {
    if (q == null) return '';
    const whole = Math.floor(q);
    const frac = q - whole;
    if (frac < 0.03) return String(whole || Math.round(q * 100) / 100);
    for (const [v, ch] of DISPLAY_FRACTIONS) {
      if (Math.abs(frac - v) < 0.03) return whole ? `${whole}${ch}` : ch;
    }
    return String(Math.round(q * 100) / 100);
  }

  root.RC = root.RC || {};
  root.RC.parseIngredient = parseIngredient;
  root.RC.formatQty = formatQty;
  root.RC.normalizeText = normalize;
})(globalThis);
