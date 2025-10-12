"use client";

import React, { useEffect, useState, createContext, useContext } from 'react';
import L from 'leaflet';
import MapContainerComponent from '@/components/maps/container';
import TopSoilClassChart from '@/components/soil/allclasses';
import TopSoilClassComponent from '@/components/soil/dominatingclass';
import WeeklyWeather from '@/components/weather/weekly';
import PopulationDetailsComponent from '@/components/Population/100msq';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'react-feather';

// Context for caching analytics state
const AnalyticsCacheContext = createContext();

export function useAnalyticsCache() {
  return useContext(AnalyticsCacheContext);
}

export function AnalyticsCacheProvider({ children }) {
  const [cache, setCache] = useState(null);
  return (
    <AnalyticsCacheContext.Provider value={{ cache, setCache }}>
      {children}
    </AnalyticsCacheContext.Provider>
  );
}

export default function AnalyticsContainer() {
  const { cache, setCache } = useAnalyticsCache();
  const [center, setCenter] = useState(cache?.center || { lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(cache?.zoom || 13);
  const [scannedLocation, setScannedLocation] = useState(cache?.scannedLocation || null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const icon = L.icon({
    iconUrl: './locationtag.png',
    iconSize: [25, 40],
  });

  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setScannedLocation(location);
      setShowLocationPrompt(false);
      setCache({ center: location, zoom: 13, scannedLocation: location });
      // Update URL with new coordinates
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('lat', location.lat);
      searchParams.set('lon', location.lng);
      window.history.pushState({}, '', `?${searchParams.toString()}`);
    } catch (error) {
      console.warn('Location access denied or failed:', error);
      setLocationPermissionDenied(true);
      setShowLocationPrompt(false);
    }
  };

  useEffect(() => {
    if (cache) {
      setCenter(cache.center);
      setScannedLocation(cache.scannedLocation);
      setZoom(cache.zoom);
      setShowLocationPrompt(false);
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon'));
    if (!isNaN(lat) && !isNaN(lon)) {
      setCenter({ lat, lng: lon });
      setScannedLocation({ lat, lng: lon });
      setZoom(13);
      setShowLocationPrompt(false);
      setCache({ center: { lat, lng: lon }, zoom: 13, scannedLocation: { lat, lng: lon } });
    } else {
      requestLocationPermission();
    }
    return () => {};
  }, []);

  // Render as raw HTML for LLMs or other consumers
  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <MapContainerComponent
          center={center}
          zoom={zoom}
          scannedLocation={scannedLocation}
          icon={icon}
        />
        <div className="mt-6">
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg">
            <BarChart2 className="mr-2" />Analyse
          </Button>
        </div>
        {scannedLocation && (
          <div className="mt-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700">
              <PopulationDetailsComponent />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700">
              <WeeklyWeather />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700">
              <TopSoilClassChart />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
