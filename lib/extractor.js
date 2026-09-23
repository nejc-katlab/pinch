(function (root) {
  function stripHtml(html) {
    if (typeof DOMParser !== 'undefined') {
      return new DOMParser().parseFromString(String(html), 'text/html').body.textContent;
    }
    return String(html)
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ');
  }

  function clean(text) {
    if (text == null) return '';
    return stripHtml(String(text)).replace(/\s+/g, ' ').trim();
  }

  function parseDuration(iso) {
    if (!iso || typeof iso !== 'string') return null;
    const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
    if (!m || (!m[1] && !m[2] && !m[3])) return null;
    const total = (parseInt(m[1] || 0) * 1440) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
    return total > 0 ? total : null;
  }

  function isRecipeType(t) {
    if (!t) return false;
    const types = Array.isArray(t) ? t : [t];
    return types.some(x => String(x).toLowerCase() === 'recipe');
  }

  function findRecipes(node, out) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(n => findRecipes(n, out));
      return;
    }
    if (isRecipeType(node['@type'])) out.push(node);
    if (node['@graph']) findRecipes(node['@graph'], out);
    if (node.mainEntity) findRecipes(node.mainEntity, out);
  }

  function collectSteps(ins, steps) {
    if (!ins) return;
    if (typeof ins === 'string') {
      const text = clean(ins);
      if (text) steps.push(text);
    } else if (Array.isArray(ins)) {
      ins.forEach(i => collectSteps(i, steps));
    } else if (ins.itemListElement) {
      collectSteps(ins.itemListElement, steps);
    } else if (ins.text || ins.name) {
      const text = clean(ins.text || ins.name);
      if (text) steps.push(text);
    }
  }

  function nutritionOf(n) {
    if (!n || typeof n !== 'object') return null;
    const num = v => {
      if (v == null) return null;
      const m = String(v).match(/\d+(?:\.\d+)?/);
      return m ? parseFloat(m[0]) : null;
    };
    const out = {
      calories: num(n.calories),
      fat: num(n.fatContent),
      carbs: num(n.carbohydrateContent),
      protein: num(n.proteinContent),
      servingSize: n.servingSize ? clean(n.servingSize) : null
    };
    const hasData = out.calories != null || out.fat != null || out.carbs != null || out.protein != null;
    return hasData ? out : null;
  }

  function yieldOf(y) {
    if (y == null) return null;
    if (Array.isArray(y)) y = y.find(v => /\D/.test(String(v))) ?? y[0];
    return clean(y).replace(/^(?:servings?|serves|yields?|makes)\s*:?\s*/i, '') || null;
  }

  function normalizeRecipe(r) {
    const ingredients = (r.recipeIngredient || r.ingredients || [])
      .map(clean).filter(Boolean);
    const steps = [];
    collectSteps(r.recipeInstructions, steps);
    if (!ingredients.length && !steps.length) return null;
    return {
      name: clean(r.name) || 'Recipe',
      ingredients,
      steps,
      prep: parseDuration(r.prepTime),
      cook: parseDuration(r.cookTime),
      total: parseDuration(r.totalTime),
      servings: yieldOf(r.recipeYield),
      nutrition: nutritionOf(r.nutrition),
      source: typeof r.url === 'string' && /^https?:\/\//i.test(r.url.trim()) ? r.url.trim() : null
    };
  }

  function extractFromJson(data) {
    const found = [];
    findRecipes(data, found);
    for (const candidate of found) {
      const recipe = normalizeRecipe(candidate);
      if (recipe) return recipe;
    }
    return null;
  }

  function parseJsonLenient(text) {
    try {
      return JSON.parse(text);
    } catch (e) {}
    try {
      return JSON.parse(text.replace(/[\u0000-\u001f]/g, ' '));
    } catch (e) {
      return null;
    }
  }

  function fromJsonLd(doc) {
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const data = parseJsonLenient(script.textContent);
      if (!data) continue;
      const recipe = extractFromJson(data);
      if (recipe) return recipe;
    }
    return null;
  }

  function fromMicrodata(doc) {
    const scope = doc.querySelector('[itemtype*="schema.org/Recipe" i]');
    if (!scope) return null;
    const props = name => [...scope.querySelectorAll(`[itemprop="${name}"]`)];
    const textProp = el => clean(el.getAttribute('content') || el.textContent);
    const ingredients = props('recipeIngredient').concat(props('ingredients'))
      .map(textProp).filter(Boolean);
    const steps = props('recipeInstructions').flatMap(el => {
      const items = el.querySelectorAll('li');
      return items.length ? [...items].map(li => clean(li.textContent)) : [textProp(el)];
    }).filter(Boolean);
    if (!steps.length) {
      const directions = scope.querySelector('.jetpack-recipe-directions')
        || doc.querySelector('.jetpack-recipe-directions');
      if (directions) {
        let buffer = '';
        const flush = () => {
          const text = clean(buffer);
          buffer = '';
          if (text) steps.push(text);
        };
        for (const node of directions.childNodes) {
          if (node.nodeType === 1 && node.matches('p, li, ol, ul')) {
            flush();
            if (node.matches('ol, ul')) {
              steps.push(...[...node.querySelectorAll('li')].map(li => clean(li.textContent)).filter(Boolean));
            } else {
              const text = clean(node.textContent);
              if (text) steps.push(text);
            }
          } else {
            buffer += node.textContent || '';
          }
        }
        flush();
      }
    }
    if (!ingredients.length && !steps.length) return null;
    const durProp = name => {
      const el = props(name)[0];
      return el ? parseDuration(el.getAttribute('content') || el.getAttribute('datetime') || el.textContent) : null;
    };
    const nameEl = props('name')[0];
    const yieldEl = props('recipeYield')[0];
    return {
      name: nameEl ? textProp(nameEl) : (clean(doc.title) || 'Recipe'),
      ingredients,
      steps,
      prep: durProp('prepTime'),
      cook: durProp('cookTime'),
      total: durProp('totalTime'),
      servings: yieldEl ? yieldOf(textProp(yieldEl)) : null,
      source: null
    };
  }

  function fromHeuristics(doc) {
    const headings = [...doc.querySelectorAll('h1, h2, h3, h4')];
    const listAfter = heading => {
      let el = heading.nextElementSibling;
      for (let i = 0; el && i < 4; i++) {
        const list = el.matches('ul, ol') ? el : el.querySelector('ul, ol');
        if (list) return [...list.querySelectorAll('li')].map(li => clean(li.textContent)).filter(Boolean);
        el = el.nextElementSibling;
      }
      return [];
    };
    const ingHeading = headings.find(h => /^\s*ingredients\b/i.test(h.textContent));
    const stepHeading = headings.find(h => /^\s*(instructions|directions|method|preparation|steps)\b/i.test(h.textContent));
    if (!ingHeading) return null;
    const ingredients = listAfter(ingHeading);
    const steps = stepHeading ? listAfter(stepHeading) : [];
    if (ingredients.length < 2) return null;
    const h1 = doc.querySelector('h1');
    return {
      name: clean(h1 ? h1.textContent : doc.title) || 'Recipe',
      ingredients,
      steps,
      prep: null,
      cook: null,
      total: null,
      servings: null,
      source: null
    };
  }

  function attachGroups(doc, recipe) {
    const groupEls = doc.querySelectorAll('.wprm-recipe-ingredient-group');
    if (!groupEls.length) return;
    const groups = [...groupEls].map(g => {
      const nameEl = g.querySelector('.wprm-recipe-ingredient-group-name');
      return {
        name: nameEl ? clean(nameEl.textContent) : null,
        count: g.querySelectorAll('li.wprm-recipe-ingredient').length
      };
    });
    const total = groups.reduce((sum, g) => sum + g.count, 0);
    if (total !== recipe.ingredients.length) return;
    if (!groups.some(g => g.name)) return;
    let idx = 0;
    recipe.groups = groups.map(g => {
      const out = { name: g.name, start: idx, count: g.count };
      idx += g.count;
      return out;
    });
  }

  function extract(doc) {
    const tag = (recipe, method) => {
      if (recipe) recipe.method = method;
      return recipe;
    };
    const recipe = tag(fromJsonLd(doc), 'jsonld')
      || tag(fromMicrodata(doc), 'microdata')
      || tag(fromHeuristics(doc), 'heuristic');
    if (recipe) attachGroups(doc, recipe);
    return recipe;
  }

  root.RC = root.RC || {};
  root.RC.extract = extract;
  root.RC.extractFromJson = extractFromJson;
  root.RC.parseJsonLenient = parseJsonLenient;
  root.RC.parseDuration = parseDuration;
})(globalThis);
