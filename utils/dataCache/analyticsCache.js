// Helper to preview cached datasets for analytics UI (client-side)
import { loadCache } from './cacheUtils';

export function getCachedOverview(lat, lon) {
  try {
    const keys = [
      `weather_${lat}_${lon}`,
      `population_${lat}_${lon}`,
      `soil_${lat}_${lon}_mobile`,
      `soil_${lat}_${lon}_desktop`,
      `soilprops_${lat}_${lon}`,
      `location_${lat}_${lon}`
    ];

    const result = {};
    for (const k of keys) {
      const d = loadCache(k);
      if (d) result[k] = d;
    }
    return result;
  } catch (e) {
    return {};
  }
}

export default { getCachedOverview };
