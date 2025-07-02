// Offline functionality and PWA utilities

// IndexedDB wrapper for offline storage
class OfflineStorage {
  constructor(dbName = 'restaurant-app', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('pending_orders')) {
          const orderStore = db.createObjectStore('pending_orders', { keyPath: 'id' });
          orderStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('cached_menu')) {
          const menuStore = db.createObjectStore('cached_menu', { keyPath: 'id' });
          menuStore.createIndex('category', 'category');
        }
        
        if (!db.objectStoreNames.contains('user_sessions')) {
          db.createObjectStore('user_sessions', { keyPath: 'sessionId' });
        }
        
        if (!db.objectStoreNames.contains('app_data')) {
          db.createObjectStore('app_data', { keyPath: 'key' });
        }
      };
    });
  }

  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...data,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...data,
        updated_at: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create storage instance
export const offlineStorage = new OfflineStorage();

// Offline order queue management
export const offlineOrderQueue = {
  async addPendingOrder(orderData) {
    try {
      await offlineStorage.init();
      const pendingOrder = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...orderData,
        status: 'pending_sync',
        created_offline: true,
        retry_count: 0
      };
      
      await offlineStorage.add('pending_orders', pendingOrder);
      return pendingOrder;
    } catch (error) {
      console.error('Failed to store pending order:', error);
      throw error;
    }
  },

  async getPendingOrders() {
    try {
      await offlineStorage.init();
      return await offlineStorage.getAll('pending_orders');
    } catch (error) {
      console.error('Failed to get pending orders:', error);
      return [];
    }
  },

  async syncPendingOrders() {
    const pendingOrders = await this.getPendingOrders();
    const syncResults = [];

    for (const order of pendingOrders) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...order,
            offline_id: order.id
          })
        });

        if (response.ok) {
          const syncedOrder = await response.json();
          await offlineStorage.delete('pending_orders', order.id);
          syncResults.push({ success: true, order: syncedOrder });
        } else {
          // Increment retry count
          await offlineStorage.update('pending_orders', {
            ...order,
            retry_count: order.retry_count + 1,
            last_retry: Date.now()
          });
          syncResults.push({ success: false, error: 'Server error', order });
        }
      } catch (error) {
        console.error('Failed to sync order:', order.id, error);
        syncResults.push({ success: false, error: error.message, order });
      }
    }

    return syncResults;
  },

  async retryFailedOrders() {
    const pendingOrders = await this.getPendingOrders();
    const failedOrders = pendingOrders.filter(order => 
      order.retry_count < 3 && 
      (!order.last_retry || Date.now() - order.last_retry > 30000) // 30 second delay
    );

    if (failedOrders.length > 0) {
      return await this.syncPendingOrders();
    }

    return [];
  }
};

// Offline menu caching
export const offlineMenuCache = {
  async cacheMenu(menuItems) {
    try {
      await offlineStorage.init();
      
      // Clear existing cache
      await offlineStorage.clear('cached_menu');
      
      // Cache new menu items
      for (const item of menuItems) {
        await offlineStorage.add('cached_menu', {
          ...item,
          cached_at: Date.now()
        });
      }
      
      // Store cache metadata
      await offlineStorage.update('app_data', {
        key: 'menu_cache_info',
        last_updated: Date.now(),
        item_count: menuItems.length
      });
    } catch (error) {
      console.error('Failed to cache menu:', error);
    }
  },

  async getCachedMenu() {
    try {
      await offlineStorage.init();
      const cachedItems = await offlineStorage.getAll('cached_menu');
      
      // Check if cache is still valid (24 hours)
      const cacheInfo = await offlineStorage.get('app_data', 'menu_cache_info');
      if (cacheInfo && Date.now() - cacheInfo.last_updated > 24 * 60 * 60 * 1000) {
        return null; // Cache expired
      }
      
      return cachedItems;
    } catch (error) {
      console.error('Failed to get cached menu:', error);
      return null;
    }
  },

  async isCacheValid() {
    try {
      const cacheInfo = await offlineStorage.get('app_data', 'menu_cache_info');
      return cacheInfo && Date.now() - cacheInfo.last_updated < 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }
};

// Network status monitoring
export const networkMonitor = {
  isOnline: navigator.onLine,
  listeners: new Set(),

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
      this.handleOffline();
    });
  },

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  },

  async handleOnline() {
    console.log('Connection restored - syncing data...');
    
    try {
      // Sync pending orders
      const syncResults = await offlineOrderQueue.syncPendingOrders();
      
      if (syncResults.length > 0) {
        const successCount = syncResults.filter(r => r.success).length;
        const failureCount = syncResults.filter(r => !r.success).length;
        
        console.log(`Sync completed: ${successCount} successful, ${failureCount} failed`);
        
        // Notify user
        if (window.showNotification) {
          window.showNotification({
            type: successCount > 0 ? 'success' : 'warning',
            message: `${successCount} orders synced successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  handleOffline() {
    console.log('Connection lost - entering offline mode...');
    
    // Notify user
    if (window.showNotification) {
      window.showNotification({
        type: 'warning',
        message: 'You are now offline. Orders will be saved and synced when connection is restored.',
        duration: 5000
      });
    }
  }
};

// PWA installation helpers
export const pwaHelpers = {
  deferredPrompt: null,

  init() {
    // Listen for the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  },

  async promptInstall() {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const choiceResult = await this.deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    this.deferredPrompt = null;
    return choiceResult.outcome === 'accepted';
  },

  showInstallButton() {
    // Show install button in UI
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  },

  hideInstallButton() {
    // Hide install button
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  },

  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }
};

// Background sync for offline functionality
export const backgroundSync = {
  async register(tag, data) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Store data for sync
        await offlineStorage.init();
        await offlineStorage.update('app_data', {
          key: `sync_${tag}`,
          data,
          timestamp: Date.now()
        });
        
        // Register background sync
        return registration.sync.register(tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  },

  async getSyncData(tag) {
    try {
      await offlineStorage.init();
      const syncData = await offlineStorage.get('app_data', `sync_${tag}`);
      return syncData?.data || null;
    } catch (error) {
      console.error('Failed to get sync data:', error);
      return null;
    }
  },

  async clearSyncData(tag) {
    try {
      await offlineStorage.init();
      await offlineStorage.delete('app_data', `sync_${tag}`);
    } catch (error) {
      console.error('Failed to clear sync data:', error);
    }
  }
};

// Initialize offline functionality
export const initOfflineSupport = async () => {
  try {
    // Initialize storage
    await offlineStorage.init();
    
    // Initialize network monitoring
    networkMonitor.init();
    
    // Initialize PWA helpers
    pwaHelpers.init();
    
    // Set up periodic sync retry
    setInterval(() => {
      if (networkMonitor.isOnline) {
        offlineOrderQueue.retryFailedOrders();
      }
    }, 60000); // Check every minute
    
    console.log('Offline support initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize offline support:', error);
    return false;
  }
};

// Export all offline utilities
export default {
  storage: offlineStorage,
  orders: offlineOrderQueue,
  menu: offlineMenuCache,
  network: networkMonitor,
  pwa: pwaHelpers,
  sync: backgroundSync,
  init: initOfflineSupport
};