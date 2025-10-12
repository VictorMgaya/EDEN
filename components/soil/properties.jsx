'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

import { useMediaQuery } from 'react-responsive';

const SoilPropertiesChart = (props) => {
    const [soilProperties, setSoilProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState('phh2o');
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    // Notify parent when loaded
    useEffect(() => {
        if (!isLoading && !error && typeof props.onLoaded === 'function') {
            props.onLoaded();
        }
    }, [isLoading, error, props.onLoaded]);

    useEffect(() => {
        const fetchSoilProperties = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const lat = parseFloat(params.get('lat'));
                const lon = parseFloat(params.get('lon'));

                if (!lat || !lon) {
                    throw new Error('Location coordinates are required');
                }

                // Fetch data from our API route (SSR)
                const response = await fetch(
                    `/api/soil?lat=${lat}&lon=${lon}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Soil API Error:', response.status, errorData);

                    if (response.status === 404) {
                        throw new Error(errorData.error || 'No soil data available for this location');
                    }

                    if (response.status === 408) {
                        throw new Error('Request timeout - soil data service is slow to respond');
                    }

                    if (response.status >= 500) {
                        throw new Error('Soil data service is temporarily unavailable');
                    }

                    throw new Error(errorData.error || `Failed to fetch soil data: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Soil API Response:', data);

                if (!data.success || !data.properties || data.properties.length === 0) {
                    throw new Error(data.error || 'No soil data available for this location');
                }

                // Data is already processed by the API, just use it directly
                const formattedData = data.properties.map(layer => {
                    console.log('Processing layer:', layer.name, {
                        depthsCount: layer.depths?.length || 0,
                        unit: layer.unit
                    });

                    return {
                        name: layer.name,
                        unit: layer.unit,
                        depths: layer.depths
                    };
                }).filter(layer => layer.depths.length > 0);

                console.log('Formatted data:', formattedData);
                setSoilProperties(formattedData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSoilProperties();
    }, []);

    const propertyOptions = [
        { value: 'phh2o', label: 'pH (H₂O)', color: '#4f46e5' },
        { value: 'clay', label: 'Clay (%)', color: '#7c3aed' },
        { value: 'sand', label: 'Sand (%)', color: '#059669' },
        { value: 'silt', label: 'Silt (%)', color: '#dc2626' },
        { value: 'soc', label: 'Soil Organic Carbon (g/kg)', color: '#ea580c' },
        { value: 'nitrogen', label: 'Nitrogen (g/kg)', color: '#0891b2' },
        { value: 'cec', label: 'Cation Exchange Capacity (cmol/kg)', color: '#be123c' },
        { value: 'bdod', label: 'Bulk Density (kg/dm³)', color: '#4338ca' }
    ];

    const selectedPropertyData = soilProperties.find(prop => prop.name === selectedProperty);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 bg-red-100 rounded-lg">
                Error: {error}
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">
                    Soil Properties Analysis
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-4">
                    {propertyOptions.map(option => (
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
                    <div className="w-full">
                        {/* Property Info Section */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {propertyOptions.find(opt => opt.value === selectedProperty)?.label}
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

                        {/* Chart Section */}
                        <div className="w-full h-96 md:h-[500px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-inner p-4 border border-gray-200">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={selectedPropertyData.depths}
                                    margin={{ top: 20, right: 40, left: 40, bottom: 80 }}
                                >
                                    <defs>
                                        <linearGradient id="meanGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                        </linearGradient>
                                        <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#6b7280" stopOpacity={0.05}/>
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
                                            style: { textAnchor: 'middle', fill: '#475569', fontSize: '14px', fontWeight: 'bold' }
                                        }}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        stroke="#cbd5e1"
                                        fontWeight={500}
                                    />

                                    <Tooltip
                                        formatter={(value, name) => [
                                            `<span style="color: #1e293b; font-weight: 600;">${typeof value === 'number' ? value.toFixed(2) : value} ${selectedPropertyData.unit}</span>`,
                                            `<span style="color: #64748b;">${name === 'mean' ? 'Mean Value' : name.replace('q', '').toUpperCase()}</span>`
                                        ]}
                                        labelFormatter={(label) => `<span style="color: #374151; font-weight: 600;">Depth: ${label}</span>`}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                        cursor={{ strokeDasharray: '5,5', stroke: '#cbd5e1' }}
                                    />

                                    <Legend
                                        wrapperStyle={{
                                            paddingTop: '20px',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    />

                                    {/* Confidence Range Area */}
                                    <Area
                                        type="monotone"
                                        dataKey="q95"
                                        stackId="1"
                                        stroke="none"
                                        fill="url(#rangeGradient)"
                                        name="95th Percentile"
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="q05"
                                        stackId="1"
                                        stroke="none"
                                        fill="url(#meanGradient)"
                                        name="5th Percentile"
                                    />

                                    {/* Mean Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="mean"
                                        stroke="#1e40af"
                                        strokeWidth={4}
                                        dot={{
                                            fill: '#1e40af',
                                            strokeWidth: 3,
                                            stroke: '#ffffff',
                                            r: 5
                                        }}
                                        activeDot={{
                                            r: 7,
                                            fill: '#1e40af',
                                            stroke: '#ffffff',
                                            strokeWidth: 3,
                                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)'
                                        }}
                                        name="Mean"
                                    />

                                    {/* Confidence Range Lines */}
                                    <Line
                                        type="monotone"
                                        dataKey="q05"
                                        stroke="#6b7280"
                                        strokeWidth={2}
                                        strokeDasharray="8 8"
                                        dot={{
                                            fill: '#6b7280',
                                            strokeWidth: 2,
                                            stroke: '#ffffff',
                                            r: 3
                                        }}
                                        name="5th Percentile"
                                        connectNulls={false}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="q95"
                                        stroke="#6b7280"
                                        strokeWidth={2}
                                        strokeDasharray="8 8"
                                        dot={{
                                            fill: '#6b7280',
                                            strokeWidth: 2,
                                            stroke: '#ffffff',
                                            r: 3
                                        }}
                                        name="95th Percentile"
                                        connectNulls={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Summary Statistics */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Min Depth</div>
                                <div className="text-sm font-semibold text-gray-800">
                                    {Math.min(...selectedPropertyData.depths.map(d => d.topDepth || 0))}cm
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Max Depth</div>
                                <div className="text-sm font-semibold text-gray-800">
                                    {Math.max(...selectedPropertyData.depths.map(d => d.topDepth || 0))}cm
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Data Points</div>
                                <div className="text-sm font-semibold text-gray-800">
                                    {selectedPropertyData.depths.length}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Unit</div>
                                <div className="text-sm font-semibold text-gray-800">
                                    {selectedPropertyData.unit}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
                Data source: SoilGrids - Soil properties across different depth ranges
            </CardFooter>
        </Card>
    );
};

export default SoilPropertiesChart;
