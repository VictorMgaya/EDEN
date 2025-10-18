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
    
    // Extract detailed text summary from cached data
    const summary = extractDetailedTextSummary(data);
    setTextSummary(summary);
  }, []);

  const extractDetailedTextSummary = (data) => {
    const summaryItems = [];
    
    Object.entries(data).forEach(([key, value]) => {
      const heading = key.replace(/([A-Z_])/g, ' $1').trim().replace(/_/g, ' ');
      const capitalizedHeading = heading.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      let content = '';
      
      // Handle weather data
      if (Array.isArray(value) && value[0]?.weather) {
        const weatherDetails = value.map((day, index) => {
          const date = new Date(day.dt * 1000).toLocaleDateString();
          const temp = day.main?.temp?.toFixed(1);
          const humidity = day.main?.humidity;
          const condition = day.weather?.[0]?.description || 'N/A';
          const windSpeed = day.main?.wind?.speed || day.wind?.speed || 'N/A';
          return `Day ${index + 1} (${date}): ${temp}°C, ${condition}, Humidity: ${humidity}%, Wind: ${windSpeed} m/s`;
        }).join('\n');
        content = weatherDetails;
      }
      // Handle population data
      else if (value?.populationHistory && value?.ageGenderData) {
        let popText = 'Population History:\n';
        value.populationHistory.forEach(year => {
          popText += `  ${year.year}: ${year.population} people/100m², Density: ${year.density}, Growth Rate: ${year.growthRate.toFixed(2)}%\n`;
        });
        
        popText += '\nAge & Gender Distribution (Year ' + value.ageGenderData.year + '):\n';
        value.ageGenderData.ageData.forEach(age => {
          popText += `  ${age.age}: Male ${age.male}, Female ${age.female}\n`;
        });
        content = popText;
      }
      // Handle soil classification array
      else if (Array.isArray(value) && value[0]?.soilClass) {
        const soilText = value.map(soil => 
          `${soil.soilClass}: ${soil.probability}% probability`
        ).join('\n');
        content = soilText;
      }
      // Handle soil properties array
      else if (Array.isArray(value) && value[0]?.name && value[0]?.depths) {
        let propsText = '';
        value.forEach(prop => {
          propsText += `\n${prop.name.toUpperCase()} (${prop.unit}):\n`;
          prop.depths.forEach(depth => {
            propsText += `  ${depth.depth}: Mean ${depth.mean}, Q05 ${depth.q05}, Q95 ${depth.q95}\n`;
          });
        });
        content = propsText;
      }
      // Generic array
      else if (Array.isArray(value)) {
        content = JSON.stringify(value, null, 2);
      }
      // Generic object
      else if (typeof value === 'object' && value !== null) {
        content = JSON.stringify(value, null, 2);
      }
      // Primitive values
      else {
        content = String(value);
      }
      
      summaryItems.push({ heading: capitalizedHeading, content });
    });
    
    return summaryItems;
  };

  return (
    <div className="space-y-6">
      {/* Detailed Text Summary Section */}
      {textSummary.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-300">
            Analytics Summary - Complete Data
          </h2>
          <div className="space-y-4">
            {textSummary.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {item.heading}
                </h3>
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {item.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original Component - JSON Data View */}
      <AnalyticsCachePreview />
    </div>
  );
};

export default AnalyticsDataVisualization;