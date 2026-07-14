/* =====================================================================
   sw.js — service worker for offline support
   ---------------------------------------------------------------------
   Strategy:
   - App shell (html/css/js/icons): cache-first, so it opens instantly and
     works with no connection (on the plane, in the metro, dodgy eSIM).
   - Weather / currency APIs: network-first with a cache fallback, so you
     get fresh numbers when online but still see the last values offline.
   Bump CACHE_VERSION whenever the shell files change to force an update.
   ===================================================================== */
const CACHE_VERSION = "rach-itin-v38";
const SHELL_CACHE = CACHE_VERSION + "-shell";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css?v=27",
  "./js/data.js?v=12",
  "./js/app.js?v=26",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon.ico",
  "./assets/icons/favicon-16.png",
  "./assets/icons/favicon-32.png",
  // City header photos (small WebP ~2.6MB total) — precached so every day
  // card shows its image offline, on the plane or a dodgy eSIM.
  "./assets/photos/beijing.webp",
  "./assets/photos/disneyland.webp",
  "./assets/photos/gotokujitemple.webp",
  "./assets/photos/greatwall.webp",
  "./assets/photos/kamakura.webp",
  "./assets/photos/katsuojitemple.webp",
  "./assets/photos/kichijoji.webp",
  "./assets/photos/kyoto.webp",
  "./assets/photos/nara.webp",
  "./assets/photos/osaka.webp",
  "./assets/photos/shanghai.webp",
  "./assets/photos/shibuya.webp",
  "./assets/photos/suzhou.webp",
  "./assets/photos/tokyo.webp",
  "./assets/photos/wildanimalpark.webp",
  "./assets/photos/wukang.webp",
  "./assets/photos/yokohama.webp",
  "./assets/photos/yugarden.webp",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      // Add individually so one missing asset doesn't abort the whole install.
      return Promise.all(
        SHELL_ASSETS.map(function (url) {
          return cache.add(url).catch(function () { /* ignore */ });
        })
      );
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k.indexOf(CACHE_VERSION) !== 0; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Weather & currency APIs → network-first, fall back to cached response.
  const isApi =
    url.hostname.indexOf("open-meteo.com") !== -1 ||
    url.hostname.indexOf("er-api.com") !== -1;
  if (isApi) {
    event.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // Same-origin shell/assets → cache-first, update in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        const network = fetch(req).then(function (res) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
  }
});
