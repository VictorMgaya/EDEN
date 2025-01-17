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
    if (error) return <p>Error: {error}</p>;

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
                <div className="tomorrow-weather-container bg-gradient-to-r from-green-300/20 to-green-500/20 p-4 rounded-2xl shadow-lg max-w-4xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-4">Tommorow Weather Forecast</h2>
                    <div className="flex items-center mb-6">
                        <img
                            src={`http://openweathermap.org/img/wn/${tomorrowForecast.weather[0].icon}@2x.png`}
                            alt={tomorrowForecast.weather[0].description}
                            className="w-24 h-24 mr-4"
                        />
                        <div>
                            <p className="text-lg"><strong>Max Temperature:</strong> {tomorrowForecast.main.temp_max}°C</p>
                            <p className="text-lg"><strong>Min Temperature:</strong> {tomorrowForecast.main.temp_min}°C</p>
                            <p className="text-lg"><strong>Weather:</strong> {tomorrowForecast.weather[0].description}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <p className="text-lg"><strong>Humidity:</strong> {tomorrowForecast.main.humidity}%</p>
                        <p className="text-lg"><strong>Wind Speed:</strong> {tomorrowForecast.wind.speed} m/s</p>
                        <p className="text-lg"><strong>Pressure:</strong> {tomorrowForecast.main.pressure} hPa</p>
                        <p className="text-lg"><strong>Visibility:</strong> {tomorrowForecast.visibility / 1000} km</p>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold">More Information</h3>
                        <p className="text-lg"><strong>Cloudiness:</strong> {tomorrowForecast.clouds.all}%</p>
                        <p className="text-lg"><strong>Wind Gust:</strong> {tomorrowForecast.wind.gust} m/s</p>
                        <p className="text-lg"><strong>Wind Direction:</strong> {tomorrowForecast.wind.deg}°</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TomorrowWeatherComponent;
