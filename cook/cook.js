(function () {
  const state = { recipe: null, system: 'metric', factor: 1, current: 0, checked: new Set(), timers: [] };
  const RINGS = 20;
  const RING_GAP = 4;
  const RING_WINDOW_MS = RINGS * RING_GAP * 1000;
  const PIP_ROW = 92;
  const PIP_BACK = 44;
  const scheduled = new Map();
  let audio = null;
  let pip = null;
  let pipFailed = false;
  let pipHadTimers = false;
  let tabId = null;
  let notifyAsked = true;

  function el(id) {
    return document.getElementById(id);
  }

  function timerKey(stepIndex, n) {
    return `${state.recipe.source || state.recipe.name}|${stepIndex}|${n}`;
  }

  function stepDurations(stepIndex) {
    const text = RC.convertTemps(state.recipe.steps[stepIndex], state.system);
    return RC.findDurations(text).map((d, n) => ({ ...d, key: timerKey(stepIndex, n) }));
  }

  function startTimer(stepIndex, d) {
    unlockAudio();
    const running = state.timers.find(t => t.key === d.key);
    if (running) {
      RC.timers.cancel(running.id);
      return;
    }
    openPip(state.timers.length + 1);
    askForNotifications();
    RC.timers.start({
      key: d.key,
      label: `Step ${stepIndex + 1} · ${RC.formatSpan(d.seconds)}`,
      recipe: state.recipe.name,
      seconds: d.seconds,
      tabId
    });
  }

  function askForNotifications() {
    if (notifyAsked || typeof chrome === 'undefined' || !chrome.permissions) return;
    notifyAsked = true;
    chrome.storage.local.set({ notifyAsked: true });
    chrome.permissions.request({ permissions: ['notifications'] }).catch(() => {});
  }

  function renderHeader() {
    const r = state.recipe;
    el('name').textContent = r.name;
    const parts = [];
    const servings = RC.scaleYield(r.servings, state.factor);
    if (servings) parts.push(`Yield ${servings}`);
    if (r.prep != null) parts.push(`Prep ${RC.formatMinutes(r.prep)}`);
    if (r.cook != null) parts.push(`Cook ${RC.formatMinutes(r.cook)}`);
    if (r.total != null) parts.push(`Total ${RC.formatMinutes(r.total)}`);
    el('meta').textContent = parts.join('  ·  ');
  }

  function renderIngredients() {
    const r = state.recipe;
    const opts = { system: state.system, factor: state.factor };
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
      for (let i = g.start; i < g.start + g.count; i++) {
        const p = RC.renderIngredientParts(RC.parseIngredient(r.ingredients[i]), opts);
        const li = document.createElement('li');
        const label = document.createElement('label');
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = state.checked.has(i);
        box.addEventListener('change', () => {
          if (box.checked) state.checked.add(i);
          else state.checked.delete(i);
          li.classList.toggle('done', box.checked);
          renderCount();
        });
        const amt = document.createElement('span');
        amt.className = 'amt';
        amt.textContent = p.amount;
        const item = document.createElement('span');
        item.textContent = p.item;
        label.append(box, amt, item);
        li.classList.toggle('done', box.checked);
        li.appendChild(label);
        ings.appendChild(li);
      }
    }
    renderCount();
  }

  function renderCount() {
    el('ing-count').textContent = `${state.checked.size}/${state.recipe.ingredients.length}`;
  }

  function renderStep() {
    const r = state.recipe;
    const i = state.current;
    el('step-count').textContent = `Step ${i + 1} of ${r.steps.length}`;
    const text = el('step-text');
    text.textContent = '';
    const durations = stepDurations(i);
    let n = 0;
    text.appendChild(RC.stepFragment(RC.convertTemps(r.steps[i], state.system), () => {
      const d = durations[n++];
      const mark = document.createElement('span');
      mark.className = 'dur';
      mark.dataset.key = d.key;
      mark.textContent = d.text;
      return mark;
    }));
    const box = el('step-timers');
    box.textContent = '';
    for (const d of durations) {
      const btn = document.createElement('button');
      btn.className = 'big-timer';
      btn.dataset.key = d.key;
      const top = document.createElement('span');
      top.className = 'bt-action';
      const clock = document.createElement('span');
      clock.className = 'bt-clock';
      const sub = document.createElement('span');
      sub.className = 'bt-sub';
      sub.textContent = d.maxSeconds ? `${d.text} · check at ${RC.formatSpan(d.seconds)}` : d.text;
      btn.append(top, clock, sub);
      btn.dataset.span = RC.formatSpan(d.seconds);
      btn.addEventListener('click', () => startTimer(i, d));
      box.appendChild(btn);
    }
    el('prev').disabled = i === 0;
    el('next').textContent = i === r.steps.length - 1 ? 'Finish' : 'Next step';
    for (const li of el('overview').children) {
      const idx = +li.dataset.index;
      li.classList.toggle('current', idx === i);
      li.classList.toggle('past', idx < i);
    }
    tick();
  }

  function renderOverview() {
    const list = el('overview');
    list.textContent = '';
    state.recipe.steps.forEach((step, i) => {
      const li = document.createElement('li');
      li.dataset.index = i;
      li.textContent = RC.convertTemps(step, state.system);
      li.addEventListener('click', () => go(i));
      list.appendChild(li);
    });
  }

  function parseFactor(v) {
    if (v.includes('/')) {
      const [a, b] = v.split('/');
      return parseFloat(a) / parseFloat(b);
    }
    return parseFloat(v);
  }

  function syncControls() {
    for (const b of el('system').querySelectorAll('button')) {
      b.classList.toggle('active', b.dataset.system === state.system);
    }
    for (const btn of el('scale').querySelectorAll('button')) {
      const factor = parseFactor(btn.dataset.factor);
      const blockers = factor < 1 ? RC.scaleBlockers(state.recipe.ingredients, factor, state.system) : [];
      btn.disabled = blockers.length > 0;
      btn.title = blockers.length
        ? `Can't scale to ${btn.textContent}: ${blockers.slice(0, 2).map(b => `"${b.raw}" would become ${b.scaled}`).join('; ')}${blockers.length > 2 ? ` (+${blockers.length - 2} more)` : ''}`
        : '';
    }
    const current = [...el('scale').querySelectorAll('button')]
      .find(b => Math.abs(parseFactor(b.dataset.factor) - state.factor) < 1e-9);
    if (!current || current.disabled) state.factor = 1;
    for (const b of el('scale').querySelectorAll('button')) {
      b.classList.toggle('active', Math.abs(parseFactor(b.dataset.factor) - state.factor) < 1e-9);
    }
  }

  function applySettings() {
    syncControls();
    renderHeader();
    renderIngredients();
    renderOverview();
    renderStep();
    persistJob();
  }

  function bindGroup(id, attr, apply) {
    el(id).addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      apply(btn.dataset[attr]);
      applySettings();
    });
  }

  function go(i) {
    const max = state.recipe.steps.length - 1;
    const next = Math.max(0, Math.min(max, i));
    if (next === state.current) return;
    state.current = next;
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function docs() {
    return pip ? [document, pip.document] : [document];
  }

  function fillDock(doc) {
    const dock = doc.getElementById('dock');
    dock.textContent = '';
    for (const t of [...state.timers].sort((a, b) => a.endsAt - b.endsAt)) {
      const card = doc.createElement('div');
      card.className = 'dock-timer';
      card.dataset.id = t.id;
      const label = doc.createElement('span');
      label.className = 'dt-label';
      label.textContent = t.label;
      const recipe = doc.createElement('span');
      recipe.className = 'dt-recipe';
      recipe.textContent = t.recipe || '';
      const clock = doc.createElement('span');
      clock.className = 'dt-clock';
      const close = doc.createElement('button');
      close.className = 'dt-close';
      close.addEventListener('click', () => RC.timers.cancel(t.id));
      card.append(label, clock, recipe, close);
      dock.appendChild(card);
    }
    if (doc !== document) {
      const back = doc.createElement('button');
      back.className = 'pip-back';
      back.textContent = 'Back to recipe';
      back.addEventListener('click', focusTab);
      dock.prepend(back);
      return;
    }
    if (!state.timers.length) return;
    const bar = doc.createElement('div');
    bar.className = 'dock-bar';
    if (!audioOn()) {
      const sound = doc.createElement('button');
      sound.className = 'dock-link';
      sound.textContent = 'Turn on sound';
      sound.addEventListener('click', () => {
        unlockAudio();
        renderDock();
      });
      bar.appendChild(sound);
    }
    if ('documentPictureInPicture' in window && !pip && !pipFailed) {
      const pop = doc.createElement('button');
      pop.className = 'dock-link';
      pop.textContent = 'Keep on top of other tabs';
      pop.addEventListener('click', () => openPip(state.timers.length));
      bar.appendChild(pop);
    }
    if (bar.children.length) dock.prepend(bar);
  }

  function renderDock() {
    for (const doc of docs()) fillDock(doc);
    document.body.classList.toggle('pip-open', !!pip);
    if (pip && state.timers.length) pipHadTimers = true;
    if (pip && pipHadTimers && !state.timers.length) pip.close();
    if (pip) {
      try {
        pip.resizeTo(pip.outerWidth, pipHeight(state.timers.length) + (pip.outerHeight - pip.innerHeight));
      } catch (e) {}
    }
  }

  function pipHeight(count) {
    return Math.max(1, count) * PIP_ROW + PIP_BACK + 16;
  }

  async function focusTab() {
    if (tabId == null || typeof chrome === 'undefined' || !chrome.tabs) {
      window.focus();
      return;
    }
    const tab = await chrome.tabs.update(tabId, { active: true });
    if (tab && chrome.windows) chrome.windows.update(tab.windowId, { focused: true });
  }

  async function openPip(count) {
    if (pip || pipFailed || !('documentPictureInPicture' in window)) return;
    try {
      pip = await documentPictureInPicture.requestWindow({ width: 300, height: pipHeight(count) });
    } catch (e) {
      pip = null;
      if (e.name !== 'NotAllowedError') pipFailed = true;
      renderDock();
      return;
    }
    for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      const copy = pip.document.createElement('link');
      copy.rel = 'stylesheet';
      copy.href = link.href;
      pip.document.head.appendChild(copy);
    }
    pip.document.title = 'Pinch timers';
    pip.document.body.className = 'pip';
    const dock = pip.document.createElement('div');
    dock.id = 'dock';
    dock.className = 'dock';
    pip.document.body.appendChild(dock);
    pip.addEventListener('pagehide', () => {
      pip = null;
      pipHadTimers = false;
      renderDock();
    });
    renderDock();
    tick();
  }

  function tick() {
    const now = Date.now();
    let anyDone = false;
    for (const doc of docs()) {
      for (const card of doc.querySelectorAll('.dock-timer')) {
        const t = state.timers.find(x => x.id === card.dataset.id);
        if (!t) continue;
        const done = now >= t.endsAt;
        if (done) anyDone = true;
        card.classList.toggle('done', done);
        card.querySelector('.dt-clock').textContent = done ? "Time's up" : RC.formatClock(t.endsAt - now);
        card.querySelector('.dt-close').textContent = done ? 'Dismiss' : 'Cancel';
      }
    }
    for (const btn of document.querySelectorAll('.big-timer')) {
      const t = state.timers.find(x => x.key === btn.dataset.key);
      const done = !!t && now >= t.endsAt;
      btn.classList.toggle('running', !!t && !done);
      btn.classList.toggle('done', done);
      btn.querySelector('.bt-action').textContent = !t ? 'Start timer' : done ? "Time's up · dismiss" : 'Tap to cancel';
      btn.querySelector('.bt-clock').textContent = !t ? btn.dataset.span : done ? '0:00' : RC.formatClock(t.endsAt - now);
    }
    for (const mark of document.querySelectorAll('.dur')) {
      mark.classList.toggle('running', state.timers.some(x => x.key === mark.dataset.key));
    }
    const name = state.recipe ? state.recipe.name : 'Cook mode';
    const next = [...state.timers].filter(t => t.endsAt > now).sort((a, b) => a.endsAt - b.endsAt)[0];
    document.title = anyDone
      ? `Time's up · ${name}`
      : next ? `${RC.formatClock(next.endsAt - now)} · ${name}` : `${name} · Cook mode`;
  }

  function audioOn() {
    return !!audio && audio.state === 'running';
  }

  function unlockAudio() {
    if (!audio) {
      try {
        audio = new AudioContext();
      } catch (e) {
        return;
      }
    }
    if (audio.state === 'suspended') audio.resume().then(scheduleRings);
    scheduleRings();
  }

  function chime(at) {
    const nodes = [];
    [1318.5, 1046.5, 1568].forEach((freq, k) => {
      const start = at + k * 0.22;
      for (const [mult, level] of [[1, 0.22], [2.76, 0.05]]) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * mult;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + 1.2);
        nodes.push(osc);
      }
    });
    return nodes;
  }

  function scheduleRings() {
    if (!audioOn()) return;
    const now = Date.now();
    for (const [id, nodes] of scheduled) {
      if (state.timers.some(t => t.id === id)) continue;
      for (const n of nodes) {
        try {
          n.stop();
        } catch (e) {}
      }
      scheduled.delete(id);
    }
    for (const t of state.timers) {
      if (scheduled.has(t.id) || now - t.endsAt > RING_WINDOW_MS) continue;
      const base = audio.currentTime + Math.max(0, (t.endsAt - now) / 1000);
      const skip = Math.max(0, Math.ceil((now - t.endsAt) / 1000 / RING_GAP));
      const nodes = [];
      for (let r = skip; r < RINGS; r++) nodes.push(...chime(base + (r - skip) * RING_GAP));
      scheduled.set(t.id, nodes);
    }
  }

  let bound = false;

  function bind() {
    if (bound) return;
    bound = true;
    bindGroup('system', 'system', v => { state.system = v; });
    bindGroup('scale', 'factor', v => { state.factor = parseFactor(v); });
    el('prev').addEventListener('click', () => go(state.current - 1));
    el('next').addEventListener('click', () => go(state.current + 1));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !el('drawer').classList.contains('hidden')) {
        closeLibrary();
        return;
      }
      if (!el('drawer').classList.contains('hidden') || e.target.closest('input[type="search"]')) return;
      if (e.target.closest('input, button') && e.key === ' ') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(state.current + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(state.current - 1);
      }
    });
    document.addEventListener('pointerdown', () => {
      if (audioOn()) return;
      unlockAudio();
      renderDock();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') keepAwake();
    });
  }

  let wakeLock = null;

  async function keepAwake() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    if (wakeLock && !wakeLock.released) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      el('awake').classList.remove('hidden');
      wakeLock.addEventListener('release', () => el('awake').classList.add('hidden'));
    } catch (e) {
      el('awake').classList.add('hidden');
    }
  }

  function load(job) {
    state.recipe = job.recipe;
    state.system = job.system === 'imperial' || job.system === 'metric' ? job.system : RC.dominantSystem(job.recipe.ingredients);
    state.factor = job.factor || 1;
    state.current = 0;
    state.checked = new Set();
    el('empty').classList.add('hidden');
    el('app').classList.remove('hidden');
    syncControls();
    renderHeader();
    renderIngredients();
    renderOverview();
    renderStep();
    renderSaveButton();
  }

  function show(job) {
    bindLibrary();
    if (!job || !job.recipe) {
      el('empty').classList.remove('hidden');
      return;
    }
    load(job);
    bind();
    keepAwake();
  }

  async function renderSaveButton() {
    if (!state.recipe) return;
    const saved = await RC.library.isSaved(state.recipe);
    el('save').textContent = saved ? 'Saved' : 'Save';
    el('save').classList.toggle('active', saved);
    el('save').title = saved ? 'Remove from saved recipes' : 'Save to your recipes';
  }

  function flash(btn, text) {
    const original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = original; }, 1500);
  }

  function formatDate(ms) {
    return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function renderLibrary() {
    const saved = await RC.library.list();
    el('saved-count').textContent = saved.length ? ` (${saved.length})` : '';
    if (el('drawer').classList.contains('hidden')) return;
    const query = el('lib-search').value;
    const shown = saved.filter(e => RC.library.matches(e, query));
    el('lib-search').classList.toggle('hidden', saved.length < 2);
    const currentId = state.recipe ? RC.library.recipeId(state.recipe) : null;
    const list = el('lib-list');
    list.textContent = '';
    for (const entry of shown) {
      const li = document.createElement('li');
      li.classList.toggle('current', entry.id === currentId);
      const open = document.createElement('button');
      open.className = 'lib-open';
      const name = document.createElement('span');
      name.className = 'lib-name';
      name.textContent = entry.recipe.name;
      const meta = document.createElement('span');
      meta.className = 'lib-meta';
      meta.textContent = [
        entry.id === currentId ? 'Cooking now' : null,
        RC.library.host(entry.recipe.source),
        `saved ${formatDate(entry.savedAt)}`
      ].filter(Boolean).join(' · ');
      open.append(name, meta);
      open.addEventListener('click', () => openSaved(entry));
      const remove = document.createElement('button');
      remove.className = 'lib-remove';
      remove.setAttribute('aria-label', `Remove ${entry.recipe.name}`);
      remove.title = 'Remove';
      remove.textContent = '×';
      remove.addEventListener('click', () => RC.library.remove(entry.id));
      li.append(open, remove);
      list.appendChild(li);
    }
    const empty = el('lib-empty');
    empty.classList.toggle('hidden', shown.length > 0);
    empty.textContent = saved.length
      ? 'No saved recipes match that search.'
      : 'Nothing saved yet. Press Save on a recipe to keep it here.';
  }

  function openSaved(entry) {
    const job = { recipe: entry.recipe, system: RC.dominantSystem(entry.recipe.ingredients), factor: 1 };
    closeLibrary();
    load(job);
    bind();
    keepAwake();
    persistJob();
    window.scrollTo({ top: 0 });
  }

  function openLibrary() {
    el('drawer').classList.remove('hidden');
    el('lib-search').value = '';
    renderLibrary();
    el('lib-search').focus();
  }

  function closeLibrary() {
    el('drawer').classList.add('hidden');
  }

  function persistJob() {
    if (window.__cookFixture !== undefined || typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.set({
      cookJob: { recipe: state.recipe, system: state.system, factor: state.factor }
    });
  }

  let libraryBound = false;

  function bindLibrary() {
    if (libraryBound) return;
    libraryBound = true;
    el('library-open').addEventListener('click', openLibrary);
    el('empty-library').addEventListener('click', openLibrary);
    el('library-close').addEventListener('click', closeLibrary);
    el('drawer').addEventListener('click', e => {
      if (e.target === el('drawer')) closeLibrary();
    });
    el('lib-search').addEventListener('input', renderLibrary);
    el('save').addEventListener('click', async () => {
      await RC.library.toggle(state.recipe);
      renderSaveButton();
    });
    el('copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(RC.toMarkdown(state.recipe, { system: state.system, factor: state.factor }));
        flash(el('copy'), 'Copied!');
      } catch (e) {
        flash(el('copy'), 'Copy failed');
      }
    });
    el('print').addEventListener('click', async () => {
      if (typeof chrome === 'undefined' || !chrome.tabs) return;
      await chrome.storage.local.set({
        printJob: { recipe: state.recipe, system: state.system, factor: state.factor }
      });
      chrome.tabs.create({ url: chrome.runtime.getURL('print/print.html') });
    });
    RC.library.onChange(() => {
      renderLibrary();
      renderSaveButton();
    });
    renderLibrary();
  }

  async function init() {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.getCurrent) {
      const tab = await chrome.tabs.getCurrent();
      if (tab) tabId = tab.id;
      const granted = await chrome.permissions.contains({ permissions: ['notifications'] });
      const { notifyAsked: asked } = await chrome.storage.local.get('notifyAsked');
      notifyAsked = granted || asked === true;
    }
    if (window.__cookFixture !== undefined) {
      show(window.__cookFixture);
    } else {
      const { cookJob } = await chrome.storage.local.get('cookJob');
      show(cookJob);
    }
    state.timers = await RC.timers.list();
    renderDock();
    tick();
    RC.timers.onChange(timers => {
      state.timers = timers;
      scheduleRings();
      renderDock();
      tick();
    });
    setInterval(tick, 1000);
  }

  init();
})();
