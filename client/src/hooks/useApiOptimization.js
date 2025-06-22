// hooks/useApiOptimization.js
import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for optimizing API calls with debouncing, caching, and rate limiting
 */
export const useApiOptimization = () => {
  const cache = useRef(new Map());
  const requestQueue = useRef(new Map());
  const lastRequestTimes = useRef(new Map());
  
  // Default configuration
  const defaultConfig = {
    cacheTime: 5 * 60 * 1000, // 5 minutes
    minInterval: 1000, // 1 second minimum between requests
    debounceDelay: 300, // 300ms debounce
    maxRetries: 3,
    retryDelay: 1000,
  };

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((key, cacheTime = defaultConfig.cacheTime) => {
    const cached = cache.current.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cacheTime;
  }, []);

  /**
   * Get cached data if valid
   */
  const getCachedData = useCallback((key) => {
    const cached = cache.current.get(key);
    return cached ? cached.data : null;
  }, []);

  /**
   * Set cache data
   */
  const setCacheData = useCallback((key, data) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  /**
   * Check if we can make a request based on rate limiting
   */
  const canMakeRequest = useCallback((key, minInterval = defaultConfig.minInterval) => {
    const lastTime = lastRequestTimes.current.get(key);
    if (!lastTime) return true;
    
    const now = Date.now();
    return (now - lastTime) >= minInterval;
  }, []);

  /**
   * Optimized API call with caching and rate limiting
   */
  const optimizedApiCall = useCallback(async (
    key, 
    apiFunction, 
    config = {}
  ) => {
    const mergedConfig = { ...defaultConfig, ...config };
    
    // Check cache first
    if (isCacheValid(key, mergedConfig.cacheTime) && !config.bypassCache) {
      console.log(`[API Optimization] Using cached data for ${key}`);
      return getCachedData(key);
    }

    // Check rate limiting
    if (!canMakeRequest(key, mergedConfig.minInterval)) {
      console.log(`[API Optimization] Rate limited for ${key}, using cache if available`);
      const cachedData = getCachedData(key);
      if (cachedData) return cachedData;
      
      // If no cache and rate limited, wait
      const lastTime = lastRequestTimes.current.get(key);
      const waitTime = mergedConfig.minInterval - (Date.now() - lastTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check if request is already in progress
    if (requestQueue.current.has(key)) {
      console.log(`[API Optimization] Request already in progress for ${key}, waiting...`);
      return requestQueue.current.get(key);
    }

    // Make the API call
    const requestPromise = (async () => {
      let retries = 0;
      
      while (retries < mergedConfig.maxRetries) {
        try {
          console.log(`[API Optimization] Making API call for ${key} (attempt ${retries + 1})`);
          lastRequestTimes.current.set(key, Date.now());
          
          const result = await apiFunction();
          
          // Cache successful results
          if (result !== undefined && result !== null) {
            setCacheData(key, result);
          }
          
          requestQueue.current.delete(key);
          return result;
          
        } catch (error) {
          retries++;
          console.warn(`[API Optimization] API call failed for ${key} (attempt ${retries}):`, error);
          
          if (retries >= mergedConfig.maxRetries) {
            requestQueue.current.delete(key);
            
            // Return cached data if available on error
            const cachedData = getCachedData(key);
            if (cachedData) {
              console.log(`[API Optimization] Returning cached data due to API error for ${key}`);
              return cachedData;
            }
            
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay * retries));
        }
      }
    })();

    requestQueue.current.set(key, requestPromise);
    return requestPromise;
  }, [isCacheValid, getCachedData, setCacheData, canMakeRequest]);

  /**
   * Debounced API call
   */
  const debouncedApiCall = useCallback((
    key,
    apiFunction,
    config = {}
  ) => {
    const timeoutKey = `${key}_timeout`;
    const existingTimeout = requestQueue.current.get(timeoutKey);
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await optimizedApiCall(key, apiFunction, config);
          requestQueue.current.delete(timeoutKey);
          resolve(result);
        } catch (error) {
          requestQueue.current.delete(timeoutKey);
          reject(error);
        }
      }, config.debounceDelay || defaultConfig.debounceDelay);
      
      requestQueue.current.set(timeoutKey, timeout);
    });
  }, [optimizedApiCall]);

  /**
   * Clear cache for specific key or all
   */
  const clearCache = useCallback((key = null) => {
    if (key) {
      cache.current.delete(key);
      console.log(`[API Optimization] Cleared cache for ${key}`);
    } else {
      cache.current.clear();
      console.log(`[API Optimization] Cleared all cache`);
    }
  }, []);

  /**
   * Prefetch data
   */
  const prefetch = useCallback(async (key, apiFunction, config = {}) => {
    if (!isCacheValid(key, config.cacheTime)) {
      try {
        await optimizedApiCall(key, apiFunction, { ...config, silent: true });
        console.log(`[API Optimization] Prefetched data for ${key}`);
      } catch (error) {
        console.warn(`[API Optimization] Prefetch failed for ${key}:`, error);
      }
    }
  }, [optimizedApiCall, isCacheValid]);

  /**
   * Get cache stats for debugging
   */
  const getCacheStats = useCallback(() => {
    return {
      cacheSize: cache.current.size,
      activeRequests: requestQueue.current.size,
      cachedKeys: Array.from(cache.current.keys())
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      requestQueue.current.forEach((value, key) => {
        if (key.endsWith('_timeout')) {
          clearTimeout(value);
        }
      });
      requestQueue.current.clear();
    };
  }, []);

  return {
    optimizedApiCall,
    debouncedApiCall,
    clearCache,
    prefetch,
    getCacheStats,
    isCacheValid,
    getCachedData
  };
};

export default useApiOptimization;
