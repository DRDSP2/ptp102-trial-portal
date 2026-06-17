import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/app';
import { handleRecoveryRedirect } from '@/lib/supabase/recovery';

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
