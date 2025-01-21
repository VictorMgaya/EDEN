'use client';

import { useState, useEffect } from "react";
import Loading from "../Loader";

const DailyWeather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        if (!lon || !lat) return;

        const fetchWeatherData = async () => {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=d2901acb6971158b00e1237839d5c597`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch weather data");
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, []);

    if (loading) return <Loading />;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="weather-container bg-gradient-to-r from-blue-500/20 to-blue-300/20 p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Current Weather</h2>
            <div className="flex items-center mb-6">
                <img
                    src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                    alt={weatherData.weather[0].description}
                    className="w-24 h-24 mr-4"
                />
                <div>
                    <p className="text-lg font-medium"><strong>Location:</strong> {weatherData.name}</p>
                    <p className="text-lg"><strong>Temperature:</strong> {weatherData.main.temp}°C</p>
                    <p className="text-lg"><strong>Weather:</strong> {weatherData.weather[0].description}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <p className="text-lg"><strong>Humidity:</strong> {weatherData.main.humidity}%</p>
                <p className="text-lg"><strong>Wind Speed:</strong> {weatherData.wind.speed} m/s</p>
                <p className="text-lg"><strong>Pressure:</strong> {weatherData.main.pressure} hPa</p>
                <p className="text-lg"><strong>Visibility:</strong> {weatherData.visibility / 1000} km</p>
            </div>
            <div className="mt-6">
                <h3 className="text-xl font-semibold">Additional Information</h3>
                <p className="text-lg"><strong>Cloudiness:</strong> {weatherData.clouds.all}%</p>
                <p className="text-lg"><strong>Sunrise:</strong> {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}</p>
                <p className="text-lg"><strong>Sunset:</strong> {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}</p>
            </div>
        </div>
    );
};

export default DailyWeather;
