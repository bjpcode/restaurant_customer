import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import analytics from './utils/analytics';
import offline from './utils/offline';

// Performance monitoring (optional)
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((webVitals) => {
      // Use the correct function names from web-vitals v3+
      if (webVitals.onCLS) webVitals.onCLS(onPerfEntry);
      if (webVitals.onFID) webVitals.onFID(onPerfEntry);
      if (webVitals.onFCP) webVitals.onFCP(onPerfEntry);
      if (webVitals.onLCP) webVitals.onLCP(onPerfEntry);
      if (webVitals.onTTFB) webVitals.onTTFB(onPerfEntry);
      
      // Fallback for older versions
      if (webVitals.getCLS) webVitals.getCLS(onPerfEntry);
      if (webVitals.getFID) webVitals.getFID(onPerfEntry);
      if (webVitals.getFCP) webVitals.getFCP(onPerfEntry);
      if (webVitals.getLCP) webVitals.getLCP(onPerfEntry);
      if (webVitals.getTTFB) webVitals.getTTFB(onPerfEntry);
    }).catch((error) => {
      console.warn('Web Vitals loading failed:', error);
    });
  }
};

// Service Worker registration for PWA capabilities
const registerSW = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // In production, you might want to send this to an error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // In production, you might want to send this to an error tracking service
});

// Create React root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker
registerSW();

// Initialize analytics and offline support
try {
  analytics.init();
} catch (error) {
  console.warn('Analytics initialization failed:', error);
}

try {
  offline.init();
} catch (error) {
  console.warn('Offline initialization failed:', error);
}

// Start performance monitoring
reportWebVitals(console.log);

// Hot module replacement for development
if (module.hot) {
  module.hot.accept();
}