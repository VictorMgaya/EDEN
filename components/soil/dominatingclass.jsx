import { useState, useEffect } from "react";

const soilClassImages = {
    Lixisols: "https://example.com/images/lixisols.jpg", // Replace with actual URL
    Ferralsols: "https://example.com/images/ferralsols.jpg",
    Acrisols: "https://example.com/images/acrisols.jpg",
    Cambisols: "https://example.com/images/cambisols.jpg",
    Arenosols: "https://example.com/images/arenosols.jpg",
    // Add other soil classes as needed
};

const TopSoilClassComponent = () => {
    const [soilClass, setSoilClass] = useState(null);
    const [classValue, setClassValue] = useState(null);
    const [classProbability, setClassProbability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Extract latitude and longitude from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        // If latitude or longitude is missing, exit early
        if (!lat || !lon) {
            setError("Latitude or longitude is missing in the URL.");
            setLoading(false);
            return;
        }

        // Fetch top soil class data from SoilGrids API
        const fetchTopSoilClass = async () => {
            try {
                const response = await fetch(
                    `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=1`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch top soil class data.");
                }
                const data = await response.json();

                // Extract details from the response
                setSoilClass(data.wrb_class_name);
                setClassValue(data.wrb_class_value);
                setClassProbability(data.wrb_class_probability[0][1]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTopSoilClass();
    }, []);

    if (loading) return <p>Loading top soil class...</p>;
    if (error) return <p>Error: {error}</p>;

    // Get the image URL for the soil class
    const soilImage = soilClassImages[soilClass] || "https://cdn.britannica.com/70/24270-004-5D749430/soil-profile-Fluvisol-sediments-South-Africa-rivers.jpg"; // Fallback image

    return (
        <div className="top-soil-class-container bg-yellow-500/20 p-4 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Top Soil Class</h2>
            <p className="text-lg"><strong>Soil Class Name:</strong> {soilClass}</p>
            <p className="text-lg"><strong>Class Value:</strong> {classValue}</p>
            <p className="text-lg"><strong>Class Probability:</strong> {classProbability}%</p>
            {soilImage && (
                <div className="mt-4">
                    <img
                        src={soilImage}
                        alt={soilClass}
                        className="flex w-auto h-auto rounded-lg shadow-md"
                    />
                </div>
            )}
        </div>
    );
};

export default TopSoilClassComponent;
