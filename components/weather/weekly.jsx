'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const WeatherForecast = (props) => {
    const [forecastData, setForecastData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Notify parent when loaded
    useEffect(() => {
        if (!isLoading && !error && typeof props.onLoaded === 'function') {
            props.onLoaded();
        }
    }, [isLoading, error, props.onLoaded]);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const lat = parseFloat(params.get('lat'));
                const lon = parseFloat(params.get('lon'));

                if (!lat || !lon) {
                    throw new Error('Location coordinates are required');
                }

                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=d2901acb6971158b00e1237839d5c597`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch weather data');
                }

                const data = await response.json();

                // Get one forecast per day (first forecast of each day)
                const dailyForecasts = data.list.reduce((acc, forecast) => {
                    const date = new Date(forecast.dt * 1000).toLocaleDateString();
                    if (!acc[date]) {
                        acc[date] = forecast;
                    }
                    return acc;
                }, {});

                setForecastData(Object.values(dailyForecasts).slice(0, 8));
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeatherData();
    }, []);

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardContent className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    Error: {error}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    7-Day Weather Forecast
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-3 md:grid-cols-7 gap-4">
                    {forecastData.map((forecast, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-blue-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center"
                        >
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {new Date(forecast.dt * 1000).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                            <img
                                src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`}
                                alt={forecast.weather[0].description}
                                className="w-16 h-16 my-2"
                            />
                            <div className="text-center space-y-1">
                                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{Math.round(forecast.main.temp)}°C</p>
                                <p className="text-sm capitalize text-gray-600 dark:text-gray-400">{forecast.weather[0].description}</p>
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    <p>Humidity: {forecast.main.humidity}%</p>
                                    <p>Wind: {Math.round(forecast.wind.speed)} m/s</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default WeatherForecast;
