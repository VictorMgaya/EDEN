'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DailyWeather from '@/components/weather/daily';
import WeeklyWeather from '../components/weather/weekly';
import TommorowWeather from '../components/weather/tommorow';
import TopSoilClassComponent from '../components/soil/dominatingclass';
import TopSoilClassesChart from '../components/soil/top5classes';
import ExpertsExperts from './Experts/page';


export default function Home() {
  const [isMounted, setIsMounted] = useState(false); // Track whether the component is mounted
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [location, setLocation] = useState({
    lat: -9.308504812575954,
    lon: 32.76276909918686
  }); // Initialize with default coordinates

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);

    const currentParams = new URLSearchParams(window.location.search);
    const currentLat = parseFloat(currentParams.get('lat'));
    const currentLon = parseFloat(currentParams.get('lon'));

    // Set default location for Eden only if no params exist
    if (!currentLat && !currentLon) {
      router.push(`?lon=32.76276909918686&lat=-9.308504812575954`);
      setTimeout(() => window.location.reload(), 5000);
      setLocation({ lat: -9.308504812575954, lon: 32.76276909918686 });
    }

    let watchId;

    const requestUserLocation = () => {
      if ("geolocation" in navigator && !currentLat && !currentLon) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // Check if location has changed significantly (more than 0.0001 degrees)
            if (Math.abs(latitude - currentLat) > 0.0001 || Math.abs(longitude - currentLon) > 0.0001) {
              setLocation({ lat: latitude, lon: longitude });
              router.push(`?lon=${longitude}&lat=${latitude}`);
              setTimeout(() => window.location.reload(), 5000);
              // Clear the watch after successful location update
              navigator.geolocation.clearWatch(watchId);
            }
          },
          (error) => {
            console.error("Error getting location:", error?.message || "Unknown error");
          }
        );
      } else {
        console.error("Geolocation is not available in your browser.");
      }
    };

    requestUserLocation();

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router]);


  if (!isMounted) return null;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Pass location to each chart if necessary */}
        <DailyWeather />
        <TommorowWeather />
      </div>
      <div className="grid gap-6 p-6 w-full">
        <WeeklyWeather />
      </div>
      <h1 className=" flex text-2xl justify-center font-bold bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-t-2xl"> Soil Analysis</h1>
      <div className="grid md:grid-cols-2 gap-6 p-6 w-full bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-b-2xl">
        <TopSoilClassComponent />
        <TopSoilClassesChart />
      </div>
      <div>

        <ExpertsExperts />
      </div>
    </div>
  );
}
