'use client';

import React, { useEffect, useState } from 'react';
import { getCachedOverview } from '@/utils/dataCache/analyticsCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  if (Object.keys(overview).length === 0) {
    return (
      <Card className="max-w-7xl mx-auto border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No cached data available for the selected location.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-7xl mx-auto border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Cached Data Preview
          </CardTitle>
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
            {Object.keys(overview).length} Categories
          </Badge>
        </div>
        <CardDescription>
          Real-time cached analytics data for the selected location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(overview).map(([key, value]) => (
            <Card 
              key={key} 
              className="border-blue-100 dark:border-blue-900 bg-white/60 dark:bg-gray-700/60 hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white break-words flex-1 mr-2">
                    {key}
                  </h4>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {Array.isArray(value) ? `${value.length} items` : 'object'}
                  </Badge>
                </div>
                <pre className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-h-32 overflow-auto bg-gray-50 dark:bg-gray-600/30 rounded p-2 font-mono">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCachePreview;