'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

const CropsPage = () => {
    const [crops, setCrops] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCrops = async () => {
            try {
                // Make API request to your backend (ensure the endpoint is correct)
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/crops`); 
                setCrops(response.data); // Assuming the API returns an array of crops
            } catch (error) {
                console.error('Error fetching crops:', error);
                setError('Failed to fetch crops.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCrops();
    }, []);

    if (isLoading) {
        return <div className="text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-500">{error}</div>;
    }

    const createSlug = (name) => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    };

    return (
        <div className="container mx-auto px-4 py-8 bg-green-500/10">
            <h1 className="text-3xl text-center mb-8">Crops</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {crops.map((crop) => (
                    <Link href={`/crops/${createSlug(crop.name)}`} key={crop._id}>
                        <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-green-500/50">
                            {crop.imageUrl && (
                                <img src={crop.imageUrl} alt={crop.name} className="w-full h-48 object-cover" />
                            )}
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">{crop.name}</h2>
                                <p className="text-sm mb-2 italic">{crop.biologicalName}</p>
                                <p className="text-md font-bold">Average maturity time: {crop.avgGrowthTime} months</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CropsPage;
