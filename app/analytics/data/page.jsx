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
      const heading = key.replace(/([A-Z_])/g, ' $1').trim().replace(/_/g, ' ');
      const capitalizedHeading = heading.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      let content = '';
      
      // Handle different data types
      if (Array.isArray(value)) {
        // For arrays, show count and brief overview
        content = `${value.length} items`;
        if (value.length > 0 && typeof value[0] === 'object') {
          const firstItem = value[0];
          const keys = Object.keys(firstItem).slice(0, 3);
          content += ` - Sample fields: ${keys.join(', ')}`;
        }
      } else if (typeof value === 'object' && value !== null) {
        // For objects, show key properties
        const entries = Object.entries(value).slice(0, 5);
        const parts = entries.map(([k, v]) => {
          const label = k.replace(/([A-Z_])/g, ' $1').trim().replace(/_/g, ' ');
          if (Array.isArray(v)) {
            return `${label}: ${v.length} items`;
          } else if (typeof v === 'object' && v !== null) {
            return `${label}: ${Object.keys(v).length} properties`;
          } else {
            return `${label}: ${v}`;
          }
        });
        content = parts.join(' | ');
        if (Object.keys(value).length > 5) {
          content += ` | ... and ${Object.keys(value).length - 5} more`;
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