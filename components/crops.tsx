/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function Page() {
  const fetchExperts = async () => {
    const res = await fetch("/api/Experts");
    const Experts = await res.json();
    return Experts;
  };
  const router = useRouter();

  const [, setExperts] = useState([]);
  const [randomCrop, setRandomCrop] = useState<any>(null);
  // New state to track the details view

  const limitText = (text: string | undefined, wordLimit: number) => {
    if (!text) return ""; // Handle case where text is undefined
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
  };

  useEffect(() => {
    fetchExperts().then((fetchedExperts) => {
      setExperts(fetchedExperts);
      setRandomCrop(fetchedExperts[Math.floor(Math.random() * fetchedExperts.length)]);
    });
  }, []);

  const handleViewDetails = (id: any) => {
    // Use router to navigate to a details page
    router.push(`/Experts/${id}`);
  };


  return (
    <div style={{ padding: "1px" }}>
      {randomCrop && (
        <div
          onClick={() => handleViewDetails(randomCrop._id)}
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(0, 128, 0, 0.2)", // Green border with 20% opacity
            borderRadius: "1px",
            padding: "1px",
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
              width={200}
              height={200}
              style={{
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
        </div>
      )
      }
    </div >
  );
}