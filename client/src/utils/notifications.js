export function requestNotifyPermission() {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then(p => p === 'granted');
}

export function sendLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      icon: '/Synex.png',
      badge: '/Synex.png',
      ...options,
    });
    if (options.url) {
      n.onclick = () => { window.focus(); if (options.url) window.open(options.url, '_self'); };
    }
    setTimeout(() => n.close(), 8000);
  } catch {}
}
