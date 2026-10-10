import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { apiFetch } from './api'

// Register service worker and expose helpers on window for diagnostics
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('[SW] Registered, scope:', registration.scope, 'state:', 
          registration.active?.state || registration.installing?.state || registration.waiting?.state);
      })
      .catch(err => {
        console.error('[SW] Registration failed:', err);
      });
  });

  // Listen for messages from service worker (notification click)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
      window.location.href = event.data.url;
    }
  });
}

// Expose test function globally for quick testing from console
window.testNotification = async () => {
  if (!('Notification' in window)) {
    console.error('Notification API not available');
    return;
  }
  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      console.error('Permission denied:', perm);
      return;
    }
  }
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Vision404 — Test Notification', {
      body: 'If visible, browser→Windows notification is working!',
      icon: '/favicon.svg',
      requireInteraction: true
    });
    console.log('[Test] Service worker showNotification fired');
  } else {
    const n = new Notification('Vision404 — Test Notification', {
      body: 'If visible, browser→Windows notification is working!',
      icon: '/favicon.svg',
      requireInteraction: true
    });
    n.onclick = () => { window.focus(); n.close(); };
    console.log('[Test] Local notification fired');
  }
};

// Expose backend push test
window.testPushNotification = async () => {
  try {
    const data = await apiFetch('/notifications/test', { method: 'POST' });
    console.log('[Push] Backend test results (full object):', JSON.stringify(data, null, 2));
    if (data && Array.isArray(data.results)) {
      data.results.forEach((r, idx) => {
        console.log(`[Push] Result #${idx + 1}: status=${r.status} error=${r.error || 'none'} endpoint=${r.endpoint}`);
      });
    }
    return data;
  } catch (e) {
    console.error('[Push] Backend test error:', e);
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
