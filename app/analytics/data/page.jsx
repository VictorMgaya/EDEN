'use client';

import React, { useEffect, useState } from 'react';
import { getCachedOverview } from '@/utils/dataCache/analyticsCache';
import AnalyticsCachePreview from '@/components/AnalyticsCachePreview';

const AnalyticsDataVisualization = () => {
  const [overview, setOverview] = useState({});
  const [textSummary, setTextSummary] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat') || '';
    const lon = params.get('lon') || '';
    if (!lat || !lon) return;
    
    const data = getCachedOverview(lat, lon);
    setOverview(data);
    
    // Extract text summary from cached data
    const summary = extractTextSummary(data);
    setTextSummary(summary);
  }, []);

  const extractTextSummary = (data) => {
    const summaryItems = [];
    
    Object.entries(data).forEach(([key, value]) => {
      const heading = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedHeading = heading.charAt(0).toUpperCase() + heading.slice(1);
      
      let content = '';
      
      if (typeof value === 'object' && value !== null) {
        // Extract key information from objects
        if (Array.isArray(value)) {
          content = value.join(', ');
        } else {
          const entries = Object.entries(value);
          content = entries.map(([k, v]) => {
            const label = k.replace(/([A-Z])/g, ' $1').trim();
            return `${label}: ${typeof v === 'object' ? JSON.stringify(v) : v}`;
          }).join(' | ');
        }
      } else {
        content = String(value);
      }
      
      summaryItems.push({ heading: capitalizedHeading, content });
    });
    
    return summaryItems;
  };

  return (
    <div className="space-y-8">
      {/* Text Summary Section - Display on top */}
      {textSummary.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-300">
            Analytics Summary
          </h2>
          <div className="space-y-4">
            {textSummary.map((item, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {item.heading}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed pl-4">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original Component - Actual Data View */}
      <div className="mt-6">
        <AnalyticsCachePreview />
      </div>
    </div>
  );
};

export default AnalyticsDataVisualization;