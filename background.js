chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !sender.tab || sender.tab.id == null) return;
  if (msg.type === 'RECIPE_GONE') {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
  }
  if (msg.type === 'RECIPE_FOUND') {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '✓' });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#cf9f24' });
    chrome.action.setBadgeTextColor({ tabId: sender.tab.id, color: '#2b2208' });
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

chrome.alarms.onAlarm.addListener(async alarm => {
  if (!alarm.name.startsWith('timer:') || !chrome.notifications) return;
  const id = alarm.name.slice(6);
  const { timers = [] } = await chrome.storage.local.get({ timers: [] });
  const timer = timers.find(t => t.id === id);
  if (!timer) return;
  chrome.notifications.create(alarm.name, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `Time's up: ${timer.label}`,
    message: timer.recipe || 'Pinch timer',
    priority: 2,
    requireInteraction: true
  });
});

async function dismissTimer(notificationId, focus) {
  if (!notificationId.startsWith('timer:')) return;
  const id = notificationId.slice(6);
  const { timers = [] } = await chrome.storage.local.get({ timers: [] });
  const timer = timers.find(t => t.id === id);
  chrome.storage.local.set({ timers: timers.filter(t => t.id !== id) });
  chrome.notifications.clear(notificationId);
  if (!focus || !timer || timer.tabId == null) return;
  try {
    const tab = await chrome.tabs.update(timer.tabId, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
  } catch (e) {}
}

let notificationsBound = false;

function bindNotifications() {
  if (notificationsBound || !chrome.notifications) return;
  notificationsBound = true;
  chrome.notifications.onClicked.addListener(id => dismissTimer(id, true));
  chrome.notifications.onClosed.addListener(id => dismissTimer(id, false));
}

bindNotifications();
chrome.permissions.onAdded.addListener(bindNotifications);
