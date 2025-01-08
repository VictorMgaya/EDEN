/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from "react";

export default function Page() {
  const fetchCrops = async () => {
    const res = await fetch("/api/crops");
    const crops = await res.json();
    return crops;
  };

  const [, setCrops] = useState([]);
  const [randomCrop, setRandomCrop] = useState<any>(null);

  useEffect(() => {
    fetchCrops().then((fetchedCrops) => {
      setCrops(fetchedCrops);
      // Randomly pick a crop
      setRandomCrop(fetchedCrops[Math.floor(Math.random() * fetchedCrops.length)]);
    });
  }, []);

  return (
    <div style={{ padding: "20px",
      }}>
      {randomCrop && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            backgroundColor: "transparent",
            lineHeight: "1.6",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <img
            src={randomCrop.imageUrl || "/default-crop-image.jpg"} // Replace with your default image path
            alt={randomCrop.name}
            style={{
              flex: "0 0 150px",
              maxWidth: "150px",
              height: "auto",
              borderRadius: "8px",
              marginRight: "20px",
            }}
          />
          <div style={{ flex: "1" }}>
            <h2 style={{ margin: "0 0 10px 0", color: "#333" }}>{randomCrop.name}</h2>
            <p>
              <strong>Biological Name:</strong> {randomCrop.biologicalName}
            </p>
            <p >
              <strong>Growth Time:</strong> {randomCrop.avgGrowthTime} months
            </p>
            <p >{randomCrop.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
