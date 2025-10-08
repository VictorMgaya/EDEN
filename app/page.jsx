'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DailyWeather from '@/components/weather/daily';
import WeeklyWeather from '../components/weather/weekly';
import TommorowWeather from '../components/weather/tommorow';
import TopSoilClassComponent from '../components/soil/dominatingclass';
import TopSoilClassesChart from '../components/soil/top5classes';



export default function Home() {
  const [isMounted, setIsMounted] = useState(false); // Track whether the component is mounted
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
  }, []);

  if (!isMounted) return null;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-4 text-center">
      <h1 className="text-5xl font-bold text-green-600 mb-6">Welcome to EDEN</h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl">
        Your sophisticated Resources Analysis Engine. EDEN helps you analyze various environmental resources based on geolocation data.
      </p>
      <p className="text-lg text-gray-600 mb-10 max-w-2xl">
        To start your analysis, please navigate to the <a href="/analytics" className="text-blue-500 hover:underline font-semibold">Analytics Page</a> to collect geolocation-based data.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={() => router.push('/analytics')}
          className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition duration-300"
        >
          Go to Analytics
        </button>
        <button
          onClick={() => alert('Learn more about EDEN!')} // Placeholder for a "Learn More" action
          className="px-6 py-3 border border-green-500 text-green-700 rounded-lg shadow-md hover:bg-green-50 transition duration-300"
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
