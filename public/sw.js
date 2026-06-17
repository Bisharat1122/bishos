/* bishOS service worker — desktop task notifications */

self.addEventListener("push", (event) => {
  const run = async () => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (e) {
      data = { title: "bishOS", body: event.data ? event.data.text() : "" };
    }
    const title = data.title || "bishOS";

    // If a bishOS tab is open, play our own chime in the page and silence the
    // OS sound so they don't double up. If nothing's open, let the OS sound.
    const clientsArr = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hasOpen = clientsArr.length > 0;

    await self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      renotify: true,
      silent: hasOpen,
      data: { href: data.href || "/tasks" },
    });

    if (hasOpen) {
      for (const c of clientsArr) c.postMessage({ type: "bishos-chime" });
    }
  };
  event.waitUntil(run());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/tasks";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(href).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(href);
    }),
  );
});
