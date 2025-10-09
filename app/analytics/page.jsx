'use client';

import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import MapContainerComponent from '@/components/maps/container';
import TopSoilClassChart from '@/components/soil/allclasses';
import WeeklyWeather from '@/components/weather/weekly';
import PopulationDetailsComponent from '@/components/Population/100msq'
import { Button } from '@/components/ui/button';
import { BarChart2, MapPin, AlertTriangle, Search } from 'react-feather';
import { saveAnalyticsCache } from '@/utils/analyticsCache';
import { useRouter } from 'next/navigation'; // Import useRouter

function AnalyticsPage() {
  const [center, setCenter] = useState({ lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(13);
  const [scannedLocation, setScannedLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [showLocationRequiredModal, setShowLocationRequiredModal] = useState(false); // New state for modal
  const [locationModalMessage, setLocationModalMessage] = useState(""); // State for modal message
  const [watchId, setWatchId] = useState(undefined); // State to store watchPosition ID
  const router = useRouter(); // Initialize useRouter

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
        setLocationModalMessage('Geolocation is not supported by your browser.');
        setShowLocationRequiredModal(true);
        throw new Error('Geolocation not supported');
      }

      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

      if (permissionStatus.state === 'denied') {
        setLocationModalMessage("Location access is denied. Please enable location services in your browser settings to use this feature.");
        setLocationPermissionDenied(true);
        setShowLocationPrompt(false);
        setShowLocationRequiredModal(true);
        triggerHeaderLocationSearch();
        return;
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
      console.warn('Location access failed:', error);
      // This catch block will primarily handle timeout or position unavailable errors
      // Permission denied is now handled by the navigator.permissions.query check
      setLocationPermissionDenied(true);
      setShowLocationPrompt(false);
      setLocationModalMessage(`Location request failed: ${error.message}. Please try again or search for a location.`);
      setShowLocationRequiredModal(true);
      triggerHeaderLocationSearch();
    }
  };

  const triggerHeaderLocationSearch = () => {
    window.dispatchEvent(new CustomEvent('openLocationSearch'));
  };

  const handleSearchOptionClick = () => {
    triggerHeaderLocationSearch();
    setShowLocationRequiredModal(false);
  };

  const handleTrackLocationClick = async () => {
    setShowLocationRequiredModal(false);
    if (!navigator.geolocation) {
      setLocationModalMessage('Geolocation is not supported by your browser.');
      setShowLocationRequiredModal(true);
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

      if (permissionStatus.state === 'denied') {
        setLocationModalMessage("Location access is denied. Please enable location services in your browser settings to use this feature.");
        setLocationPermissionDenied(true);
        setShowLocationPrompt(false);
        setShowLocationRequiredModal(true);
        triggerHeaderLocationSearch();
        return;
      }

      // Clear any existing watch
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }

      const newWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const currentLat = scannedLocation?.lat || 0;
          const currentLon = scannedLocation?.lng || 0;

          // Check if location has changed significantly (more than 0.0001 degrees)
          if (Math.abs(latitude - currentLat) > 0.0001 || Math.abs(longitude - currentLon) > 0.0001) {
            const newLocation = { lat: latitude, lng: longitude };
            handleLocationSelect(newLocation); // Update state and URL
            router.push(`?lon=${longitude}&lat=${latitude}`);
            setTimeout(() => window.location.reload(), 5000);
            // Clear the watch after successful location update
            if (watchId !== undefined) {
              navigator.geolocation.clearWatch(watchId);
              setWatchId(undefined);
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error?.message || "Unknown error");
          setLocationPermissionDenied(true);
          setShowLocationPrompt(false);
          setLocationModalMessage(`Location tracking failed: ${error.message}. Please try again or search for a location.`);
          setShowLocationRequiredModal(true);
          triggerHeaderLocationSearch();
          if (watchId !== undefined) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(undefined);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
      setWatchId(newWatchId);

    } catch (error) {
      console.warn('Location access failed:', error);
      setLocationPermissionDenied(true);
      setShowLocationPrompt(false);
      setLocationModalMessage(`Location request failed: ${error.message}. Please try again or search for a location.`);
      setShowLocationRequiredModal(true);
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
      // Initial request location permission on component mount
      // This will trigger the watchPosition logic if permission is granted
      handleTrackLocationClick();
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
      // Clear watchPosition on component unmount
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router, watchId, scannedLocation]); // Added watchId and scannedLocation to dependencies


  return (
    <div className='mt-16 p-1'>
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
            {`please Waiting for: `}
            {(!populationLoaded ? 'Population ' : '')}
            {(!weatherLoaded ? 'Weather ' : '')}
            {(!soilLoaded ? 'Soil ' : '')}
            {`Data to be collected and loaded...`}
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

      {showLocationRequiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="dark:bg-green-900 text-red p-8 rounded-lg shadow-lg text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-semibold mb-4">Location Required</h2>
            <p className="mb-6">{locationModalMessage || "Location is required to start analysis. Please search for a location or let Eden track your current location."}</p>
            <div className="flex justify-center gap-8">
              <Button onClick={handleSearchOptionClick}>Search a location <Search/></Button>
              <Button onClick={handleTrackLocationClick}>Track my location <MapPin/> </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
