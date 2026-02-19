import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Helper to detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Register service worker for PWA (with iOS safety)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the main SW (safe for iOS)
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Main SW registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('Main SW registration failed:', error);
      });

    // Only register Firebase messaging SW on non-iOS devices
    if (!isIOS()) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Firebase Messaging SW registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('Firebase Messaging SW registration failed:', error);
        });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

