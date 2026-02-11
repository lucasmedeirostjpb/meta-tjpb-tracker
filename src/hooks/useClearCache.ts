export const clearAllCaches = async () => {
  // Limpar caches do Service Worker
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✅ Caches limpos');
  }

  // Enviar mensagem para o SW limpar também
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('CLEAR_CACHE');
  }

  // Forçar reload do SW
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.update();
    }
  }
};

// Hook para usar em componentes
export const useClearCache = () => {
  const clearAndReload = async () => {
    await clearAllCaches();
    window.location.reload();
  };

  return { clearAndReload, clearAllCaches };
};
