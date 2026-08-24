import { PUSH_NOTIFICATIONS } from "./sassyLines";

/**
 * IMPORTANT — read this before wiring buttons to these functions.
 *
 * Browsers only run JS for a page while that page (or its service worker)
 * is alive. So there are two real tiers here:
 *
 * 1. LOCAL DEMO (works right now, no backend): `scheduleLocalReminder`
 *    below uses setTimeout to fire a real OS-level Notification, but only
 *    if this tab/app is still open (or, once installed as a PWA, for a
 *    while after backgrounding — not reliably for hours/days).
 *
 * 2. REAL "I closed the app and it still nagged me" behavior needs Web
 *    Push: a service worker + a backend that holds your push subscription
 *    and fires it via a cron job, even if runtime. isn't open at all.
 *    That's the `server/send-reminder.js` stub in this project — it needs
 *    your own VAPID keys + a database + a scheduled job (same shape as the
 *    RepSet email cron). I haven't deployed that part; it's scaffolded so
 *    you can wire it up when you're ready.
 */

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

/**
 * Fires a local notification after `delayMs` if the tab is still around.
 * `tier` picks the copy from PUSH_NOTIFICATIONS: 'nudge' | 'sassy' | 'savage'.
 */
export function scheduleLocalReminder(delayMs, tier = "sassy") {
  const payload = PUSH_NOTIFICATIONS[tier] || PUSH_NOTIFICATIONS.sassy;
  const timeoutId = setTimeout(() => {
    if (Notification.permission !== "granted") return;
    new Notification(payload.title, {
      body: payload.body,
      icon: "/bot-icon.svg",
      badge: "/bot-icon.svg",
      tag: "runtime-reminder",
    });
  }, delayMs);
  return timeoutId;
}

export function cancelReminder(timeoutId) {
  clearTimeout(timeoutId);
}
