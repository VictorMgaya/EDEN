'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Page from '@/components/crops';
import AdsContainer from '@/components/monetization/containerBannerads';

// Dynamic imports for charts with SSR disabled
const AreaChart = dynamic(() => import('@/components/charts/AreaChartGradient'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const PieChart = dynamic(() => import('@/components/charts/PieChart'), { ssr: false });

export default function Home() {
  const [isMounted, setIsMounted] = useState(false); // Track whether the component is mounted
  const [location, setLocation] = useState(null); // Store geolocation data
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

    let watchId; // Initialize variable for watchId

    const requestUserLocation = () => {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lon: longitude });

            // Update the URL with the user's location
            router.push(`?lon=${longitude}&lat=${latitude}`, undefined, { shallow: true });
          },
          (error) => {
            // Log the error properly with a fallback message
            console.error("Error getting location:", error?.message || "Unknown error");
          }
        );
      } else {
        console.error("Geolocation is not available in your browser.");
      }
    };

    requestUserLocation();

    // Cleanup on unmount
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router]);

  // Prevent rendering charts and geolocation updates before the component is mounted
  if (!isMounted) return null;

  return (
    <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Pass location to each chart if necessary */}
      <AreaChart location={location} />
      <Page />
      <PieChart location={location} />
      <LineChart location={location} />
      <Page />
      <Page />
      <AdsContainer />
      <Page />
      <Page />
      <AdsContainer />
    </div>
  );
}
