chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !sender.tab || sender.tab.id == null) return;
  if (msg.type === 'RECIPE_GONE') {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
  }
  if (msg.type === 'RECIPE_FOUND') {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '✓' });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#3f7a4e' });
  }
  if (msg.type === 'OPEN_POPUP') {
    chrome.action.openPopup().catch(() => {});
  }
  if (msg.type === 'LOG_RECIPE') {
    chrome.storage.local.get({ log: [], devLogging: false }).then(({ log, devLogging }) => {
      if (devLogging !== true) return;
      const next = log.filter(e => e.url !== msg.entry.url);
      next.push(msg.entry);
      chrome.storage.local.set({ log: next.slice(-400) });
    });
  }
  if (msg.type === 'LOG_MISS') {
    chrome.storage.local.get({ misses: [], devLogging: false }).then(({ misses, devLogging }) => {
      if (devLogging !== true) return;
      const next = misses.filter(e => e.url !== msg.entry.url);
      next.push(msg.entry);
      chrome.storage.local.set({ misses: next.slice(-200) });
    });
  }
});
