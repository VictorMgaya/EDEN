import { useState, useEffect } from "react";
import Loading from "../Loader";

const WeatherComponent = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        if (!lon || !lat) return;

        const fetchWeatherData = async () => {
            try {

                // Fetch 7-day forecast data
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

        fetchWeatherData();
    }, []);

    if (loading) return <Loading />;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>

            {/* Weekly Forecast Container */}
            <div className="forecast-container bg-gradient-to-r from-blue-500/30 to-green-500/30 p-6 rounded-2xl shadow-xl w-full">
                <h2 className="text-2xl font-semibold mb-4">7-Day Weather Forecast</h2>
                <div className="grid  sm:grid-cols-3 md:grid-cols-7 gap-2">
                    {forecastData.list.slice(0, 7).map((forecast, index) => (
                        <div key={index} className="forecast-item p-4 rounded-2xl bg-blue-300/20 shadow-md">
                            <p className="text-xl font-medium">{new Date(forecast.dt * 1000).toLocaleDateString()}</p>
                            <img
                                src={`http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`}
                                alt={forecast.weather[0].description}
                                className="w-16 h-16 mb-4"
                            />
                            <p className="text-lg"><strong>Temperature:</strong> {forecast.main.temp}°C</p>
                            <p className="text-lg"><strong>Weather:</strong> {forecast.weather[0].description}</p>
                            <p className="text-lg"><strong>Humidity:</strong> {forecast.main.humidity}%</p>
                            <p className="text-lg"><strong>Wind Speed:</strong> {forecast.wind.speed} m/s</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeatherComponent;
