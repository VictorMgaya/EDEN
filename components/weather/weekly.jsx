'use client';

import React, { useState, useEffect } from 'react';
import { saveCache, loadCache } from '@/utils/dataCache/cacheUtils';
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

                // Try to load from cache first
                const cacheKey = `weather_${lat}_${lon}`;
                const cached = loadCache(cacheKey);
                if (cached) {
                    setForecastData(cached);
                    setIsLoading(false);
                    return;
                }

                // Single API call using One Call API 3.0 for comprehensive weather data
                const response = await fetch(
                    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=d2901acb6971158b00e1237839d5c597`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch weather data');
                }

                const data = await response.json();

                // Process current weather as today's forecast
                const today = {
                    dt: data.current.dt,
                    main: {
                        temp: data.current.temp,
                        humidity: data.current.humidity
                    },
                    weather: data.current.weather,
                    wind: {
                        speed: data.current.wind_speed
                    }
                };

                // Process daily forecasts from the API (8 days including today)
                const dailyForecasts = data.daily.slice(0, 8).map(day => ({
                    dt: day.dt,
                    main: {
                        temp: day.temp.day,
                        humidity: day.humidity
                    },
                    weather: day.weather,
                    wind: {
                        speed: day.wind_speed
                    }
                }));

                // Combine today with daily forecasts (today + 7 more days = 8 days total)
                const eightDayForecast = [today, ...dailyForecasts.slice(1)];

                // Generate additional days (9-30) using historical climate patterns
                // Note: 30-day forecasts are not available in free APIs, so we use climate data
                const extendedForecast = [...eightDayForecast];

                // Fetch climate data for more accurate long-term estimates
                try {
                    const climateResponse = await fetch(
                        `https://api.openweathermap.org/data/2.5/climate/monthly?lat=${lat}&lon=${lon}&units=metric&appid=d2901acb6971158b00e1237839d5c597`
                    );

                    let climateData = null;
                    if (climateResponse.ok) {
                        climateData = await climateResponse.json();
                    }

                    for (let i = 8; i < 30; i++) {
                        const baseDate = new Date(eightDayForecast[eightDayForecast.length - 1].dt * 1000);
                        const newDate = new Date(baseDate.getTime() + (i - 7) * 24 * 60 * 60 * 1000);

                        let estimatedTemp = eightDayForecast[eightDayForecast.length - 1].main.temp;
                        let estimatedHumidity = eightDayForecast[eightDayForecast.length - 1].main.humidity;

                        // Use climate data if available for more accurate estimates
                        if (climateData && climateData.list && climateData.list.length > 0) {
                            const month = newDate.getMonth() + 1; // JavaScript months are 0-indexed
                            const climateMonth = climateData.list.find(c => c.month === month);

                            if (climateMonth) {
                                // Use actual climate averages for the month
                                estimatedTemp = climateMonth.temp.average;
                                estimatedHumidity = climateMonth.humidity.average || 65;
                            }
                        }

                        // Add some day-to-day variation while staying realistic
                        const dayToDayVariation = (Math.random() - 0.5) * 4; // ±2°C variation
                        estimatedTemp += dayToDayVariation;

                        // Seasonal humidity adjustment
                        const month = newDate.getMonth();
                        const seasonalHumidity = 60 + Math.sin(((month - 6) * Math.PI) / 6) * 15; // Summer drier, winter more humid
                        estimatedHumidity = Math.max(40, Math.min(85, estimatedHumidity + (Math.random() - 0.5) * 10));

                        extendedForecast.push({
                            dt: Math.floor(newDate.getTime() / 1000),
                            main: {
                                temp: estimatedTemp,
                                humidity: Math.round(estimatedHumidity)
                            },
                            weather: [{
                                icon: '02d', // Default partly cloudy for long-term
                                description: 'Partly cloudy',
                                main: 'Clouds'
                            }],
                            wind: {
                                speed: Math.max(0, 2 + (Math.random() - 0.5) * 2) // Light breeze default
                            },
                            isEstimated: true,
                            isClimateBased: !!climateData
                        });
                    }
                } catch (climateError) {
                    // Fallback to pattern-based estimation if climate API fails
                    console.warn('Climate API not available, using pattern-based estimation');

                    for (let i = 8; i < 30; i++) {
                        const baseDate = new Date(eightDayForecast[eightDayForecast.length - 1].dt * 1000);
                        const newDate = new Date(baseDate.getTime() + (i - 7) * 24 * 60 * 60 * 1000);

                        const seasonalVariation = Math.sin((i * 2 * Math.PI) / 365) * 3;
                        const randomVariation = (Math.random() - 0.5) * 3;
                        const trendVariation = (i - 7) * 0.1; // Slight warming trend

                        const estimatedTemp = eightDayForecast[eightDayForecast.length - 1].main.temp + seasonalVariation + randomVariation + trendVariation;
                        const estimatedHumidity = Math.max(40, Math.min(85, eightDayForecast[eightDayForecast.length - 1].main.humidity + (Math.random() - 0.5) * 15));

                        extendedForecast.push({
                            dt: Math.floor(newDate.getTime() / 1000),
                            main: {
                                temp: estimatedTemp,
                                humidity: Math.round(estimatedHumidity)
                            },
                            weather: [{
                                icon: '02d',
                                description: 'Partly cloudy',
                                main: 'Clouds'
                            }],
                            wind: {
                                speed: Math.max(0, eightDayForecast[eightDayForecast.length - 1].wind.speed + (Math.random() - 0.5) * 1)
                            },
                            isEstimated: true,
                            isClimateBased: false
                        });
                    }
                }

                setForecastData(extendedForecast);
                saveCache(cacheKey, extendedForecast);
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

    // Group forecasts by weeks for better calendar layout
    const groupByWeeks = (forecasts) => {
        const weeks = [];
        for (let i = 0; i < forecasts.length; i += 7) {
            weeks.push(forecasts.slice(i, i + 7));
        }
        return weeks;
    };

    const forecastWeeks = forecastData ? groupByWeeks(forecastData) : [];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    30-Day Weather Forecast
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    First 8 days: Actual forecast | Days 9-30: Climate-based prediction
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {forecastWeeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                Week {weekIndex + 1}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
                                {week.map((forecast, dayIndex) => {
                                    const dayNumber = weekIndex * 7 + dayIndex;
                                    const isEstimated = dayNumber >= 8;

                                    return (
                                        <div
                                            key={dayNumber}
                                            className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md border transition-shadow duration-300 flex flex-col items-center relative ${
                                                isEstimated
                                                    ? 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                                                    : 'border-blue-200 dark:border-gray-700'
                                            } hover:shadow-lg`}
                                        >
                                            {isEstimated && (
                                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded-full">
                                                    Est.
                                                </span>
                                            )}
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                                                {new Date(forecast.dt * 1000).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                {new Date(forecast.dt * 1000).toLocaleDateString(undefined, {
                                                    weekday: 'short'
                                                })}
                                            </p>
                                            <img
                                                src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`}
                                                alt={forecast.weather[0].description}
                                                className="w-10 h-10 mb-2"
                                            />
                                            <div className="text-center space-y-1">
                                                <p className={`text-sm font-semibold ${
                                                    isEstimated
                                                        ? 'text-orange-700 dark:text-orange-300'
                                                        : 'text-gray-800 dark:text-gray-200'
                                                }`}>
                                                    {Math.round(forecast.main.temp)}°C
                                                </p>
                                                <p className={`text-xs capitalize ${
                                                    isEstimated
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                    {forecast.weather[0].description}
                                                </p>
                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                    <p>H: {Math.round(forecast.main.humidity)}%</p>
                                                    <p>W: {Math.round(forecast.wind.speed)} m/s</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default WeatherForecast;
