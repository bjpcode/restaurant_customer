const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-lambda-api.amazonaws.com';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Menu endpoints
  async fetchMenu(category = null) {
    const params = category ? { category } : {};
    return this.get('/menu', params);
  }

  async getMenuItem(id) {
    return this.get(`/menu/${id}`);
  }

  async checkMenuAvailability(itemIds) {
    return this.post('/menu/check-availability', { itemIds });
  }

  // Order endpoints
  async submitOrder(orderData) {
    return this.post('/orders', orderData);
  }

  async getOrder(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async getOrdersBySession(sessionId) {
    return this.get('/orders', { sessionId });
  }

  async updateOrderStatus(orderId, status) {
    return this.put(`/orders/${orderId}/status`, { status });
  }

  async cancelOrder(orderId) {
    return this.delete(`/orders/${orderId}`);
  }

  // Table endpoints
  async validateTable(tableNumber) {
    return this.get(`/tables/${tableNumber}/validate`);
  }

  // Analytics endpoints (optional)
  async getOrderStats(sessionId) {
    return this.get('/analytics/orders', { sessionId });
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export individual methods for convenience
export const {
  fetchMenu,
  getMenuItem,
  checkMenuAvailability,
  submitOrder,
  getOrder,
  getOrdersBySession,
  updateOrderStatus,
  cancelOrder,
  validateTable,
  getOrderStats,
  healthCheck
} = apiService;

export default apiService;

// Retry utility for failed requests
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// Cache utility for menu data
class SimpleCache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

export const menuCache = new SimpleCache();

// Network status utility
export const isOnline = () => {
  return navigator.onLine;
};

export const onNetworkChange = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};