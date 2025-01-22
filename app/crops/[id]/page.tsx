/* eslint-disable @typescript-eslint/no-explicit-any */
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

export default function CropDetailsPage() {
    const [crop, setCrop] = useState<Crop | null>(null);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const id = params?.id;

    // Add this custom hook at the top of your file, before the CropDetailsPage component
    function useMetadata({ title, description, image, type }: {
        title: string;
        description: string;
        image?: string;
        type: string;
    }) {
        useEffect(() => {
            // Update document title
            document.title = title;

            // Define meta tags to update
            const metaTags = {
                'description': description,
                'og:title': title,
                'og:description': description,
                'og:image': image || '/eden.svg',
                'og:type': type,
                'twitter:card': 'summary_large_image',
                'twitter:title': title,
                'twitter:description': description,
                'twitter:image': image || '/default-image.jpg',
            };

            // Update meta tags
            Object.entries(metaTags).forEach(([key, value]) => {
                const selector = key.startsWith('og:')
                    ? `meta[property="${key}"]`
                    : `meta[name="${key}"]`;

                let element = document.querySelector(selector);

                if (!element) {
                    element = document.createElement('meta');
                    if (key.startsWith('og:')) {
                        element.setAttribute('property', key);
                    } else {
                        element.setAttribute('name', key);
                    }
                    document.head.appendChild(element);
                }

                element.setAttribute('content', value);
            });
        }, [title, description, image, type]);
    }


    useMetadata({
        title: crop ? `${crop.name} - Crop Details` : 'Eden App',
        description: crop ? `Learn about ${crop.name}, including growth time and soil requirements.` : 'The Resource Analysis Engine',
        image: crop?.imageUrl,
        type: 'article'
    });


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

    useEffect(() => {
        if (crop && typeof window !== 'undefined' && 'setPageMetadata' in window) {
            (window as any).setPageMetadata({
                title: `${crop.name} - Crop Details`,
                description: `Learn about ${crop.name}, including growth time and soil requirements.`,
                image: crop.imageUrl || '/default-image.jpg',
                type: 'article'
            });
        }
    }, [crop]);
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

function useMetadata(arg0: { title: string; description: string; image: string | undefined; type: string; }) {
    throw new Error('Function not implemented.');
}
