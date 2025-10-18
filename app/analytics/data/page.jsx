'use client';

import React, { useEffect, useState } from 'react';
import { Database, MapPin, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { getCachedOverview } from '@/utils/dataCache/analyticsCache';
import { Button } from '@/components/ui/button';

const AnalyticsDataPage = () => {
  const [overview, setOverview] = useState({});
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: '', lon: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat') || '';
    const lon = params.get('lon') || '';
    
    setLocation({ lat, lon });
    
    if (!lat || !lon) {
      setLoading(false);
      return;
    }
    
    const data = getCachedOverview(lat, lon);
    setOverview(data);
    setLoading(false);
  }, []);

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getIcon = (key) => {
    const iconMap = {
      location: MapPin,
      visitors: Activity,
      pageViews: Activity,
      demographics: Activity,
      engagement: Activity,
      topPages: Database,
      deviceTypes: Database
    };
    return iconMap[key] || Database;
  };

  if (loading) {
    return (
      <div className="mt-16 p-1 pb-20 md:pb-1">
        <div className="container mx-auto">
          <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-3"></div>
              <p className="text-gray-700 text-sm font-medium">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location: {location.lat}, {location.lon}
              </p>
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

        {/* Main Content */}
        {Object.keys(overview).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              No cached analytics data found for this location. 
              Ensure location parameters are provided in the URL.
            </p>
            <Button onClick={() => window.location.href = '/analytics'}>
              Go to Analytics
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(overview).map(([key, value]) => {
                const Icon = getIcon(key);
                return (
                  <div 
                    key={key} 
                    className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-colors p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <pre className="text-xs text-gray-700 font-mono overflow-auto max-h-80 whitespace-pre-wrap break-words">
                        {formatValue(value)}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="mt-4 bg-blue-500/10 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Cached Data Overview</h4>
                  <p className="text-xs text-gray-700">
                    Displaying {Object.keys(overview).length} data categories from local cache. 
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