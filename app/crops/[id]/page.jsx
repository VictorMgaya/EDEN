'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const CropPage = () => {
    const { id } = useParams();
    const [crop, setCrop] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCrop = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/crops/${id}`);
                setCrop(response.data);
            } catch (error) {
                console.error('Error fetching crop:', error);
                setError(error.response?.data?.message || 'Failed to fetch crop details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCrop();
    }, [id]);

    if (isLoading) return <div className="text-center mt-8">Loading...</div>;
    if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
    if (!crop) return <div className="text-center mt-8">No crop found.</div>;

    return (
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-muted rounded-lg shadow-md">
            <Link href="/crops" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Crops</Link>
            <h1 className="text-3xl font-bold mb-4">{crop.name}</h1>
            {crop.imageUrl && <img src={crop.imageUrl} alt={crop.name} className="w-full h-64 object-cover rounded-lg mb-4" />}
            <div className="space-y-2">
                <p><strong>Biological Name:</strong> {crop.biologicalName}</p>
                <p><strong>Soil Class:</strong> {crop.soilClass}</p>
                <p><strong>Average Growth Time:</strong> {crop.avgGrowthTime} days</p>
                <p><strong>Kc:</strong> {crop.Kc}</p>
                <p><strong>Description:</strong> {crop.description}</p>
                <p><strong>Info Source:</strong> <a href={crop.infosource} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Source</a></p>
            </div>
        </div>
    );
};

export default CropPage;
