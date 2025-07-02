// Performance optimization utilities

// Debounce function for search and input optimization
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function for scroll and resize events
export const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Lazy loading hook for images
export const useLazyLoading = (ref, threshold = 0.1) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, threshold]);

  return { isLoaded, setIsLoaded, isInView };
};

// Memoization helper for expensive calculations
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

// Image optimization utilities
export const getOptimizedImageUrl = (url, width = 300, quality = 80) => {
  if (!url) return null;
  
  // If it's already optimized or local, return as-is
  if (url.includes('w_') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  
  // Add optimization parameters for Cloudinary or similar services
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w_${width}&q_${quality}&f_auto`;
};

// Preload critical resources
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Bundle splitting helpers
export const lazyImport = (importFunc) => {
  return React.lazy(() => 
    importFunc().catch(() => ({
      default: () => <div>Error loading component</div>
    }))
  );
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && end - start > 100) {
      // Analytics.track('slow_operation', { name, duration: end - start });
    }
    
    return result;
  };
};

// Virtual scrolling calculations
export const calculateVisibleItems = (
  containerHeight,
  itemHeight,
  scrollTop,
  totalItems,
  overscan = 5
) => {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  );
  
  return {
    start: Math.max(0, visibleStart - overscan),
    end: Math.min(totalItems - 1, visibleEnd + overscan),
    visibleStart,
    visibleEnd
  };
};

// Resource loading priority
export const loadWithPriority = async (resources, maxConcurrent = 3) => {
  const results = [];
  const executing = [];
  
  for (const resource of resources) {
    const promise = resource().then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    
    results.push(promise);
    executing.push(promise);
    
    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
};

// Critical resource hints
export const addResourceHints = () => {
  // Preconnect to external domains
  const domains = [
    'https://fonts.googleapis.com',
    'https://your-supabase-url.supabase.co',
    'https://your-api-domain.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Memory cleanup utilities
export const cleanup = {
  timeouts: new Set(),
  intervals: new Set(),
  listeners: new Map(),
  
  setTimeout(fn, delay) {
    const id = setTimeout(() => {
      fn();
      this.timeouts.delete(id);
    }, delay);
    this.timeouts.add(id);
    return id;
  },
  
  setInterval(fn, delay) {
    const id = setInterval(fn, delay);
    this.intervals.add(id);
    return id;
  },
  
  addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    this.listeners.get(element).push({ event, handler });
  },
  
  clearAll() {
    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
    
    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    // Remove event listeners
    this.listeners.forEach((events, element) => {
      events.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();
  }
};

// Web Workers for heavy computations
export const createWorker = (workerFunction) => {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript'
  });
  
  return new Worker(URL.createObjectURL(blob));
};

// Service worker communication
export const sendMessageToSW = (message) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
};

// Battery API optimization
export const getBatteryInfo = async () => {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      return {
        charging: battery.charging,
        level: battery.level,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (error) {
      console.warn('Battery API not available:', error);
      return null;
    }
  }
  return null;
};

// Network information for adaptive loading
export const getNetworkInfo = () => {
  if ('connection' in navigator) {
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }
  return null;
};

// Adaptive loading based on device capabilities
export const shouldUseHighQuality = () => {
  const network = getNetworkInfo();
  
  // Use lower quality on slow networks or data saver mode
  if (network?.saveData || network?.effectiveType === 'slow-2g' || network?.effectiveType === '2g') {
    return false;
  }
  
  // Use lower quality on low-end devices
  if (navigator.hardwareConcurrency < 4) {
    return false;
  }
  
  return true;
};