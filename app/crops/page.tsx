/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Head from 'next/head';

export default function CropsLibrary() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const cropsPerLoad = 5;
  const router = useRouter();

  // Metadata setup for Crops Library
  const metadata = {
    title: "Crops Library - Eden App",
    description: "Explore our comprehensive library of crops with detailed growing information and specifications",
    image: "https://www.sare.org/wp-content/uploads/Cover-Crop-Images-Library-screenshot.jpg",
    type: "website"
  };

  useEffect(() => {
    // Update document metadata
    document.title = metadata.title;
    const metaTags = [
      { name: "description", content: metadata.description },
      { property: "og:title", content: metadata.title },
      { property: "og:description", content: metadata.description },
      { property: "og:image", content: metadata.image },
      { property: "og:type", content: metadata.type },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: metadata.title },
      { name: "twitter:description", content: metadata.description },
      { name: "twitter:image", content: metadata.image }
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);

      if (!tag) {
        tag = document.createElement('meta');
        if (property) {
          tag.setAttribute('property', property);
        } else if (name) {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });
  }, []);

  const fetchCrops = async () => {
    const res = await fetch("/api/crops");
    const crops = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return crops.sort((a: any, b: any) => a.name.localeCompare(b.name));
  };

  const loadMoreCrops = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting) {
      setPage((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver(loadMoreCrops, options);
    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadMoreCrops]);

  useEffect(() => {
    setLoading(true);
    fetchCrops().then((fetchedCrops) => {
      setCrops(fetchedCrops);
      setLoading(false);
    });
  }, []);

  const truncateDescription = (text: string, wordLimit: number) => {
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
  };

  const displayedCrops = crops.slice(0, page * cropsPerLoad);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewDetails = (id: any) => {
    router.push(`/crops/${id}`);
  };

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Head>
      <div className="container rounded-lg mx-auto px-4 py-8 bg-green-500/10">
        <h1 className="text-3xl font-bold mb-6">Crops Library</h1>
        {displayedCrops.map((crop) => (
          <div
            key={crop._id}
            className="flex flex-col md:flex-row items-start font-primary rounded-lg p-4 sm:p-5 mb-4 bg-green-600/10 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <img
              src={crop.imageUrl || "/default-crop-image.jpg"}
              alt={crop.name}
              className="md:w-1/2 h-auto object-cover rounded-lg mr-5"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">{crop.name}</h2>
              <div className="mb-4 space-y-2">
                <p className="font-semibold">Specifications:</p>
                <p>
                  <span className="font-medium">Biological Name:</span>{" "}
                  {crop.biologicalName}
                </p>
                <p>
                  <span className="font-medium">Growth Time:</span>{" "}
                  {crop.avgGrowthTime} months
                </p>
                <p>
                  <span className="font-medium">Soil Class:</span>{" "}
                  {crop.soilClass}
                </p>
                <p>
                  <span className="font-medium">Crop Coefficient (Kc):</span>{" "}
                  {crop.Kc}
                </p>
              </div>
              <div className="mt-4">
                <p className="font-semibold">Description:</p>
                <p className="paragraph">
                  {truncateDescription(crop.description, 50)}
                </p>
              </div>
              <div className="mt-4">
                <button
                  className="bg-green-600 hover:bg-green-700 font-bold py-2 px-4 rounded-2xl"
                  onClick={() => handleViewDetails(crop._id)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={loadingRef} className="h-10" />
      </div>
    </>
  );
}