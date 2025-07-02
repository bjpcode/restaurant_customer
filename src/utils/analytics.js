// Analytics and monitoring utilities

// Performance monitoring
export const performanceMonitor = {
  // Track Core Web Vitals
  trackWebVitals() {
    if (typeof window === 'undefined') return;
    
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        this.reportMetric('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  },
  
  // Track custom metrics
  reportMetric(name, value, labels = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Metric: ${name}`, value, labels);
      return;
    }
    
    // Send to analytics service
    this.sendToAnalytics('performance_metric', {
      metric_name: name,
      metric_value: value,
      timestamp: Date.now(),
      ...labels
    });
  },
  
  // Measure function execution time
  measure(name, fn) {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      this.reportMetric('function_duration', duration, { function_name: name });
      return result;
    };
  },
  
  // Track resource loading times
  trackResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.initiatorType) {
          this.reportMetric('resource_load_time', entry.duration, {
            resource_type: entry.initiatorType,
            resource_name: entry.name
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  },
  
  sendToAnalytics(event, data) {
    // Integration with analytics services
    if (window.gtag) {
      window.gtag('event', event, data);
    }
    
    // Send to custom analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: Date.now() })
    }).catch(console.error);
  }
};

// User behavior tracking
export const userTracker = {
  // Track page views
  trackPageView(path, title) {
    this.track('page_view', {
      page_path: path,
      page_title: title,
      timestamp: Date.now()
    });
  },
  
  // Track user interactions
  trackInteraction(action, element, details = {}) {
    this.track('user_interaction', {
      action,
      element,
      timestamp: Date.now(),
      ...details
    });
  },
  
  // Track cart events
  trackCartEvent(action, item, quantity = 1) {
    this.track('cart_event', {
      action, // add, remove, update, clear
      item_id: item.id,
      item_name: item.name,
      item_price: item.price,
      quantity,
      timestamp: Date.now()
    });
  },
  
  // Track order events
  trackOrderEvent(action, order) {
    this.track('order_event', {
      action, // start, submit, complete, cancel
      order_id: order.id,
      order_total: order.total_amount,
      item_count: order.order_items?.length || 0,
      table_number: order.table_number,
      timestamp: Date.now()
    });
  },
  
  // Track search behavior
  trackSearch(query, results_count, filters = {}) {
    this.track('search', {
      search_query: query,
      results_count,
      filters,
      timestamp: Date.now()
    });
  },
  
  // Track errors
  trackError(error, context = {}) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_type: error.name,
      context,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      url: window.location.href
    });
  },
  
  // Generic tracking function
  track(event, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics: ${event}`, data);
      return;
    }
    
    // Add session information
    const sessionData = {
      session_id: this.getSessionId(),
      user_id: this.getUserId(),
      device_type: this.getDeviceType(),
      ...data
    };
    
    performanceMonitor.sendToAnalytics(event, sessionData);
  },
  
  // Helper methods
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  },
  
  getUserId() {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  },
  
  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
};

// Error tracking and reporting
export const errorTracker = {
  init() {
    // Capture global errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
    
    // Capture React errors (to be used with error boundaries)
    this.captureReactErrors();
  },
  
  reportError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: Date.now(),
      url: window.location.href,
      user_agent: navigator.userAgent,
      context
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorInfo);
    }
    
    // Send to error tracking service
    this.sendErrorToService(errorInfo);
    
    // Track in analytics
    userTracker.trackError(error, context);
  },
  
  sendErrorToService(errorInfo) {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo)
    }).catch(() => {
      // Fallback: store in localStorage for later sync
      const errors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
      errors.push(errorInfo);
      localStorage.setItem('pending_errors', JSON.stringify(errors.slice(-10))); // Keep last 10
    });
  },
  
  captureReactErrors() {
    // This would be integrated with error boundaries
    window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
      onError: (error, errorInfo) => {
        this.reportError(error, {
          type: 'react_error',
          component_stack: errorInfo.componentStack
        });
      }
    };
  }
};

// A/B testing framework
export const abTesting = {
  experiments: new Map(),
  
  // Define an experiment
  defineExperiment(experimentId, variations, defaultVariation = 'control') {
    this.experiments.set(experimentId, {
      variations,
      defaultVariation,
      userVariation: this.getUserVariation(experimentId, variations, defaultVariation)
    });
  },
  
  // Get user's variation for an experiment
  getVariation(experimentId) {
    const experiment = this.experiments.get(experimentId);
    return experiment ? experiment.userVariation : null;
  },
  
  // Track experiment exposure
  trackExposure(experimentId) {
    const variation = this.getVariation(experimentId);
    if (variation) {
      userTracker.track('experiment_exposure', {
        experiment_id: experimentId,
        variation
      });
    }
  },
  
  // Track experiment conversion
  trackConversion(experimentId, conversionEvent, value = 1) {
    const variation = this.getVariation(experimentId);
    if (variation) {
      userTracker.track('experiment_conversion', {
        experiment_id: experimentId,
        variation,
        conversion_event: conversionEvent,
        value
      });
    }
  },
  
  getUserVariation(experimentId, variations, defaultVariation) {
    // Consistent user bucketing based on user ID
    const userId = userTracker.getUserId();
    const hash = this.hashString(userId + experimentId);
    const bucket = hash % 100;
    
    // Simple even distribution for now
    const variationIndex = Math.floor(bucket / (100 / variations.length));
    return variations[variationIndex] || defaultVariation;
  },
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
};

// Initialize analytics
export const initAnalytics = () => {
  // Initialize performance monitoring
  performanceMonitor.trackWebVitals();
  performanceMonitor.trackResourceTiming();
  
  // Initialize error tracking
  errorTracker.init();
  
  // Track initial page view
  userTracker.trackPageView(window.location.pathname, document.title);
  
  // Set up route change tracking for SPAs
  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    originalPushState.apply(window.history, args);
    userTracker.trackPageView(window.location.pathname, document.title);
  };
  
  console.log('Analytics initialized');
};

// Export default analytics object
export default {
  performance: performanceMonitor,
  user: userTracker,
  error: errorTracker,
  ab: abTesting,
  init: initAnalytics
};