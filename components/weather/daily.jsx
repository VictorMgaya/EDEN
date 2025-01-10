/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import React, { useEffect, useState } from 'react';


export default function DailyWeather() {
    const [weatherData, setWeatherData] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const fetchWeatherData = async () => {
        const apiKey = (process.env.OPEN_WEATHER_API); // Replace with your OpenWeatherMap API key
        const lat = parseFloat(urlParams.get('lat'));
        const lon = parseFloat(urlParams.get('lon'));

        // Get the current date in the required format (YYYY-MM-DD)
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];

        // Get the current timezone offset in hours (e.g., +03:00)
        const timezoneOffset = now.getTimezoneOffset(); // Offset in minutes
        const hoursOffset = Math.abs(timezoneOffset / 60).toString().padStart(2, '0');
        const minutesOffset = Math.abs(timezoneOffset % 60).toString().padStart(2, '0');
        const sign = timezoneOffset > 0 ? '-' : '+';
        const tz = `${sign}${hoursOffset}:${minutesOffset}`;

        // Construct the API URL
        const apiUrl = `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${lat}&lon=${lon}&date=${currentDate}&tz=${tz}&appid=${apiKey}`;

        try {
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error('Failed to fetch weather data');
            const data = await res.json();
            setWeatherData(data);
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    };

    useEffect(() => {
        fetchWeatherData();
    }, []);

    const handleClick = () => {
        setShowDetails(!showDetails);
    };

    if (!weatherData) {
        return <div>Loading weather data...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <div
                onClick={handleClick}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(0, 128, 0, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'rgba(0, 255, 0, 0.05)',
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    lineHeight: '1.6',
                    maxWidth: '800px',
                    margin: '0 auto',
                    cursor: 'pointer',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <img
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0]?.icon}@2x.png`}
                        alt={weatherData.weather[0]?.description || 'Weather Icon'}
                        width={100}
                        height={100}
                        style={{
                            maxWidth: '100px',
                            height: 'auto',
                            borderRadius: '12px',
                            marginRight: '20px',
                        }}
                    />
                    <div style={{ flex: '1' }}>
                        <h1>Weather for {new Date().toDateString()}</h1>
                        <p>
                            <strong>Description:</strong> {weatherData.weather[0]?.description}
                        </p>
                        <p>
                            <strong>Temperature:</strong> {weatherData.temp.day}°C
                        </p>
                    </div>
                </div>
                {showDetails && (
                    <div
                        style={{
                            marginTop: '16px',
                            padding: '10px',
                            borderTop: '1px solid rgba(0, 128, 0, 0.2)',
                        }}
                    >
                        <h3>Additional Information:</h3>
                        <p>
                            <strong>Humidity:</strong> {weatherData.humidity}%
                        </p>
                        <p>
                            <strong>Wind Speed:</strong> {weatherData.wind_speed} m/s
                        </p>
                        <p>
                            <strong>Pressure:</strong> {weatherData.pressure} hPa
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
