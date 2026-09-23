(function () {
  function extract() {
    try {
      return RC.extract(document);
    } catch (e) {
      return null;
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'GET_RECIPE') {
      sendResponse({ recipe: extract() });
    }
  });

  function showPill() {
    if (document.getElementById('rc-pill-host')) return;
    const host = document.createElement('div');
    host.id = 'rc-pill-host';
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        .pill {
          position: fixed;
          right: 16px;
          top: 16px;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 8px 14px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          color: #232a25;
          background: #fbfaf7;
          border: 1px solid #e5e3da;
          border-radius: 999px;
          box-shadow: 0 4px 16px rgba(35, 42, 37, 0.16);
          opacity: 0;
          transform: translateY(-6px);
          animation: rc-in 0.25s ease forwards;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3f7a4e;
        }
        .open {
          border: none;
          border-radius: 999px;
          padding: 5px 12px;
          font: inherit;
          font-weight: 600;
          background: #3f7a4e;
          color: #f7faf7;
          cursor: pointer;
        }
        .open:hover { filter: brightness(1.08); }
        .close {
          border: none;
          background: none;
          padding: 2px 4px;
          font-size: 14px;
          line-height: 1;
          color: #68746c;
          cursor: pointer;
        }
        .pill.out {
          animation: rc-out 0.25s ease forwards;
        }
        @keyframes rc-in { to { opacity: 1; transform: translateY(0); } }
        @keyframes rc-out { to { opacity: 0; transform: translateY(-6px); } }
        @media (prefers-color-scheme: dark) {
          .pill {
            color: #e9e7df;
            background: #21261f;
            border-color: #2d332c;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
          }
          .dot { background: #82bd8f; }
          .open { background: #82bd8f; color: #14201a; }
          .close { color: #9aa49b; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pill, .pill.out { animation: none; opacity: 1; transform: none; }
        }
      </style>
      <div class="pill">
        <span class="dot"></span>
        <span>Recipe found</span>
        <button class="open">Open</button>
        <button class="close" aria-label="Dismiss">✕</button>
      </div>`;
    const pill = shadow.querySelector('.pill');
    let hideTimer = setTimeout(hide, 8000);
    function hide() {
      clearTimeout(hideTimer);
      pill.classList.add('out');
      setTimeout(() => host.remove(), 300);
    }
    shadow.querySelector('.open').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }).catch(() => {});
      hide();
    });
    shadow.querySelector('.close').addEventListener('click', hide);
    pill.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    pill.addEventListener('mouseleave', () => { hideTimer = setTimeout(hide, 4000); });
    document.documentElement.appendChild(host);
  }

  function buildLogEntry(recipe) {
    const lines = recipe.ingredients.map(raw => {
      const p = RC.parseIngredient(raw);
      const original = RC.renderIngredientParts(p, { system: 'original', factor: 1 });
      const metric = RC.renderIngredientParts(p, { system: 'metric', factor: 1 });
      const scaled = RC.renderIngredientParts(p, { system: 'metric', factor: 2 });
      const match = p.unit ? RC.lookupCupDetail(p.item) : null;
      return {
        raw,
        qty: p.qty,
        qtyMax: p.qtyMax,
        unit: p.unit,
        item: p.item,
        match: match ? match.pattern : null,
        original: original.amount,
        metric: metric.amount,
        metric2x: scaled.amount,
        converted: metric.amount !== original.amount
      };
    });
    const tempSteps = recipe.steps.filter(s =>
      RC.convertTemps(s, 'metric') !== s).length;
    return {
      ts: new Date().toISOString(),
      url: location.href,
      name: recipe.name,
      method: recipe.method,
      servings: recipe.servings,
      hasNutrition: !!recipe.nutrition,
      stepCount: recipe.steps.length,
      tempStepsConverted: tempSteps,
      lineCount: lines.length,
      parsedCount: lines.filter(l => l.qty != null).length,
      convertedCount: lines.filter(l => l.converted).length,
      scalable: {
        half: RC.scaleBlockers(recipe.ingredients, 1 / 2).length === 0,
        third: RC.scaleBlockers(recipe.ingredients, 1 / 3).length === 0,
        quarter: RC.scaleBlockers(recipe.ingredients, 1 / 4).length === 0
      },
      lines
    };
  }

  function looksLikeRecipePage() {
    if (/recipe|recept|rezept|receta|ricetta/i.test(location.pathname)) return true;
    return [...document.querySelectorAll('h1, h2, h3, h4')]
      .some(h => /^\s*ingredients\b/i.test(h.textContent));
  }

  function devLoggingEnabled() {
    return chrome.storage.local.get('devLogging')
      .then(r => r.devLogging === true)
      .catch(() => false);
  }

  let lastUrl = location.href;
  let found = false;
  let timers = [];

  async function detect(isLastAttempt) {
    if (found) return;
    const recipe = extract();
    if (recipe) {
      found = true;
      chrome.runtime.sendMessage({ type: 'RECIPE_FOUND' }).catch(() => {});
      showPill();
      if (await devLoggingEnabled()) {
        chrome.runtime.sendMessage({ type: 'LOG_RECIPE', entry: buildLogEntry(recipe) }).catch(() => {});
      }
    } else if (isLastAttempt && looksLikeRecipePage() && await devLoggingEnabled()) {
      chrome.runtime.sendMessage({
        type: 'LOG_MISS',
        entry: { ts: new Date().toISOString(), url: location.href, title: document.title }
      }).catch(() => {});
    }
  }

  function scheduleDetection() {
    timers.forEach(clearTimeout);
    const delays = [500, 2000, 5000];
    timers = delays.map((ms, i) => setTimeout(() => detect(i === delays.length - 1), ms));
  }

  scheduleDetection();

  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (found) chrome.runtime.sendMessage({ type: 'RECIPE_GONE' }).catch(() => {});
    found = false;
    scheduleDetection();
  }, 1000);
})();
