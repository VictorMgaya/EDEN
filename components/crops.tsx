/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function Page() {
  const fetchExperts = async () => {
    const res = await fetch("/api/Experts");
    const Experts = await res.json();
    return Experts;
  };
  const router = useRouter();

  const [, setExperts] = useState([]);
  const [randomCrop, setRandomCrop] = useState<any>(null);
  // New state to track the details view

  const limitText = (text: string | undefined, wordLimit: number) => {
    if (!text) return ""; // Handle case where text is undefined
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
  };

  useEffect(() => {
    fetchExperts().then((fetchedExperts) => {
      setExperts(fetchedExperts);
      setRandomCrop(fetchedExperts[Math.floor(Math.random() * fetchedExperts.length)]);
    });
  }, []);

  const handleViewDetails = (id: any) => {
    // Use router to navigate to a details page
    router.push(`/Experts/${id}`);
  };


  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {randomCrop && (
          <div
            onClick={() => handleViewDetails(randomCrop._id)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex flex-col md:flex-row items-start mb-4">
              <img
                src={randomCrop.imageUrl || "/default-crop-image.jpg"}
                alt={randomCrop.name}
                className="w-full md:w-48 h-48 object-cover rounded-xl mb-4 md:mb-0 md:mr-6"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
                  {randomCrop.name}
                </h1>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p className="text-lg">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Biological Name:</span> {randomCrop.biologicalName}
                  </p>
                  <p className="text-lg">
                    <span className="font-semibold text-green-600 dark:text-green-400">Growth Time:</span> {randomCrop.avgGrowthTime} months
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {limitText(randomCrop.description, 60)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
