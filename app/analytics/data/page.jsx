'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Database, MapPin, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamic import to prevent SSR issues
const AnalyticsDataVisualization = dynamic(() => import('@/components/AnalyticsDataVisualization'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center">Loading analytics data...</div>
});

const AnalyticsDataPage = () => {
  const [location, setLocation] = useState({ lat: '', lon: '' });
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat') || '';
    const lon = params.get('lon') || '';
    
    setLocation({ lat, lon });
    setHasLocation(!!lat && !!lon);
  }, []);

  return (
    <div className="mt-16 p-1 pb-20 md:pb-1">
      <div className="container mx-auto">
        {/* Header Card */}
        <div className="mb-4 p-4 bg-blue-500/20 rounded-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Analytics Data
              </h1>
              {hasLocation && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location: {location.lat}, {location.lon}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/60 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Load AnalyticsCachePreview Component */}
        {!hasLocation ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Location Required</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              No location parameters found in the URL. Please provide lat and lon parameters to view cached analytics data.
            </p>
            <Button onClick={() => window.location.href = '/analytics'}>
              Go to Analytics
            </Button>
          </div>
        ) : (
          <>
            {/* Cached Data Display */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cached Analytics Overview</h2>
              <AnalyticsDataVisualization />
            </div>

            {/* Footer Info */}
            <div className="mt-4 bg-blue-500/10 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Cached Data Overview</h4>
                  <p className="text-xs text-gray-700">
                    Displaying cached analytics data from local storage. 
                    Data is stored for optimal performance and offline access.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 text-center">
              <Button onClick={() => window.location.href = '/analytics'}>
                Back to Analytics
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDataPage;