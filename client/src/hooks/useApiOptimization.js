import { useRef, useCallback, useEffect } from 'react';

export const useApiOptimization = () => {
  const cache = useRef(new Map());
  const requestQueue = useRef(new Map());
  const lastRequestTimes = useRef(new Map());
 
  const defaultConfig = {
    cacheTime: 5 * 60 * 1000, 
    minInterval: 1000, 
    debounceDelay: 300, 
    maxRetries: 3,
    retryDelay: 1000,
  };

  const isCacheValid = useCallback((key, cacheTime = defaultConfig.cacheTime) => {
    const cached = cache.current.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cacheTime;
  }, []);


  const getCachedData = useCallback((key) => {
    const cached = cache.current.get(key);
    return cached ? cached.data : null;
  }, []);


  const setCacheData = useCallback((key, data) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const canMakeRequest = useCallback((key, minInterval = defaultConfig.minInterval) => {
    const lastTime = lastRequestTimes.current.get(key);
    if (!lastTime) return true;
    
    const now = Date.now();
    return (now - lastTime) >= minInterval;
  }, []);


  const optimizedApiCall = useCallback(async (
    key, 
    apiFunction, 
    config = {}
  ) => {
    const mergedConfig = { ...defaultConfig, ...config };

    if (isCacheValid(key, mergedConfig.cacheTime) && !config.bypassCache) {
      //(`[API Optimization] Using cached data for ${key}`);
      return getCachedData(key);
    }

    if (!canMakeRequest(key, mergedConfig.minInterval)) {
      //(`[API Optimization] Rate limited for ${key}, using cache if available`);
      const cachedData = getCachedData(key);
      if (cachedData) return cachedData;

      const lastTime = lastRequestTimes.current.get(key);
      const waitTime = mergedConfig.minInterval - (Date.now() - lastTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check if request is already in progress
    if (requestQueue.current.has(key)) {
      //(`[API Optimization] Request already in progress for ${key}, waiting...`);
      return requestQueue.current.get(key);
    }

 
    const requestPromise = (async () => {
      let retries = 0;
      
      while (retries < mergedConfig.maxRetries) {
        try {
          lastRequestTimes.current.set(key, Date.now());
          
          const result = await apiFunction();

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
            const cachedData = getCachedData(key);
            if (cachedData) {
              //(`[API Optimization] Returning cached data due to API error for ${key}`);
              return cachedData;
            }
            
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay * retries));
        }
      }
    })();

    requestQueue.current.set(key, requestPromise);
    return requestPromise;
  }, [isCacheValid, getCachedData, setCacheData, canMakeRequest]);

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


  const clearCache = useCallback((key = null) => {
    if (key) {
      cache.current.delete(key);
      //(`[API Optimization] Cleared cache for ${key}`);
    } else {
      cache.current.clear();
      //(`[API Optimization] Cleared all cache`);
    }
  }, []);

 
  const prefetch = useCallback(async (key, apiFunction, config = {}) => {
    if (!isCacheValid(key, config.cacheTime)) {
      try {
        await optimizedApiCall(key, apiFunction, { ...config, silent: true });
        //(`[API Optimization] Prefetched data for ${key}`);
      } catch (error) {
        console.warn(`[API Optimization] Prefetch failed for ${key}:`, error);
      }
    }
  }, [optimizedApiCall, isCacheValid]);


  const getCacheStats = useCallback(() => {
    return {
      cacheSize: cache.current.size,
      activeRequests: requestQueue.current.size,
      cachedKeys: Array.from(cache.current.keys())
    };
  }, []);


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
