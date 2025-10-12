import { useState, useEffect } from "react";
import Loading from "../Loader";

const TomorrowWeatherComponent = () => {
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        if (!lon || !lat) return;

        const fetchForecastData = async () => {
            try {
                // Fetch 5-day/3-hour forecast data
                const forecastResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=d2901acb6971158b00e1237839d5c597`
                );
                if (!forecastResponse.ok) {
                    throw new Error("Failed to fetch forecast data");
                }
                const forecast = await forecastResponse.json();
                setForecastData(forecast);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchForecastData();
    }, []);

    if (loading) return <Loading />;
    if (error) return (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
            Error: {error}
        </div>
    );

    // Get tomorrow's forecast (find the first forecast entry for tomorrow)
    const getTomorrowForecast = () => {
        if (!forecastData) return null;

        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1); // Move to tomorrow

        // Find the first forecast for tomorrow
        const tomorrowForecast = forecastData.list.find((forecast) => {
            const forecastDate = new Date(forecast.dt * 1000);
            return forecastDate.getDate() === tomorrowDate.getDate();
        });

        return tomorrowForecast;
    };

    const tomorrowForecast = getTomorrowForecast();

    return (
        <div>
            {/* Tomorrow's Weather Container */}
            {tomorrowForecast && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        Tomorrow's Weather Forecast
                    </h2>

                    <div className="flex flex-col md:flex-row items-start md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-6">
                        <img
                            src={`http://openweathermap.org/img/wn/${tomorrowForecast.weather[0].icon}@2x.png`}
                            alt={tomorrowForecast.weather[0].description}
                            className="w-24 h-24"
                        />
                        <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-red-600 dark:text-red-400">Max Temperature:</span> {tomorrowForecast.main.temp_max}°C
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">Min Temperature:</span> {tomorrowForecast.main.temp_min}°C
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">Weather:</span> {tomorrowForecast.weather[0].description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-blue-600 dark:text-blue-400 font-semibold">Humidity</p>
                            <p className="text-lg text-gray-700 dark:text-gray-300">{tomorrowForecast.main.humidity}%</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <p className="text-green-600 dark:text-green-400 font-semibold">Wind Speed</p>
                            <p className="text-lg text-gray-700 dark:text-gray-300">{tomorrowForecast.wind.speed} m/s</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                            <p className="text-purple-600 dark:text-purple-400 font-semibold">Pressure</p>
                            <p className="text-lg text-gray-700 dark:text-gray-300">{tomorrowForecast.main.pressure} hPa</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                            <p className="text-yellow-600 dark:text-yellow-400 font-semibold">Visibility</p>
                            <p className="text-lg text-gray-700 dark:text-gray-300">{tomorrowForecast.visibility / 1000} km</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">Additional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                            <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">Cloudiness:</span> {tomorrowForecast.clouds.all}%
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-green-600 dark:text-green-400">Wind Gust:</span> {tomorrowForecast.wind.gust || 'N/A'} m/s
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">Wind Direction:</span> {tomorrowForecast.wind.deg}°
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TomorrowWeatherComponent;
