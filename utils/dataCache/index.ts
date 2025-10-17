import { useState, useEffect } from 'react';

interface CacheData {
  timestamp: number;
  data: any;
}

interface CacheConfig {
  expirationTime?: number; // Time in milliseconds
}

const DEFAULT_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheKeys = {
  SOIL_DATA: 'soil_data',
  WEATHER_DATA: 'weather_data',
  POPULATION_DATA: 'population_data',
  // Add more cache keys as needed
};

export const saveToCache = (key: string, data: any, config: CacheConfig = {}) => {
  const cacheData: CacheData = {
    timestamp: Date.now(),
    data,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Error saving to cache:', error);
    return false;
  }
};

export const getFromCache = (key: string, config: CacheConfig = {}) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { timestamp, data }: CacheData = JSON.parse(cached);
    const expirationTime = config.expirationTime || DEFAULT_EXPIRATION;

    if (Date.now() - timestamp > expirationTime) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const clearCache = (key?: string) => {
  if (key) {
    localStorage.removeItem(key);
  } else {
    Object.values(cacheKeys).forEach(cacheKey => {
      localStorage.removeItem(cacheKey);
    });
  }
};

export const useCachedData = (key: string, fetchFunction: () => Promise<any>, config: CacheConfig = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get data from cache first
        const cachedData = getFromCache(key, config);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // If no cached data, fetch fresh data
        const freshData = await fetchFunction();
        saveToCache(key, freshData, config);
        setData(freshData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, config]);

  return { data, loading, error };
};