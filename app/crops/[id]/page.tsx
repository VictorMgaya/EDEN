/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Loading from '@/components/Loader';

type Crop = {
    _id: string;
    name: string;
    biologicalName: string;
    soilClass: string;
    avgGrowthTime: string;
    description: string;
    Kc: Float32Array;
    infosources: string;
    imageUrl: string;
};

// Utility function to get meta tags
function getMetaTags(crop: Crop | null) {
    if (!crop) return null;

    return {
        title: `${crop.name} - Crop Details`,
        description: `Learn about ${crop.name}, including growth time and soil requirements.`,
        'og:title': `${crop.name} - Complete Farming Guide`,
        'og:description': `Everything you need to know about growing ${crop.name}`,
        'og:image': crop.imageUrl || '/default-crop-image.jpg',
        'twitter:card': 'summary_large_image',
        'twitter:title': `${crop.name} Farming Guide`,
        'twitter:description': `Guide to growing ${crop.name}`,
        'twitter:image': crop.imageUrl || '/default-crop-image.jpg',
    };
}

export default function CropDetailsPage() {
    const [crop, setCrop] = useState<Crop | null>(null);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const id = params?.id;

    // Function to update meta tags
    const updateMetaTags = (crop: Crop) => {
        const metaTags = getMetaTags(crop);
        if (!metaTags) return;

        // Update document title
        document.title = metaTags.title;

        // Update meta tags
        Object.entries(metaTags).forEach(([key, value]) => {
            // Update existing meta tags or create new ones
            let meta = document.querySelector(`meta[name="${key}"]`) ||
                document.querySelector(`meta[property="${key}"]`);

            if (!meta) {
                meta = document.createElement('meta');
                if (key.startsWith('og:')) {
                    meta.setAttribute('property', key);
                } else {
                    meta.setAttribute('name', key);
                }
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', value);
        });
    };

    useEffect(() => {
        const fetchCrop = async () => {
            if (!id) return;

            try {
                const response = await fetch(`/api/crops/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch crop data');
                }
                const data: Crop = await response.json();
                setCrop(data);
                updateMetaTags(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error('Failed to fetch crop:', err);
            }
        };

        fetchCrop();

        // Cleanup function to reset meta tags
        return () => {
            document.title = 'Crop Guide';
            // Remove dynamic meta tags if needed
        };
    }, [id]);

    if (error) {
        return (
            <div className="container p-4 text-red-500">
                <h2>Error loading crop details</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!crop) {
        return <Loading />;
    }

    return (
        <main className="container rounded-lg px-4 py-8 bg-green-500/10">
            <article itemScope itemType="https://schema.org/Article">
                <div className="flex-auto items-center">
                    <h1 itemProp="name" className="text-3xl font-bold mb-4">{crop.name}</h1>
                    <img
                        itemProp="image"
                        src={crop.imageUrl || '/edenapp.site'}
                        alt={`${crop.name} cultivation guide`}
                        className="w-full h-auto object-cover rounded-lg mr-4"
                    />
                    <div className="flex-1">
                        <p itemProp="alternativeHeadline" className="text-lg mb-2 font-semibold">
                            Biological Name: {crop.biologicalName}
                        </p>
                        <p itemProp="text" className="text-lg mb-2">
                            Average Growth Time: {crop.avgGrowthTime} months
                        </p>
                        <p itemProp="text" className="text-lg mb-2">
                            Soil Class: {crop.soilClass}
                        </p>
                        <p itemProp="text" className="text-lg mb-2">
                            Crop Coefficient (Kc): {crop.Kc}
                        </p>
                        <div className="mt-4">
                            <h2 className="font-semibold">Description:</h2>
                            <div itemProp="description">{crop.description}</div>
                        </div>
                    </div>
                </div>
            </article>
        </main>
    );
}