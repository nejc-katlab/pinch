(function (root) {
  const WORDS = {
    a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40,
    'forty-five': 45, 'forty five': 45, sixty: 60, ninety: 90
  };
  const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
  const UNIT_SECONDS = { h: 3600, m: 60, s: 1 };
  const MIN_SECONDS = 10;
  const MAX_SECONDS = 12 * 3600;
  const KEY = 'timers';
  const STALE_MS = 3600 * 1000;

  const NUM = `(?:\\d+(?:\\.\\d+)?(?:\\s+\\d\\/\\d|\\s*[½¼¾⅓⅔])?|\\d\\/\\d|[½¼¾⅓⅔]|forty[- ]five|${Object.keys(WORDS).filter(w => !w.includes('forty ')).sort((a, b) => b.length - a.length).join('|')})`;
  const UNIT = '(hours?|hrs?|minutes?|mins?|seconds?|secs?)';
  const HALF = '(\\s+and\\s+a\\s+half)?';
  const DURATION = new RegExp(
    `(?<![\\w.,/])(?:(half\\s+an?\\s+hour)|(${NUM})(?:\\s*(?:-|–|—|to|or)\\s*(${NUM}))?\\s*(?:-\\s*)?${UNIT}\\b${HALF}(?:,?\\s*(?:and\\s+)?(${NUM})\\s*(?:-\\s*)?${UNIT}\\b)?)`,
    'gi');

  function num(token) {
    const t = token.toLowerCase().replace(/\s+/g, ' ');
    if (t in WORDS) return WORDS[t];
    if (t === 'forty-five' || t === 'forty five') return 45;
    if (t in FRACTIONS) return FRACTIONS[t];
    const mixed = t.match(/^(\d+)\s+(\d)\/(\d)$/);
    if (mixed) return +mixed[1] + mixed[2] / mixed[3];
    const frac = t.match(/^(\d)\/(\d)$/);
    if (frac) return frac[1] / frac[2];
    const uni = t.match(/^(\d+)\s*([½¼¾⅓⅔])$/);
    if (uni) return +uni[1] + FRACTIONS[uni[2]];
    return parseFloat(t);
  }

  function unitSeconds(unit) {
    return UNIT_SECONDS[unit.toLowerCase()[0]];
  }

  function findDurations(text) {
    const out = [];
    for (const m of text.matchAll(DURATION)) {
      const [phrase, halfHour, n1, n2, unit, half, n3, unit2] = m;
      let seconds;
      let maxSeconds = null;
      if (halfHour) {
        seconds = 1800;
      } else {
        const per = unitSeconds(unit);
        const extra = (half ? 0.5 * per : 0) + (n3 ? num(n3) * unitSeconds(unit2) : 0);
        seconds = num(n1) * per + extra;
        if (n2) maxSeconds = num(n2) * per + extra;
        if (maxSeconds != null && maxSeconds <= seconds) maxSeconds = null;
      }
      seconds = Math.round(seconds);
      if (!(seconds >= MIN_SECONDS && seconds <= MAX_SECONDS)) continue;
      out.push({
        start: m.index,
        end: m.index + phrase.length,
        text: phrase,
        seconds,
        maxSeconds: maxSeconds == null ? null : Math.round(maxSeconds)
      });
    }
    return out;
  }

  function splitDurations(text) {
    const parts = [];
    let pos = 0;
    for (const d of findDurations(text)) {
      if (d.start > pos) parts.push({ text: text.slice(pos, d.start) });
      parts.push({ text: d.text, duration: d });
      pos = d.end;
    }
    if (pos < text.length) parts.push({ text: text.slice(pos) });
    return parts;
  }

  function formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  }

  function formatSpan(seconds) {
    if (seconds < 60) return `${seconds} sec`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (!h) return `${m} min`;
    return m ? `${h} hr ${m} min` : `${h} hr`;
  }

  const hasChrome = () => typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  let memory = [];

  async function list() {
    if (!hasChrome()) return memory;
    const { [KEY]: timers = [] } = await chrome.storage.local.get({ [KEY]: [] });
    const now = Date.now();
    return timers.filter(t => now - t.endsAt < STALE_MS);
  }

  async function save(timers) {
    if (!hasChrome()) {
      memory = timers;
      for (const cb of listeners) cb(timers);
      return;
    }
    await chrome.storage.local.set({ [KEY]: timers });
  }

  async function start({ key, label, recipe, seconds, tabId = null }) {
    const timers = await list();
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const timer = { id, key, label, recipe, seconds, tabId, endsAt: Date.now() + seconds * 1000 };
    await save([...timers.filter(t => t.key !== key), timer]);
    if (hasChrome() && chrome.alarms) chrome.alarms.create(`timer:${id}`, { when: timer.endsAt });
    return timer;
  }

  async function cancel(id) {
    const timers = await list();
    await save(timers.filter(t => t.id !== id));
    if (hasChrome() && chrome.alarms) chrome.alarms.clear(`timer:${id}`);
    if (typeof chrome !== 'undefined' && chrome.notifications) chrome.notifications.clear(`timer:${id}`);
  }

  const listeners = [];

  function onChange(cb) {
    listeners.push(cb);
    if (hasChrome() && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[KEY]) cb(changes[KEY].newValue || []);
      });
    }
  }

  function stepFragment(text, onDuration) {
    const frag = document.createDocumentFragment();
    for (const part of splitDurations(text)) {
      if (!part.duration) {
        frag.append(part.text);
        continue;
      }
      frag.appendChild(onDuration(part.duration));
    }
    return frag;
  }

  root.RC = root.RC || {};
  root.RC.findDurations = findDurations;
  root.RC.splitDurations = splitDurations;
  root.RC.formatClock = formatClock;
  root.RC.formatSpan = formatSpan;
  root.RC.stepFragment = stepFragment;
  root.RC.timers = { list, start, cancel, onChange };
})(globalThis);
