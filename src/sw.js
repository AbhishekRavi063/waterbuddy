import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  let payload = {
    title: "Water Buddy says drink water",
    body: "Your hydration sidekick has arrived with dramatic concern.",
    tag: "water-buddy-generic",
    data: {
      url: "/",
    },
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: payload.tag,
      data: payload.data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(destination);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(destination);
      }

      return undefined;
    })
  );
});
