// Service Worker customizado para evitar cachear requisições POST
const CACHE_NAME = 'tjpb-meta-tracker-v1';

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache aberto');
      return cache.addAll([
        '/',
        '/index.html',
      ]);
    })
  );
  self.skipWaiting();
});

// Ativar o service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições - APENAS GET
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não sejam GET (POST, PUT, DELETE, etc)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para Supabase (sempre buscar do servidor)
  if (event.request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retornar do cache se existir, senão buscar da rede
      return response || fetch(event.request).then((fetchResponse) => {
        // Cachear apenas recursos estáticos (não APIs)
        if (fetchResponse && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback offline (opcional)
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
