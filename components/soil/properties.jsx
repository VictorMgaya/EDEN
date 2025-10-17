'use client';

import React, { useState, useEffect } from 'react';
import { saveCache, loadCache } from '@/utils/dataCache/cacheUtils';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useMediaQuery } from 'react-responsive';

const propertyOptions = [
  { value: 'phh2o', label: 'pH (H₂O)', color: '#4f46e5' },
  { value: 'clay', label: 'Clay (%)', color: '#7c3aed' },
  { value: 'sand', label: 'Sand (%)', color: '#059669' },
  { value: 'silt', label: 'Silt (%)', color: '#dc2626' },
  { value: 'soc', label: 'Soil Organic Carbon (g/kg)', color: '#ea580c' },
  { value: 'nitrogen', label: 'Nitrogen (g/kg)', color: '#0891b2' },
  { value: 'cec', label: 'Cation Exchange Capacity (cmol/kg)', color: '#be123c' },
  { value: 'bdod', label: 'Bulk Density (kg/dm³)', color: '#4338ca' },
];

const SoilPropertiesChart = ({ onLoaded }) => {
  const [soilProperties, setSoilProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('phh2o');
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  useEffect(() => {
    if (!isLoading && !error && typeof onLoaded === 'function') {
      onLoaded();
    }
  }, [isLoading, error, onLoaded]);

  useEffect(() => {
    const fetchSoilProperties = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const lat = parseFloat(params.get('lat'));
        const lon = parseFloat(params.get('lon'));

        if (!lat || !lon) throw new Error('Location coordinates are required');

        // Try to load from cache first
        const cacheKey = `soilprops_${lat}_${lon}`;
        const cached = loadCache(cacheKey);
        if (cached) {
          setSoilProperties(cached);
          setIsLoading(false);
          return;
        }

        // ISRIC SoilGrids API is available but may return null values for some locations
        const response = await fetch(
          `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=bdod&property=cec&property=cfvo&property=clay&property=nitrogen&property=ocd&property=ocs&property=phh2o&property=sand&property=silt&property=soc&property=wv0010&property=wv0033&property=wv1500&depth=0-5cm&depth=0-30cm&depth=5-15cm&depth=15-30cm&depth=30-60cm&depth=60-100cm&depth=100-200cm&value=Q0.05&value=Q0.5&value=Q0.95&value=mean&value=uncertainty`
        );

        if (!response.ok) throw new Error(`Failed to fetch soil data: ${response.status}`);

        const data = await response.json();

        if (!data.properties?.layers?.length) throw new Error('No soil data layers available');

        const formattedData = data.properties.layers
          .map((layer) => {
            const depths = layer.depths
              .map((depth) => {
                const { mean, 'Q0.05': q05, 'Q0.95': q95 } = depth.values || {};
                const factor = layer.unit_measure?.d_factor || 1;

                // More robust data validation - check if at least some meaningful data exists
                const hasAnyValue = mean !== null && mean !== undefined ||
                                  q05 !== null && q05 !== undefined ||
                                  q95 !== null && q95 !== undefined;

                if (!hasAnyValue) return null; // Skip depths with no data at all

                return {
                  depth: depth.label,
                  topDepth: depth.range?.top_depth || 0,
                  mean: mean !== null && mean !== undefined ? Math.round(mean * factor * 100) / 100 : null,
                  q05: q05 !== undefined && q05 !== null ? Math.round(q05 * factor * 100) / 100 : null,
                  q95: q95 !== undefined && q95 !== null ? Math.round(q95 * factor * 100) / 100 : null,
                  unit: layer.unit_measure?.target_units || '-',
                };
              })
              .filter(Boolean); // Remove null depths

            return depths.length > 0 ? { name: layer.name, unit: layer.unit_measure?.target_units || '-', depths } : null;
          })
          .filter(Boolean); // Remove layers with no valid depths

        // Check if we have any valid data at all
        if (formattedData.length === 0) {
          throw new Error('No soil data available for this location. SoilGrids may not have data coverage for the selected coordinates.');
        }

        setSoilProperties(formattedData);
        saveCache(cacheKey, formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSoilProperties();
  }, []);

  const selectedPropertyData = soilProperties.find((prop) => prop.name === selectedProperty);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded-lg">
        Error: {error}
      </div>
    );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Soil Properties Analysis</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          {propertyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedProperty(option.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedProperty === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {selectedPropertyData && (
          <>
            {/* Property Info */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {propertyOptions.find((opt) => opt.value === selectedProperty)?.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Soil depth profile analysis showing variation across different soil layers
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Mean Values
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    Confidence Range
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full h-96 md:h-[500px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-inner p-4 border border-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={selectedPropertyData.depths}
                  margin={{ top: 20, right: 40, left: 40, bottom: 80 }}
                >
                  <defs>
                    <linearGradient id="meanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6b7280" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                  <XAxis
                    dataKey="depth"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                    fontWeight={500}
                  />
                  <YAxis
                    label={{
                      value: selectedPropertyData.unit,
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#475569', fontSize: '14px', fontWeight: 'bold' },
                    }}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                    fontWeight={500}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      `${typeof value === 'number' ? value.toFixed(2) : value} ${selectedPropertyData.unit}`,
                      name === 'mean' ? 'Mean Value' : name.replace('q', '').toUpperCase(),
                    ]}
                  />

                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: '500' }} />

                  <Area type="monotone" dataKey="q95" stackId="1" stroke="none" fill="url(#rangeGradient)" name="95th Percentile" />
                  <Area type="monotone" dataKey="q05" stackId="1" stroke="none" fill="url(#meanGradient)" name="5th Percentile" />

                  <Line type="monotone" dataKey="mean" stroke="#1e40af" strokeWidth={4} dot={{ fill: '#1e40af', strokeWidth: 3, stroke: '#fff', r: 5 }} activeDot={{ r: 7, fill: '#1e40af', stroke: '#fff', strokeWidth: 3 }} name="Mean" />

                  <Line type="monotone" dataKey="q05" stroke="#6b7280" strokeWidth={2} strokeDasharray="8 8" dot={{ fill: '#6b7280', strokeWidth: 2, stroke: '#fff', r: 3 }} name="5th Percentile" connectNulls={false} />
                  <Line type="monotone" dataKey="q95" stroke="#6b7280" strokeWidth={2} strokeDasharray="8 8" dot={{ fill: '#6b7280', strokeWidth: 2, stroke: '#fff', r: 3 }} name="95th Percentile" connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Min Depth</div>
                <div className="text-sm font-semibold text-gray-800">{Math.min(...selectedPropertyData.depths.map((d) => d.topDepth))}cm</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Max Depth</div>
                <div className="text-sm font-semibold text-gray-800">{Math.max(...selectedPropertyData.depths.map((d) => d.topDepth))}cm</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Data Points</div>
                <div className="text-sm font-semibold text-gray-800">{selectedPropertyData.depths.length}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Unit</div>
                <div className="text-sm font-semibold text-gray-800">{selectedPropertyData.unit}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        Data source: SoilGrids - Soil properties across different depth ranges
      </CardFooter>
    </Card>
  );
};

export default SoilPropertiesChart;
