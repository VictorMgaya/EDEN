/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';

export default function Page() {
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const cropsPerLoad = 5;
  const router = useRouter();

  const fetchCrops = async () => {
    const res = await fetch("/api/crops");
    const crops = await res.json();
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
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const displayedCrops = crops.slice(0, page * cropsPerLoad);

  return (
    <div className="container rounded-lg mx-auto px-4 py-8 bg-green-500/10">
      {displayedCrops.map((crop) => (
        <div
          key={crop._id}
          onClick={() => router.push(`/crops-Library/${crop._id}`)}
          className="flex items-start font-primary rounded-lg p-5 mb-4 bg-green-600/10 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <img
            src={crop.imageUrl || "/default-crop-image.jpg"}
            alt={crop.name}
            className="w-1/2 h-auto object-cover rounded-lg mr-5"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 ">{crop.name}</h2>
            <div className="mb-4 space-y-2">
              <p className="font-semibold">Specifications:</p>
              <p><span className="font-medium">Biological Name:</span> {crop.biologicalName}</p>
              <p><span className="font-medium">Growth Time:</span> {crop.avgGrowthTime} months</p>
              <p><span className="font-medium">Soil Class:</span> {crop.soilClass}</p>
              <p><span className="font-medium">Crop Coefficient (Kc):</span> {crop.Kc}</p>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Description:</p>
              <p className="paragraph">{truncateDescription(crop.description, 50)}</p>
            </div>
          </div>
        </div>
      ))}
      <div ref={loadingRef} className="h-10" />
    </div>
  );
}