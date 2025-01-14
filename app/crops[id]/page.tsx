/* eslint-disable @next/next/no-img-element */
// Client-Side Component
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import Loading from '@/components/Loader';
import Crop from '@/app/model/crops';

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
    const params = useParams();
    const id = params?.id;
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchCrop = async () => {
            if (!id) return;

            try {
                const response = await fetch(`/api/crops/${id}`);
                if (response.ok) {
                    const data: Crop = await response.json();
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
        return <Loading />;
    }

    const shareUrl = window.location.href;

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

            <main className="container rounded-lg px-4 py-8 bg-green-500/10 relative">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold mb-4">{crop.name}</h1>
                    <div className="relative">
                        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="bg-green-700 px-4 py-2 rounded-2xl">
                            Share
                        </button>
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-green-700 border rounded shadow-lg z-10">
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                                    Share on Facebook
                                </a>
                                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(crop.name)}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                                    Share on Twitter
                                </a>
                                <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(crop.name)}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                                    Share on LinkedIn
                                </a>
                            </div>
                        )}
                    </div>
                </div>
                <img
                    src={crop.imageUrl || '/default-crop-image.jpg'}
                    alt={crop.name}
                    className="w-full h-auto object-cover rounded-2xl mr-4"
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
            </main>
        </>
    );
}
