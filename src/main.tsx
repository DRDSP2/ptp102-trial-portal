import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/app';
import { handleRecoveryRedirect } from '@/lib/supabase/recovery';

// Register the PWA service worker in production builds only. In dev/test the
// SW would interfere with HMR and the module graph, and tests run without it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW registration is best-effort; the app works without it */
    });
  });
}

// Handle Supabase recovery redirect BEFORE the router mounts, so the
// URL-hash fragment (`#access_token=…&type=recovery`) doesn't collide
// with HashRouter's route parsing.
handleRecoveryRedirect().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
