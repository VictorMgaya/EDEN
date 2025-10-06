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
        <div className="forecast-container bg-gradient-to-r from-blue-500/30 to-green-500/30 p-6 rounded-2xl shadow-xl w-full">
            <h2 className="text-2xl font-semibold mb-4">7-Day Weather Forecast</h2>
            <div className="grid sm:grid-cols-3 md:grid-cols-7 gap-2">
                {forecastData.map((forecast, index) => (
                    <div
                        key={index}
                        className="forecast-item p-4 rounded-2xl bg-blue-300/20 shadow-md flex flex-col items-center"
                    >
                        <p className="text-xl font-medium">
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
                        <div className="text-center">
                            <p className="text-lg font-semibold">{Math.round(forecast.main.temp)}°C</p>
                            <p className="text-base capitalize">{forecast.weather[0].description}</p>
                            <div className="mt-2 text-sm">
                                <p>Humidity: {forecast.main.humidity}%</p>
                                <p>Wind: {Math.round(forecast.wind.speed)} m/s</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherForecast;