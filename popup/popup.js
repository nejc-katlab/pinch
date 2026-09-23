(function () {
  const state = { recipe: null, system: 'original', factor: 1 };

  function el(id) {
    return document.getElementById(id);
  }

  function renderMeta() {
    const r = state.recipe;
    const parts = [];
    const servings = RC.scaleYield(r.servings, state.factor);
    if (servings) parts.push(['Yield', servings]);
    if (r.prep != null) parts.push(['Prep', RC.formatMinutes(r.prep)]);
    if (r.cook != null) parts.push(['Cook', RC.formatMinutes(r.cook)]);
    if (r.total != null) parts.push(['Total', RC.formatMinutes(r.total)]);
    const meta = el('meta');
    meta.textContent = '';
    for (const [label, value] of parts) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.append(`${label} `);
      const strong = document.createElement('strong');
      strong.textContent = value;
      chip.appendChild(strong);
      meta.appendChild(chip);
    }
    const nutrition = el('nutrition');
    const nParts = RC.nutritionParts(r.nutrition);
    nutrition.classList.toggle('hidden', !nParts.length);
    if (nParts.length) {
      nutrition.textContent = '';
      const label = document.createElement('strong');
      label.textContent = 'Per serving';
      nutrition.append(label, ` · ${nParts.join(' · ')}`);
    }
  }

  function render() {
    const r = state.recipe;
    const opts = { system: state.system, factor: state.factor };
    el('name').textContent = r.name;
    renderMeta();
    const ings = el('ingredients');
    ings.textContent = '';
    const groups = r.groups && r.groups.length
      ? r.groups
      : [{ name: null, start: 0, count: r.ingredients.length }];
    for (const g of groups) {
      if (g.name) {
        const header = document.createElement('li');
        header.className = 'ghead';
        header.textContent = g.name;
        ings.appendChild(header);
      }
      for (const ing of r.ingredients.slice(g.start, g.start + g.count)) {
        const parts = RC.renderIngredientParts(RC.parseIngredient(ing), opts);
        const li = document.createElement('li');
        const amt = document.createElement('span');
        amt.className = 'amt';
        amt.textContent = parts.amount;
        const item = document.createElement('span');
        item.textContent = parts.item;
        li.append(amt, item);
        ings.appendChild(li);
      }
    }
    const steps = el('steps');
    steps.textContent = '';
    for (const step of r.steps) {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = RC.convertTemps(step, state.system);
      li.appendChild(text);
      steps.appendChild(li);
    }
    el('steps-section').classList.toggle('hidden', !r.steps.length);
  }

  function bindGroup(id, attr, apply) {
    el(id).addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      apply(btn.dataset[attr]);
      for (const b of el(id).querySelectorAll('button')) {
        b.classList.toggle('active', b === btn);
      }
      render();
    });
  }

  bindGroup('system', 'system', v => { state.system = v; updateScaleAvailability(); });
  function parseFactor(v) {
    if (v.includes('/')) {
      const [a, b] = v.split('/');
      return parseFloat(a) / parseFloat(b);
    }
    return parseFloat(v);
  }

  function updateScaleAvailability() {
    for (const btn of el('scale').querySelectorAll('button')) {
      const factor = parseFactor(btn.dataset.factor);
      if (factor >= 1) continue;
      const blockers = RC.scaleBlockers(state.recipe.ingredients, factor, state.system);
      btn.disabled = blockers.length > 0;
      btn.title = blockers.length
        ? `Can't scale to ${btn.textContent}: ${blockers.slice(0, 2).map(b => `"${b.raw}" would become ${b.scaled}`).join('; ')}${blockers.length > 2 ? ` (+${blockers.length - 2} more)` : ''}`
        : '';
    }
    const active = el('scale').querySelector('button.active');
    if (active && active.disabled) {
      state.factor = 1;
      for (const b of el('scale').querySelectorAll('button')) {
        b.classList.toggle('active', b.dataset.factor === '1');
      }
    }
  }

  bindGroup('scale', 'factor', v => { state.factor = parseFactor(v); });

  el('print').addEventListener('click', async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    await chrome.storage.local.set({
      printJob: { recipe: state.recipe, system: state.system, factor: state.factor }
    });
    chrome.tabs.create({ url: chrome.runtime.getURL('print/print.html') });
  });

  el('copy').addEventListener('click', async () => {
    const md = RC.toMarkdown(state.recipe, { system: state.system, factor: state.factor });
    try {
      await navigator.clipboard.writeText(md);
      el('copy').textContent = 'Copied!';
    } catch (e) {
      el('copy').textContent = 'Copy failed';
    }
    setTimeout(() => { el('copy').textContent = 'Copy as Markdown'; }, 1500);
  });

  async function initLog() {
    const status = el('log-status');
    if (!status || typeof chrome === 'undefined' || !chrome.storage) return;
    const { log = [], misses = [], devLogging } = await chrome.storage.local.get(['log', 'misses', 'devLogging']);
    if (devLogging !== true) return;
    if (!log.length && !misses.length) return;
    el('log-count').textContent = `Field log: ${log.length} recipes · ${misses.length} misses`;
    status.classList.remove('hidden');
    el('log-export').addEventListener('click', e => {
      e.preventDefault();
      const blob = new Blob(
        [JSON.stringify({ exported: new Date().toISOString(), log, misses }, null, 1)],
        { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pinch-log.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  function show(recipe) {
    if (recipe) {
      state.recipe = recipe;
      el('recipe').classList.remove('hidden');
      updateScaleAvailability();
      render();
    } else {
      el('empty').classList.remove('hidden');
    }
  }

  async function init() {
    if (window.__fixtureRecipe !== undefined) {
      show(window.__fixtureRecipe);
      return;
    }
    let tab;
    try {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_RECIPE' });
      show(res && res.recipe);
    } catch (e) {
      show(null);
      if (tab && /^https?:/i.test(tab.url || '')) {
        el('empty-title').textContent = 'Reload this page';
        el('empty-hint').textContent = 'This tab was open before the extension started. Reload it and open the extension again.';
      }
    }
  }

  init();
  initLog();
})();
