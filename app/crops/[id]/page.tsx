/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import Loading from '@/components/Loader';

type Crop = {
    _id: string;
    name: string;
    biologicalName: string;
    avgGrowthTime: number;
    soilClass: string;
    Kc: number;
    imageUrl: string;
    description: string;
};

export default function CropDetailsPage() {
    const [crop, setCrop] = useState<Crop | null>(null);
    const params = useParams(); // Use this hook to get `params`
    const id = params?.id; // Retrieve the dynamic ID from `params`

    useEffect(() => {
        const fetchCrop = async () => {
            if (!id) return;

            try {
                const response = await fetch(`/api/crops/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setCrop(data);
                } else {
                    console.error('Error fetching crop:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch crop:', error);
            }
        };

        fetchCrop();
    }, [id]);

    if (!crop) {
        return <Loading />
    }

    return (
        <>
            {/* SEO Metadata */}
            <Head>
                <title>{crop.name} - Crop Details</title>
                <meta name="description" content={`Learn about ${crop.name}, its biological name, average growth time, and other important details.`} />
                <meta property="og:title" content={`${crop.name} - Crop Details`} />
                <meta property="og:description" content={`Learn about ${crop.name}, its biological name, average growth time, and other important details.`} />
                <meta property="og:image" content={crop.imageUrl || '/default-crop-image.jpg'} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${crop.name} - Crop Details`} />
                <meta name="twitter:description" content={`Learn about ${crop.name}, its biological name, average growth time, and other important details.`} />
                <meta name="twitter:image" content={crop.imageUrl || '/default-crop-image.jpg'} />
            </Head>

            <main className="container rounded-lg px-4 py-8 bg-green-500/10">
                <div className="flex-auto items-center">
                    <h1 className="text-3xl font-bold mb-4">{crop.name}</h1>
                    <img
                        src={crop.imageUrl || '/default-crop-image.jpg'}
                        alt={crop.name}
                        className="w-full h-auto object-cover rounded-lg mr-4"
                    />
                    <div className="flex-1">
                        <p className="text-lg mb-2 font-semibold">Biological Name: {crop.biologicalName}</p>
                        <p className="text-lg mb-2">Average Growth Time: {crop.avgGrowthTime} months</p>
                        <p className="text-lg mb-2">Soil Class: {crop.soilClass}</p>
                        <p className="text-lg mb-2">Crop Coefficient (Kc): {crop.Kc}</p>
                        <div className="mt-4">
                            <h2 className="font-semibold">Description:</h2>
                            <p>{crop.description}</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
