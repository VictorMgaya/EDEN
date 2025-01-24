'use client';

import { useState, useEffect } from "react";

const SoilMineralsComponent = () => {
    const [minerals, setMinerals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        if (!lat || !lon) {
            setError("Latitude or longitude is missing in the URL.");
            setLoading(false);
            return;
        }

        const fetchSoilMinerals = async () => {
            try {
                const response = await fetch(
                    `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=soc&property=nitrogen&property=phh2o&depth=0-5cm`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch soil minerals data.");
                }
                const data = await response.json();

                // Process the mineral data
                const mineralsList = [
                    {
                        name: "Organic Carbon",
                        value: data.properties.soc.values[0],
                        unit: "g/kg"
                    },
                    {
                        name: "Nitrogen",
                        value: data.properties.nitrogen.values[0],
                        unit: "g/kg"
                    },
                    {
                        name: "pH (H2O)",
                        value: data.properties.phh2o.values[0],
                        unit: "pH"
                    }
                ];

                setMinerals(mineralsList);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSoilMinerals();
    }, []);

    if (loading) return <p>Loading soil minerals...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="mx-auto soil-minerals-container bg-green-500/20 p-4 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Soil Minerals Composition</h2>
            <div className="space-y-4">
                {minerals.map((mineral, index) => (
                    <div key={index} className="mineral-item p-3 bg-white/50 rounded-lg">
                        <p className="text-lg">
                            <strong>{mineral.name}:</strong> {mineral.value} {mineral.unit}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div
                                className="bg-green-600 h-2.5 rounded-full"
                                style={{ width: `${(mineral.value / 100) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SoilMineralsComponent;
