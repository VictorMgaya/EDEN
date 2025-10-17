// Utility functions for client-side caching of API responses
// Uses localStorage for simplicity; can be swapped for IndexedDB for larger data

export function saveCache(key, data) {
  try {
    localStorage.setItem(`edenrae_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Fallback: ignore quota errors
    console.warn('Cache save failed', e);
  }
}

export function loadCache(key) {
  try {
    const raw = localStorage.getItem(`edenrae_cache_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearCache(key) {
  try {
    localStorage.removeItem(`edenrae_cache_${key}`);
  } catch (e) {}
}

export function listCacheKeys() {
  return Object.keys(localStorage).filter(k => k.startsWith('edenrae_cache_'));
}
