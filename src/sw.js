import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

function getNotificationOptions(payload) {
  return {
    body: payload.body,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: payload.tag,
    data: payload.data,
    actions: [
      { action: "mark-drank", title: "I drank" },
      { action: "open-app", title: "Open app" },
    ],
  };
}

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
    self.registration.showNotification(payload.title, getNotificationOptions(payload))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const params = new URLSearchParams();
  if (event.action === "mark-drank") {
    params.set("hydrate", "1");
    params.set("source", "notification");
  }

  const baseDestination = event.notification.data?.url ?? "/";
  const destination = params.size ? `${baseDestination}?${params.toString()}` : baseDestination;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (event.action === "mark-drank") {
          client.postMessage({
            type: "HYDRATE_FROM_NOTIFICATION",
            source: "notification",
          });
        }

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
