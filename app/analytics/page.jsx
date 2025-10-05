'use client';

import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import MapContainerComponent from '@/components/maps/container';
import TopSoilClassChart from '@/components/soil/allclasses';
import TopSoilClassComponent from '@/components/soil/dominatingclass';
import WeeklyWeather from '@/components/weather/weekly';
import PopulationDetailsComponent from '@/components/Population/100msq'
import { Button } from '@/components/ui/button';
import { BarChart2, MapPin } from 'react-feather';

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
      // Update URL with new coordinates
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('lat', location.lat);
      searchParams.set('lon', location.lng);
      window.history.pushState({}, '', `?${searchParams.toString()}`);
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
      // Removed handleLocationSelect and event listener for locationSelected
      return () => {};
  }, []);

  return (
    <div className='p-4'>

      <div className='container:w-full mb-4 p-1 content-center rounded-2xl bg-blue-500/20 z-0 relative'>
          <MapContainerComponent
            center={center}
            zoom={zoom}
            scannedLocation={scannedLocation}
            icon={icon}
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
          <PopulationDetailsComponent />
          <div className='mt-7'>
            <WeeklyWeather />
          </div>
          <div className='mt-7'>
            <TopSoilClassChart />
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;