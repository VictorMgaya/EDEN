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
        // For weather array
        if (key.toLowerCase().includes('weather')) {
          const temps = value.map(d => d.main?.temp).filter(Boolean);
          const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
          const conditions = value.map(d => d.weather?.[0]?.main).filter(Boolean);
          const uniqueConditions = [...new Set(conditions)];
          content = `${value.length} forecasts | Average temp: ${avgTemp}°C | Conditions: ${uniqueConditions.join(', ')}`;
        }
        // For soil classification array
        else if (key.toLowerCase().includes('soil') && value[0]?.soilClass) {
          const topSoils = value.slice(0, 3).map(s => `${s.soilClass} (${s.probability}%)`);
          content = `Top soil types: ${topSoils.join(', ')}`;
        }
        // For soil properties array
        else if (value[0]?.name && value[0]?.depths) {
          const properties = value.map(p => p.name);
          content = `${value.length} soil properties measured: ${properties.slice(0, 5).join(', ')}${properties.length > 5 ? '...' : ''}`;
        }
        // Generic array
        else {
          content = `${value.length} data points`;
        }
      } 
      else if (typeof value === 'object' && value !== null) {
        // For population data
        if (value.populationHistory && value.ageGenderData) {
          const latestPop = value.populationHistory[value.populationHistory.length - 1];
          const year = latestPop?.year || 'N/A';
          const population = latestPop?.population || 'N/A';
          const growthRate = latestPop?.growthRate?.toFixed(2) || 'N/A';
          const ageGroups = value.ageGenderData?.ageData?.length || 0;
          content = `Latest (${year}): ${population} people per 100m² | Growth rate: ${growthRate}% | ${ageGroups} age groups tracked`;
        }
        // Generic object
        else {
          const keys = Object.keys(value).slice(0, 3);
          content = `Contains: ${keys.join(', ')}${Object.keys(value).length > 3 ? '...' : ''}`;
        }
      } 
      else {
        content = String(value);
      }
      
      summaryItems.push({ heading: capitalizedHeading, content });
    });
    
    return summaryItems;
  };

  return (
    <div className="space-y-6">
      {/* Text Summary Section - Display on top */}
      {textSummary.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-300">
            Analytics Summary
          </h2>
          <div className="space-y-4">
            {textSummary.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {item.heading}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original Component - Actual Data View */}
      <AnalyticsCachePreview />
    </div>
  );
};

export default AnalyticsDataVisualization;