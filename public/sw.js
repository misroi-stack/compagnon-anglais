const CACHE_NAME = "compagnon-anglais-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Ne mettre en cache que les ressources de l'app elle-même — jamais les
  // appels réseau vers Supabase (données dynamiques, jamais servir une
  // réponse périmée quand le réseau est indisponible).
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(event.request);
        return cached ?? Response.error();
      }
    })
  );
});
