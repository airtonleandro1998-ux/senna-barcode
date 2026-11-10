const CACHE_NAME = "senna-performance-v2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

// Instalar y guardar los archivos principales
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS))
  );

  self.skipWaiting();
});

// Activar la nueva versión y eliminar cachés antiguos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Actualizar archivos de la aplicación sin interceptar la API
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copia = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copia);
          });
        }

        return response;
      })
      .catch(async () => {
        const guardado = await caches.match(request);

        if (guardado) return guardado;

        return new Response("Sin conexión", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      })
  );
});
