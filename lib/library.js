(function (root) {
  const KEY = 'saved';
  const listeners = [];
  let memory = [];

  const hasChrome = () => typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function recipeId(recipe) {
    return recipe.source || `name:${recipe.name}`;
  }

  async function list() {
    if (!hasChrome()) return memory;
    const { [KEY]: saved = [] } = await chrome.storage.local.get({ [KEY]: [] });
    return saved;
  }

  async function write(saved) {
    if (!hasChrome()) {
      memory = saved;
      for (const cb of listeners) cb(saved);
      return;
    }
    await chrome.storage.local.set({ [KEY]: saved });
  }

  async function isSaved(recipe) {
    const id = recipeId(recipe);
    return (await list()).some(e => e.id === id);
  }

  async function save(recipe) {
    const id = recipeId(recipe);
    const saved = (await list()).filter(e => e.id !== id);
    await write([{ id, savedAt: Date.now(), recipe }, ...saved]);
  }

  async function remove(id) {
    await write((await list()).filter(e => e.id !== id));
  }

  async function toggle(recipe) {
    if (await isSaved(recipe)) {
      await remove(recipeId(recipe));
      return false;
    }
    await save(recipe);
    return true;
  }

  function onChange(cb) {
    listeners.push(cb);
    if (hasChrome() && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[KEY]) cb(changes[KEY].newValue || []);
      });
    }
  }

  function matches(entry, query) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const r = entry.recipe;
    return [r.name, r.source || '', ...r.ingredients].some(t => String(t).toLowerCase().includes(q));
  }

  function host(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  }

  root.RC = root.RC || {};
  root.RC.library = { list, save, remove, toggle, isSaved, onChange, recipeId, matches, host };
})(globalThis);
