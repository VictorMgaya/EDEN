'use client';

import React, { useEffect, useState } from 'react';
import { getCachedOverview } from '@/utils/dataCache/analyticsCache';

const AnalyticsCachePreview = () => {
  const [overview, setOverview] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat') || '';
    const lon = params.get('lon') || '';
    if (!lat || !lon) return;
    const data = getCachedOverview(lat, lon);
    setOverview(data);
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow max-w-7xl mx-auto">
      <h3 className="text-lg font-semibold mb-3">Cached Data Preview</h3>
      {Object.keys(overview).length === 0 ? (
        <p className="text-sm text-gray-500">No cached data available for the selected location.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(overview).map(([k, v]) => (
            <div key={k} className="p-3 border rounded">
              <div className="text-sm font-medium break-words">{k}</div>
              <pre className="text-xs mt-2 max-h-40 overflow-auto">{JSON.stringify(v, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsCachePreview;
