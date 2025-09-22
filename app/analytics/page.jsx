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

  const triggerHeaderLocationSearch = () => {
    // Dispatch custom event to trigger header search bar
    const event = new CustomEvent('focusLocationSearch', {
      detail: { message: 'Please search for your location' }
    });
    window.dispatchEvent(event);
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
    <div className='mx-auto mb-10 gap-10'>
      {showLocationPrompt && (
        <div className='container mx-auto mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700'>
          <div className='flex items-center gap-3'>
            <MapPin className='text-yellow-600' size={20} />
            <div>
              <h3 className='font-medium text-yellow-800 dark:text-yellow-200'>
                Location Access Required
              </h3>
              <p className='text-sm text-yellow-700 dark:text-yellow-300 mt-1'>
                Please allow location access or search for your location in the header to view analytics.
              </p>
            </div>
            <Button 
              onClick={requestLocationPermission}
              className='ml-auto'
              variant="outline"
            >
              Allow Location
            </Button>
          </div>
        </div>
      )}

      {locationPermissionDenied && (
        <div className='container mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700'>
          <div className='flex items-center gap-3'>
            <MapPin className='text-blue-600' size={20} />
            <div>
              <h3 className='font-medium text-blue-800 dark:text-blue-200'>
                Search for Location
              </h3>
              <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                Use the search bar in the header to find and select your location for analysis.
              </p>
            </div>
            <Button 
              onClick={triggerHeaderLocationSearch}
              className='ml-auto'
              variant="outline"
            >
              Search Location
            </Button>
          </div>
        </div>
      )}

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