/* TRENO · service worker
 * - Guarda la app en el dispositivo para que abra rápido y sin internet.
 * - Páginas: red primero (siempre la versión nueva) y, si no hay señal, la guardada.
 * - Archivos estáticos (JS, CSS, fuentes, íconos): sirve lo guardado y lo actualiza por detrás.
 * - Los datos del usuario viven en localStorage, no aquí: este archivo no toca nada personal.
 */
const VERSION = "treno-v1";
const BASE = ["./", "./manifest.json", "./icon.svg", "./icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(BASE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fotos externas, etc.: directo a la red

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(VERSION).then((c) => c.put("./", copia));
          return res;
        })
        .catch(() => caches.match("./").then((r) => r || caches.match(req)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((guardado) => {
      const red = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copia = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      if (ventanas.length) return ventanas[0].focus();
      return self.clients.openWindow("./");
    })
  );
});
