'use client';

import React, { useState, useEffect } from 'react';
import { saveCache, loadCache } from '@/utils/dataCache/cacheUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useMediaQuery } from 'react-responsive';

const SoilClassificationChart = (props) => {
    const [soilClasses, setSoilClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    // Notify parent when loaded
    useEffect(() => {
        if (!isLoading && !error && typeof props.onLoaded === 'function') {
            props.onLoaded();
        }
    }, [isLoading, error, props.onLoaded]);

    useEffect(() => {
        const fetchSoilData = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const lat = parseFloat(params.get('lat'));
                const lon = parseFloat(params.get('lon'));

                if (!lat || !lon) {
                    throw new Error('Location coordinates are required');
                }

                // Try to load from cache first
                const cacheKey = `soil_${lat}_${lon}_${isMobile ? 'mobile' : 'desktop'}`;
                const cached = loadCache(cacheKey);
                if (cached) {
                    setSoilClasses(cached);
                    setIsLoading(false);
                    return;
                }

                // Number of classes based on device type
                const numberOfClasses = isMobile ? 10 : 30;

                const response = await fetch(
                    `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=${numberOfClasses}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch soil data');
                }

                const data = await response.json();

                // Transform data for the chart
                const formattedData = data.wrb_class_probability.map(([className, probability], index) => ({
                    soilClass: className,
                    probability: Math.round(probability * 100) / 100,
                    fill: `hsl(${index * (360 / numberOfClasses)}, 70%, 50%)`
                }));

                setSoilClasses(formattedData);
                saveCache(cacheKey, formattedData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSoilData();
    }, [isMobile]);

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
                    Soil Classification Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-96 md:h-[600px] bg-gradient-to-r from-yellow-500/10 to-yellow-900/10 rounded-lg overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        {isMobile ? (
                            // Mobile layout - horizontal bars
                            <BarChart
                                data={soilClasses}
                                layout="vertical"
                                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    domain={[0, 50]}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <YAxis
                                    dataKey="soilClass"
                                    type="category"
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Probability']}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar
                                    dataKey="probability"
                                    fill="#4f46e5"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        ) : (
                            // Desktop layout - vertical bars
                            <BarChart
                                data={soilClasses}
                                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="soilClass"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    domain={[0, 50]}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Probability']}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar
                                    dataKey="probability"
                                    fill="#4f46e5"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
                Data source: SoilGrids - Displaying {isMobile ? '10' : '30'} soil classes by probability
            </CardFooter>
        </Card>
    );
};

export default SoilClassificationChart;