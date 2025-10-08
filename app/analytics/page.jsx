'use client';

import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import MapContainerComponent from '@/components/maps/container';
import TopSoilClassChart from '@/components/soil/allclasses';
import WeeklyWeather from '@/components/weather/weekly';
import PopulationDetailsComponent from '@/components/Population/100msq'
import { Button } from '@/components/ui/button';
import { BarChart2, MapPin } from 'react-feather';
import { saveAnalyticsCache } from '@/utils/analyticsCache';

function AnalyticsPage() {
  const [center, setCenter] = useState({ lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(13);
  const [scannedLocation, setScannedLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const icon = L.icon({
    iconUrl: './locationtag.png',
    iconSize: [25, 40],
  });

  // Track loading state of each component
  const [populationLoaded, setPopulationLoaded] = useState(false);
  const [weatherLoaded, setWeatherLoaded] = useState(false);
  const [soilLoaded, setSoilLoaded] = useState(false);

  // Callback props for child components to signal when loaded
  const handlePopulationLoaded = () => setPopulationLoaded(true);
  const handleWeatherLoaded = () => setWeatherLoaded(true);
  const handleSoilLoaded = () => setSoilLoaded(true);

  // Cache only when all components are loaded
  // Track if cache has already been saved for this session
  const [cacheSaved, setCacheSaved] = useState(false);

  // Cache only when all analysis components are fully rendered
  useEffect(() => {
    if (!cacheSaved && populationLoaded && weatherLoaded && soilLoaded) {
      setTimeout(() => {
        const container = document.querySelector('.p-4');
        if (container) {
          const children = Array.from(container.children).slice(1);
          const pageHtml = container.outerHTML;
          saveAnalyticsCache({
            scannedLocation,
            zoom,
            timestamp: new Date().toISOString(),
            pageHtml
          });
          setCacheSaved(true);
        }
      }, 0);
    }
  }, [populationLoaded, weatherLoaded, soilLoaded, cacheSaved, scannedLocation, zoom]);

    const handleLocationSelect = (location) => {
    setScannedLocation(location);
    setShowLocationPrompt(false);
    // Update URL with new coordinates
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('lat', location.lat);
    searchParams.set('lon', location.lng);
    window.history.pushState({}, '', `?${searchParams.toString()}`);
  };

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

      handleLocationSelect(location);
    } catch (error) {
      console.warn('Location access denied or failed:', error);
      setLocationPermissionDenied(true);
      setShowLocationPrompt(false);
      // Trigger header search bar focus
      triggerHeaderLocationSearch();
    }
  };

   useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon'));

    // If URL has coordinates, use them
    if (!isNaN(lat) && !isNaN(lon)) {
      setCenter({ lat, lng: lon });
      setScannedLocation({ lat, lng: lon });
      setZoom(13);
      setShowLocationPrompt(false);
    } else {
      // Request location permission on component mount
      requestLocationPermission();
    }

    // Listen for location updates from header search
    const handleLocationUpdate = (event) => {
      if (event.detail && event.detail.location) {
        handleLocationSelect(event.detail.location);
      }
    };

    window.addEventListener('locationSelected', handleLocationUpdate);
    
    return () => {
      window.removeEventListener('locationSelected', handleLocationUpdate);
    };
  }, []);


  return (
    <div className='p-4'>
      <div className='container:w-full mb-4 p-1 content-center rounded-2xl bg-blue-500/20 z-0 relative'>
        <MapContainerComponent
          center={center}
          zoom={zoom}
          scannedLocation={scannedLocation}
          icon={icon}
          onLocationSelect={handleLocationSelect}
        />
        <Button className='mt-4'
          onClick={() => (
            window.location.reload()
          )}>
          <BarChart2 />Analyse
        </Button>
      </div>
      {scannedLocation && (
        <>
          <PopulationDetailsComponent onLoaded={handlePopulationLoaded} />
          <div className='mt-7'>
            <WeeklyWeather onLoaded={handleWeatherLoaded} />
          </div>
          <div className='mt-7'>
            <TopSoilClassChart onLoaded={handleSoilLoaded} />
          </div>
        </>
      )}
      {!cacheSaved && (
        (!populationLoaded || !weatherLoaded || !soilLoaded) ? (
          <div className='mt-8 text-center text-yellow-700 font-semibold'>
            {`Waiting for: `}
            {(!populationLoaded ? 'Population ' : '')}
            {(!weatherLoaded ? 'Weather ' : '')}
            {(!soilLoaded ? 'Soil ' : '')}
            {`Data to finish collected and loaded...`}
          </div>
        ) : null
      )}

      {cacheSaved && (
        <div className='mt-8 text-center'>
          <Button onClick={() => window.location.href = '/Experts'}>
            Get Expert Advice
          </Button>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
