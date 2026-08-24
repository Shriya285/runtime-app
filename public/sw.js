// Minimal service worker for runtime.
// Handles two things: real Web Push events from your backend (once wired up),
// and clicks on any notification, local or pushed, to focus/open the app.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fires when your backend sends a real push (see server/send-reminder.js).
// Payload shape expected: { title, body }
self.addEventListener("push", (event) => {
  let data = { title: "runtime.", body: "Your streak misses you." };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // fall back to default copy above
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/bot-icon.svg",
      badge: "/bot-icon.svg",
      tag: "runtime-reminder",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
