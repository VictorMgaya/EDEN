"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CropDetails() {
    const { _id } = useParams();
    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (_id) {
            fetch(`/api/crops/${_id}`)
                .then((res) => res.json())
                .then((data) => {
                    setCrop(data);
                    setLoading(false);
                });
        }
    }, [_id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!crop) {
        return <div>Crop not found.</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white shadow-md rounded-lg p-4">
                <img
                    src={crop.imageUrl || "/default-crop-image.jpg"}
                    alt={crop.name}
                    className="w-full h-auto object-cover rounded-lg mb-6"
                />
                <h1 className="text-3xl font-bold mb-4">{crop.name}</h1>
                <p className="mb-4">
                    <strong>Biological Name:</strong> {crop.biologicalName}
                </p>
                <p className="mb-4">
                    <strong>Growth Time:</strong> {crop.avgGrowthTime} months
                </p>
                <p className="mb-4">
                    <strong>Soil Class:</strong> {crop.soilClass}
                </p>
                <p className="mb-4">
                    <strong>Crop Coefficient (Kc):</strong> {crop.Kc}
                </p>
                <h2 className="text-2xl font-semibold mt-6 mb-4">Description:</h2>
                <p>{crop.description}</p>
            </div>
        </div>
    );
}
