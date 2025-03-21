/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Loading from '@/components/Loader';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


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
    const [navigation, setNavigation] = useState<{ prev: string | null, next: string | null }>({
        prev: null,
        next: null
    });

    // Add this to your existing useEffect that fetches crop data
    useEffect(() => {
        const fetchCropNavigation = async () => {
            if (!crop) return;

            try {
                const response = await fetch('/api/crops');
                const data = await response.json();
                const allCrops = Array.isArray(data) ? data : [];

                // Sort crops by name
                const sortedCrops = allCrops.sort((a: Crop, b: Crop) =>
                    a.name.localeCompare(b.name)
                );

                const currentIndex = sortedCrops.findIndex((c: Crop) => c._id === crop._id);

                setNavigation({
                    prev: currentIndex > 0 ? sortedCrops[currentIndex - 1]._id : null,
                    next: currentIndex < sortedCrops.length - 1 ? sortedCrops[currentIndex + 1]._id : null
                });
            } catch (err) {
                console.error('Failed to fetch navigation:', err);
            }
        };

        fetchCropNavigation();
    }, [crop]);



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

    const sanitizedDescription = DOMPurify.sanitize(crop.description);

    const styles = {
        link: {
            color: '#3498db',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'color 0.3s ease',
        },
        linkHover: {
            color: '#e74c3c',
            textDecoration: 'underline',
        },
    };

    return (
        <main className='bg-green-600/20'>
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
                            <div
                                itemProp="description"
                                dangerouslySetInnerHTML={{
                                    __html: crop.description.replace(
                                        /<a /g,
                                        `<a style="color:${styles.link.color}; text-decoration:${styles.link.textDecoration}; font-weight:${styles.link.fontWeight}; transition:${styles.link.transition}"`
                                    ),
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between mt-8 mb-4 px-4">
                    {navigation.prev && (
                        <Link href={`/crops/${navigation.prev}`}>
                            <Button variant="outline" className="flex items-center gap-2">
                                ← Previous Crop
                            </Button>
                        </Link>
                    )}
                    {navigation.next && (
                        <Link href={`/crops/${navigation.next}`}>
                            <Button variant="outline" className="flex items-center gap-2">
                                Next Crop →
                            </Button>
                        </Link>
                    )}
                </div>

            </article>
        </main>
    );

}

function useMetadata(arg0: { title: string; description: string; image: string | undefined; type: string; }) {
    throw new Error('Function not implemented.');
}
