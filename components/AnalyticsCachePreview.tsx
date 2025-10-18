'use client';

import React, { useEffect, useState } from 'react';
import { getCachedOverview } from '@/utils/dataCache/analyticsCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Expand } from 'lucide-react';

const AnalyticsCachePreview = () => {
  const [overview, setOverview] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat') || '';
    const lon = params.get('lon') || '';
    if (!lat || !lon) return;
    const data = getCachedOverview(lat, lon);
    setOverview(data);
  }, []);

  const toggleItemExpansion = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (Object.keys(overview).length === 0) {
    return (
      <Card className="max-w-7xl mx-auto border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">No cached data available for the selected location.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-7xl mx-auto border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Cached Data Preview
          </CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1 text-blue-600 dark:text-blue-400">
            {Object.keys(overview).length} Categories
          </Badge>
        </div>
        <CardDescription className="text-lg">
          Real-time cached analytics data for the selected location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(overview).map(([key, value]) => {
            const isExpanded = expandedItems[key];
            const itemCount = Array.isArray(value) ? value.length : 'object';
            
            return (
              <Card 
                key={key} 
                className="border-blue-100 dark:border-blue-900 bg-white/60 dark:bg-gray-700/60 hover:shadow-lg transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white break-words">
                        {key}
                      </h4>
                      <Badge variant="secondary" className="text-base mt-2">
                        {Array.isArray(value) ? `${value.length} items` : 'object data'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleItemExpansion(key)}
                      className="flex items-center gap-2 shrink-0"
                    >
                      <Expand className="w-4 h-4" />
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                  
                  <div className={`bg-gray-50 dark:bg-gray-600/30 rounded-xl p-4 ${isExpanded ? '' : 'max-h-80'} overflow-auto`}>
                    <pre className="text-base leading-relaxed text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCachePreview;