/**
 * Component Caching System for EDEN
 * Provides intelligent caching for API responses, expensive computations, and component data
 */

class ComponentCache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100; // Maximum number of cache entries
        this.ttl = options.ttl || 5 * 60 * 1000; // Time to live: 5 minutes default
        this.storage = options.storage || 'memory'; // 'memory', 'localStorage', or 'sessionStorage'
        this.namespace = options.namespace || 'eden_cache';
        this.cache = new Map();
        this.accessOrder = []; // For LRU eviction

        // Persistent storage for browser environments
        if (typeof window !== 'undefined' && (this.storage === 'localStorage' || this.storage === 'sessionStorage')) {
            this.storageAPI = this.storage === 'localStorage' ? localStorage : sessionStorage;
        }

        // Load persistent cache on initialization
        this.loadPersistentCache();

        // Cleanup interval for expired entries
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // Cleanup every minute
    }

    /**
     * Generate cache key from parameters
     */
    generateKey(namespace, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});

        const paramStr = JSON.stringify(sortedParams);
        return `${this.namespace}_${namespace}_${btoa(paramStr).replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    /**
     * Set cache entry
     */
    set(key, data, customTTL = null) {
        const ttl = customTTL || this.ttl;
        const entry = {
            data,
            timestamp: Date.now(),
            ttl,
            accessCount: 0,
            lastAccessed: Date.now()
        };

        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        this.cache.set(key, entry);
        this.accessOrder.push(key);

        // Persist to storage if configured
        if (this.storageAPI) {
            this.persistToStorage(key, entry);
        }

        return data;
    }

    /**
     * Get cache entry
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);

            if (this.storageAPI) {
                this.storageAPI.removeItem(key);
            }

            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        // Move to end of access order (most recently used)
        this.moveToEndOfAccessOrder(key);

        return entry.data;
    }

    /**
     * Check if key exists and is valid
     */
    has(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);

            if (this.storageAPI) {
                this.storageAPI.removeItem(key);
            }

            return false;
        }

        return true;
    }

    /**
     * Delete specific cache entry
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        this.removeFromAccessOrder(key);

        if (this.storageAPI) {
            this.storageAPI.removeItem(key);
        }

        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];

        if (this.storageAPI) {
            this.clearPersistentStorage();
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        let totalAccessCount = 0;

        for (const [ entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                expiredEntries++;
            } else {
                validEntries++;
                totalAccessCount += entry.accessCount;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            totalAccessCount,
            maxSize: this.maxSize,
            storageType: this.storage,
            hitRate: totalAccessCount > 0 ? (totalAccessCount / (totalAccessCount + this.cache.size)) : 0
        };
    }

    /**
     * Cache wrapper for async functions
     */
    async cached(namespace, params, fn, customTTL = null) {
        const key = this.generateKey(namespace, params);

        // Try to get from cache first
        const cachedResult = this.get(key);
        if (cachedResult !== null) {
            console.log(`Cache hit for ${namespace}:`, params);
            return cachedResult;
        }

        console.log(`Cache miss for ${namespace}:`, params);

        try {
            // Execute the function
            const result = await fn();

            // Cache the result
            this.set(key, result, customTTL);

            return result;
        } catch (error) {
            console.error(`Error in cached function ${namespace}:`, error);
            throw error;
        }
    }

    /**
     * Batch cache operations
     */
    batchSet(items) {
        items.forEach(({ key, data, ttl }) => {
            this.set(key, data, ttl);
        });
    }

    /**
     * Get multiple cache entries
     */
    batchGet(keys) {
        return keys.map(key => this.get(key)).filter(result => result !== null);
    }

    /**
     * Evict least recently used entry
     */
    evictLRU() {
        if (this.accessOrder.length === 0) return;

        const lruKey = this.accessOrder.shift();
        if (lruKey) {
            this.cache.delete(lruKey);

            if (this.storageAPI) {
                this.storageAPI.removeItem(lruKey);
            }
        }
    }

    /**
     * Move key to end of access order
     */
    moveToEndOfAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * Remove key from access order
     */
    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);

            if (this.storageAPI) {
                this.storageAPI.removeItem(key);
            }
        });

        if (keysToDelete.length > 0) {
            console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
        }
    }

    /**
     * Persist cache entry to storage
     */
    persistToStorage(key, entry) {
        try {
            const serializedEntry = JSON.stringify(entry);
            this.storageAPI.setItem(key, serializedEntry);
        } catch (error) {
            console.warn('Failed to persist cache entry to storage:', error);
        }
    }

    /**
     * Load persistent cache from storage
     */
    loadPersistentCache() {
        if (!this.storageAPI) return;

        try {
            const keys = Object.keys(this.storageAPI);
            let loadedCount = 0;

            for (const key of keys) {
                if (key.startsWith(`${this.namespace}_`)) {
                    try {
                        const stored = this.storageAPI.getItem(key);
                        if (stored) {
                            const entry = JSON.parse(stored);

                            // Check if entry has expired
                            if (Date.now() - entry.timestamp <= entry.ttl) {
                                this.cache.set(key, entry);
                                this.accessOrder.push(key);
                                loadedCount++;
                            } else {
                                // Remove expired entry from storage
                                this.storageAPI.removeItem(key);
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to load cache entry ${key}:`, error);
                        this.storageAPI.removeItem(key);
                    }
                }
            }

            if (loadedCount > 0) {
                console.log(`Loaded ${loadedCount} entries from persistent cache`);
            }
        } catch (error) {
            console.warn('Failed to load persistent cache:', error);
        }
    }

    /**
     * Clear persistent storage
     */
    clearPersistentStorage() {
        if (!this.storageAPI) return;

        try {
            const keys = Object.keys(this.storageAPI);
            keys.forEach(key => {
                if (key.startsWith(`${this.namespace}_`)) {
                    this.storageAPI.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear persistent storage:', error);
        }
    }

    /**
     * Destroy cache instance
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Create default cache instance
const defaultCache = new ComponentCache({
    maxSize: 200,
    ttl: 10 * 60 * 1000, // 10 minutes
    storage: 'localStorage',
    namespace: 'eden_components'
});

// Export cache utilities
export { ComponentCache, defaultCache };

// Convenience functions for common use cases
export const cacheSoilData = (lat, lon, data) => {
    const key = `soil_${lat}_${lon}`;
    return defaultCache.set(key, data, 30 * 60 * 1000); // 30 minutes for soil data
};

export const getCachedSoilData = (lat, lon) => {
    const key = `soil_${lat}_${lon}`;
    return defaultCache.get(key);
};

export const cacheWeatherData = (location, data) => {
    const key = `weather_${location}`;
    return defaultCache.set(key, data, 15 * 60 * 1000); // 15 minutes for weather
};

export const getCachedWeatherData = (location) => {
    const key = `weather_${location}`;
    return defaultCache.get(key);
};

export const cacheAnalyticsData = (metric, data) => {
    const key = `analytics_${metric}`;
    return defaultCache.set(key, data, 60 * 60 * 1000); // 1 hour for analytics
};

export const getCachedAnalyticsData = (metric) => {
    const key = `analytics_${metric}`;
    return defaultCache.get(key);
};

// React hook for using cache in components
export const useCache = (namespace, options = {}) => {
    const cache = options.cache || defaultCache;

    const cached = (params, fn, customTTL) => {
        return cache.cached(namespace, params, fn, customTTL);
    };

    const get = (params) => {
        const key = cache.generateKey(namespace, params);
        return cache.get(key);
    };

    const set = (params, data, customTTL) => {
        const key = cache.generateKey(namespace, params);
        return cache.set(key, data, customTTL);
    };

    const invalidate = (params) => {
        const key = cache.generateKey(namespace, params);
        return cache.delete(key);
    };

    return { cached, get, set, invalidate };
};

export default defaultCache;
