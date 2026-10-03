// İnternetsiz çalışma: uygulama dosyalarını ve yazı tiplerini önbellekte tutar.
const CACHE = "rutin-v18";
const FILES = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Önce ağ, yoksa önbellek: güncellemeler hemen gelir, internet yokken de açılır.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // senkron verisi (GitHub API) asla önbelleğe alınmaz
  if (/(^|\.)github(usercontent)?\.com$/.test(new URL(e.request.url).hostname)) return;
  // sayfanın kendisi her açılışta sunucuya sorulur (eski sürüm önbellekte takılı kalmasın)
  const fresh = e.request.mode === "navigate" || /\.(html|webmanifest)$|\/$/.test(new URL(e.request.url).pathname);
  e.respondWith(
    fetch(e.request, fresh ? { cache: "no-cache" } : undefined)
      .then(res => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
