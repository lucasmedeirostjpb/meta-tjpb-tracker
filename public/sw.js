// Service Worker com estratégia Network-First para evitar dados antigos
const CACHE_NAME = 'tjpb-meta-tracker-v2';
const STATIC_ASSETS = ['/', '/index.html'];

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache aberto');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativar o service worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando v2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições - Estratégia NETWORK-FIRST
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não sejam GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para Supabase (sempre buscar do servidor)
  if (event.request.url.includes('supabase')) {
    return;
  }

  // Ignorar requisições de API/dados
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('rest/v1') ||
      event.request.headers.get('accept')?.includes('application/json')) {
    return;
  }

  // Para recursos estáticos: NETWORK-FIRST (tentar rede primeiro, cache como fallback)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a rede respondeu, atualizar o cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhou, tentar o cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback para index.html em rotas de navegação
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Escutar mensagens para limpar cache manualmente
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});
