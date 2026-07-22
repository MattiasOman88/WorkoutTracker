const CACHE_NAME = "traningslogg-v127";
const ASSETS = [
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192-any.png",
  "./icons/icon-512-any.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
  "./icons/belt-white.png",
];
const CDN_ASSETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).then(() =>
        // CDN assets are best-effort: don't fail the whole install if one is unreachable.
        Promise.allSettled(CDN_ASSETS.map((u) => cache.add(u)))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Files that change often (the app itself) — always try the network first so
// updates show up immediately; fall back to cache only when offline.
const NETWORK_FIRST = ["index.html", "app.js", "manifest.json"];

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    // External (Chart.js CDN etc.) — network first, save a copy for offline use.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  const isAppShell = NETWORK_FIRST.some((name) => url.pathname.endsWith(name)) || url.pathname === "/" || url.pathname.endsWith("/");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Icons etc. — cache-first is fine, they rarely change.
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
