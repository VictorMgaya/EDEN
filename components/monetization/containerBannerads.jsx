'use client';

import { useState, useEffect } from "react";

export default function AdsContainer() {
  const fetchAds = async () => {
    const res = await fetch("/api/ads"); // Replace with your API endpoint for fetching ads
    const ads = await res.json();
    return ads;
  };

  const [, setAds] = useState([]);
  const [randomAd, setRandomAd] = useState(null);

  useEffect(() => {
    fetchAds().then((fetchedAds) => {
      setAds(fetchedAds);
      setRandomAd(fetchedAds[Math.floor(Math.random() * fetchedAds.length)]);
    });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {randomAd && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(0, 0, 128, 0.2)", // Blue border with 20% opacity
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "rgba(0, 0, 255, 0.05)", // Light blue background with blur effect
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
              src={randomAd.imageUrl || "/default-ad-image.jpg"}
              alt={randomAd.title}
              style={{
                flex: "0 0 200px",
                maxWidth: "200px",
                height: "auto",
                borderRadius: "12px",
                marginRight: "20px",
              }}
            />
            <div style={{ flex: "1" }}>
              <h1>{randomAd.title}</h1>
              <p>
                <strong>Advertiser:</strong> {randomAd.advertiser}
              </p>
              <p>
                <strong>Category:</strong> {randomAd.category}
              </p>
            </div>
          </div>
          <p>
            {randomAd.description}
          </p>
          <a
            href={randomAd.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: "16px",
              color: "#0066cc",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            Learn More
          </a>
        </div>
      )}
    </div>
  );
}
