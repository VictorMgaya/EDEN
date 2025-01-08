'use client'

import { useEffect, useState } from "react";

export default function Page() {
  const fetchCrops = async () => {
    const res = await fetch("/api/crops");
    const crops = await res.json();
    return crops;
  };

  const [, setCrops] = useState([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [randomCrop, setRandomCrop] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false); // New state to track the details view

  const limitText = (text: string | undefined, wordLimit: number) => {
    if (!text) return ""; // Handle case where text is undefined
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
  };

  useEffect(() => {
    fetchCrops().then((fetchedCrops) => {
      setCrops(fetchedCrops);
      setRandomCrop(fetchedCrops[Math.floor(Math.random() * fetchedCrops.length)]);
    });
  }, []);

  const handleClick = () => {
    setShowDetails(!showDetails); // Toggle the details view on click
  };

  return (
    <div style={{ padding: "20px" }}>
      {randomCrop && (
        <div
          onClick={handleClick} // Add click handler to toggle details
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(0, 128, 0, 0.2)", // Green border with 20% opacity
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "rgba(0, 255, 0, 0.05)", // Light green background with blur effect
            backdropFilter: "blur(5px)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
            lineHeight: "1.6",
            maxWidth: "800px",
            margin: "0 auto",
            cursor: "pointer", // Change cursor to indicate it's clickable
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
            <img
              src={randomCrop.imageUrl || "/default-crop-image.jpg"}
              alt={randomCrop.name}
              style={{
                flex: "0 0 200px",
                maxWidth: "200px",
                height: "auto",
                borderRadius: "12px",
                marginRight: "20px",
              }}
            />
            <div style={{ flex: "1" }}>
              <h1>
                {randomCrop.name}
              </h1>
              <p>
                <strong>Biological Name:</strong> {randomCrop.biologicalName}
              </p>
              <p>
                <strong>Growth Time:</strong> {randomCrop.avgGrowthTime} months
              </p>
            </div>
          </div>
          <p>
            {limitText(randomCrop.description, 60)} {/* Limit to 60 words */}
          </p>
          {showDetails && ( // Conditionally render the detailed view if `showDetails` is true
            <div style={{ marginTop: "16px", padding: "10px", borderTop: "1px solid rgba(0, 128, 0, 0.2)" }}>
              <h3>Additional Information:</h3>
              <p><strong>Soil Requirements:</strong> {randomCrop.soilRequirements}</p>
              <p><strong>Watering Needs:</strong> {randomCrop.wateringNeeds}</p>
              <p><strong>Harvesting Time:</strong> {randomCrop.harvestingTime} months</p>
              <p><strong>Common Pests:</strong> {randomCrop.commonPests}</p>
              <p><strong>Optimal Temperature:</strong> {randomCrop.optimalTemperature}°C</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
