(function () {
  function el(id) {
    return document.getElementById(id);
  }

  function render(job) {
    const { recipe, system, factor } = job;
    const opts = { system, factor };
    document.title = recipe.name;
    el('name').textContent = recipe.name;
    const parts = [];
    const servings = RC.scaleYield(recipe.servings, factor);
    if (servings) parts.push(`Yield: ${servings}`);
    if (recipe.prep != null) parts.push(`Prep: ${RC.formatMinutes(recipe.prep)}`);
    if (recipe.cook != null) parts.push(`Cook: ${RC.formatMinutes(recipe.cook)}`);
    if (recipe.total != null) parts.push(`Total: ${RC.formatMinutes(recipe.total)}`);
    if (factor !== 1) parts.push(`Scaled ${RC.formatQty(factor)}×`);
    el('meta').textContent = parts.join('  ·  ');
    const nParts = RC.nutritionParts(recipe.nutrition);
    if (nParts.length) {
      el('nutrition').textContent = `Per serving · ${nParts.join(' · ')}`;
      el('nutrition').classList.remove('hidden');
    }
    const ings = el('ingredients');
    const groups = recipe.groups && recipe.groups.length
      ? recipe.groups
      : [{ name: null, start: 0, count: recipe.ingredients.length }];
    for (const g of groups) {
      if (g.name) {
        const header = document.createElement('li');
        header.className = 'ghead';
        header.textContent = g.name;
        ings.appendChild(header);
      }
      for (const ing of recipe.ingredients.slice(g.start, g.start + g.count)) {
        const p = RC.renderIngredientParts(RC.parseIngredient(ing), opts);
        const li = document.createElement('li');
        const box = document.createElement('span');
        box.className = 'box';
        const amt = document.createElement('span');
        amt.className = 'amt';
        amt.textContent = p.amount;
        const item = document.createElement('span');
        item.textContent = p.item;
        li.append(box, ...(p.amount ? [amt] : []), item);
        ings.appendChild(li);
      }
    }
    const steps = el('steps');
    for (const step of recipe.steps) {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = RC.convertTemps(step, system);
      li.appendChild(text);
      steps.appendChild(li);
    }
    el('steps-section').classList.toggle('hidden', !recipe.steps.length);
    if (recipe.source) {
      el('source').textContent = `Source: ${recipe.source}`;
      el('source').classList.remove('hidden');
    }
  }

  el('print-btn').addEventListener('click', () => window.print());

  async function init() {
    if (window.__printFixture) {
      render(window.__printFixture);
      return;
    }
    const { printJob } = await chrome.storage.local.get('printJob');
    chrome.storage.local.remove('printJob');
    if (!printJob) {
      document.querySelector('article').textContent = 'Nothing to print — open a recipe and use the Print button.';
      return;
    }
    render(printJob);
    setTimeout(() => window.print(), 300);
  }

  init();
})();
