import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registrar service worker customizado
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Forçar verificação de atualização do SW
        registration.update();
        
        // Quando um novo SW estiver pronto, ativar imediatamente
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Nova versão do Service Worker disponível');
                // Ativar o novo SW imediatamente
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('❌ Falha ao registrar Service Worker:', error);
      });
  });

  // Recarregar a página quando um novo SW assumir o controle
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Novo Service Worker ativo, recarregando...');
  });
}
