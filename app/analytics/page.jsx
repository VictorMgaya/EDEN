'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { BarChart2, AlertTriangle, Search, Navigation, Database } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { saveAnalyticsCache } from '@/utils/dataCache/analyticsCache';

// Dynamic imports to prevent SSR issues
const MapContainerComponent = dynamic(() => import('@/components/maps/container'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center">Loading map...</div>
});
const TopSoilClassChart = dynamic(() => import('@/components/soil/allclasses'), { ssr: false });
const SoilPropertiesChart = dynamic(() => import('@/components/soil/properties'), { ssr: false });
const WeeklyWeather = dynamic(() => import('@/components/weather/weekly'), { ssr: false });
const PopulationDetailsComponent = dynamic(() => import('@/components/Population/100msq'), { ssr: false });
const LocationDetails = dynamic(() => import('@/components/LocationDetails.jsx'), { ssr: false });
const AnalyticsCachePreview = dynamic(() => import('@/components/AnalyticsCachePreview'), { ssr: false });

function AnalyticsPage() {
  const [center, setCenter] = useState({ lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(13);
  const [scannedLocation, setScannedLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [showLocationRequiredModal, setShowLocationRequiredModal] = useState(false);
  const [locationModalMessage, setLocationModalMessage] = useState("");
  const [watchId, setWatchId] = useState(undefined);
  const router = useRouter();
  const { data: session, status } = useSession();

  const icon = useMemo(() => {
    const L = require('leaflet');
    return L.icon({
      iconUrl: './locationtag.png',
      iconSize: [25, 40],
    });
  }, []);

  // Track loading state of each component
  const [locationDetailsLoaded, setLocationDetailsLoaded] = useState(false);
  const [populationLoaded, setPopulationLoaded] = useState(false);
  const [weatherLoaded, setWeatherLoaded] = useState(false);
  const [soilLoaded, setSoilLoaded] = useState(false);
  const [soilPropertiesLoaded, setSoilPropertiesLoaded] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  // Callback props for child components to signal when loaded
  const handleLocationDetailsLoaded = () => setLocationDetailsLoaded(true);
  const handlePopulationLoaded = () => setPopulationLoaded(true);
  const handleWeatherLoaded = () => setWeatherLoaded(true);
  const handleSoilLoaded = () => setSoilLoaded(true);
  const handleSoilPropertiesLoaded = () => setSoilPropertiesLoaded(true);

  const [cacheSaved, setCacheSaved] = useState(false);

  // Cache only when all analysis components are fully rendered
  useEffect(() => {
    if (!cacheSaved && locationDetailsLoaded && populationLoaded && weatherLoaded && soilLoaded && soilPropertiesLoaded) {
      // Use setTimeout to prevent blocking the UI
      const timer = setTimeout(() => {
        try {
          console.log('🔄 Starting analytics cache save...');
          
          // Instead of capturing HTML, just save the data
          const success = saveAnalyticsCache({
            scannedLocation,
            zoom,
            timestamp: new Date().toISOString(),
          });
          
          console.log('💾 Cache saved:', success);
          if (success) {
            setCacheSaved(true);
            console.log('✅ Analytics cache completed');
          } else {
            console.error('❌ Failed to save analytics cache');
          }
        } catch (error) {
          console.error('❌ Cache error:', error);
        }
      }, 500); // Reduced delay
      
      return () => clearTimeout(timer);
    }
  }, [locationDetailsLoaded, populationLoaded, weatherLoaded, soilLoaded, soilPropertiesLoaded, cacheSaved, scannedLocation, zoom]);

  const handleLocationSelect = (location) => {
    setScannedLocation(location);
    setShowLocationPrompt(false);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('lat', location.lat);
    searchParams.set('lon', location.lng);
    window.history.pushState({}, '', `?${searchParams.toString()}`);
  };

  const requestLocationPermission = async () => {
    if (isCheckingLocation) return;
    setIsCheckingLocation(true);
    try {
      if (!navigator.geolocation) {
        setLocationModalMessage('Geolocation is not supported by your browser.');
        setShowLocationRequiredModal(true);
        setIsCheckingLocation(false);
        throw new Error('Geolocation not supported');
      }

      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

      if (permissionStatus.state === 'denied') {
        setLocationModalMessage("Location access is denied. Please enable location services in your browser settings to use this feature.");
        setLocationPermissionDenied(true);
        setShowLocationPrompt(false);
        setShowLocationRequiredModal(true);
        triggerHeaderLocationSearch();
        setIsCheckingLocation(false);
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
      setLocationPermissionDenied(true);
      setShowLocationPrompt(false);
      setLocationModalMessage(`Location request failed: ${error.message}. Please try again or search for a location.`);
      setShowLocationRequiredModal(true);
      triggerHeaderLocationSearch();
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const triggerHeaderLocationSearch = () => {
    window.dispatchEvent(new CustomEvent('openLocationSearch'));
  };

  const handleSearchOptionClick = () => {
    triggerHeaderLocationSearch();
    setShowLocationRequiredModal(false);
  };

  const handleTrackLocationClick = async (checkPermissionOnly = false) => {
    if (isCheckingLocation) return;
    setIsCheckingLocation(true);
    setShowLocationRequiredModal(false);
    if (!navigator.geolocation) {
      setLocationModalMessage('Geolocation is not supported by your browser.');
      setShowLocationRequiredModal(true);
      setIsCheckingLocation(false);
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
        setIsCheckingLocation(false);
        return;
      }

      if (checkPermissionOnly) {
        const messages = {
          granted: "Location permission is granted. You can use location tracking features.",
          prompt: "Location permission is set to prompt. You will be asked for permission when tracking location.",
          denied: "Location permission is denied. Please enable it in your browser settings."
        };
        setLocationModalMessage(messages[permissionStatus.state] || 'Unknown permission status.');
        setShowLocationRequiredModal(true);
        setIsCheckingLocation(false);
        return;
      }

      if (permissionStatus.state === 'granted') {
        if (watchId !== undefined) {
          navigator.geolocation.clearWatch(watchId);
        }

        const newWatchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const currentLat = scannedLocation?.lat || 0;
            const currentLon = scannedLocation?.lng || 0;

            if (Math.abs(latitude - currentLat) > 0.0001 || Math.abs(longitude - currentLon) > 0.0001) {
              const newLocation = { lat: latitude, lng: longitude };
              handleLocationSelect(newLocation);
              router.push(`?lon=${longitude}&lat=${latitude}`);
              if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(undefined);
              }
            }
            setIsCheckingLocation(false);
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
            setIsCheckingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
        setWatchId(newWatchId);
      } else {
        setLocationModalMessage("Location permission is not granted.");
        setShowLocationRequiredModal(true);
        setIsCheckingLocation(false);
      }
    } catch (error) {
      console.warn('Location access failed:', error);
      setLocationPermissionDenied(true);
      setShowLocationPrompt(false);
      setLocationModalMessage(`Location request failed: ${error.message}. Please try again or search for a location.`);
      setShowLocationRequiredModal(true);
      triggerHeaderLocationSearch();
      setIsCheckingLocation(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
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
    } else {
      setShowLocationRequiredModal(true);
    }

    const handleLocationUpdate = (event) => {
      if (event.detail && event.detail.location) {
        handleLocationSelect(event.detail.location);
      }
    };

    window.addEventListener('locationSelected', handleLocationUpdate);

    return () => {
      window.removeEventListener('locationSelected', handleLocationUpdate);
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router, watchId, scannedLocation, status, isCheckingLocation]);

  const handleViewAnalyticsData = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lon = urlParams.get('lon');
    router.push(`/analytics/data?lat=${lat}&lon=${lon}`);
  };

  return (
    <div className='mt-16 p-1 pb-20 md:pb-1'>
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
          <LocationDetails scannedLocation={scannedLocation} onLoaded={handleLocationDetailsLoaded} />
          <div className='mt-7'>
            <PopulationDetailsComponent onLoaded={handlePopulationLoaded} />
          </div>
          <div className='mt-7'>
            <WeeklyWeather onLoaded={handleWeatherLoaded} />
          </div>
          <div className='mt-7'>
            <TopSoilClassChart onLoaded={handleSoilLoaded} />
          </div>
          <div className='mt-7'>
            <SoilPropertiesChart onLoaded={handleSoilPropertiesLoaded} />
          </div>
        </>
      )}
      {!cacheSaved && (
        (!locationDetailsLoaded || !populationLoaded || !weatherLoaded || !soilLoaded || !soilPropertiesLoaded) ? (
          <div className='mt-8 text-center text-yellow-700 font-semibold'>
            {`Please wait, collecting: `}
            {(!locationDetailsLoaded ? 'Location Details ' : '')}
            {(!populationLoaded ? 'Population ' : '')}
            {(!weatherLoaded ? 'Weather ' : '')}
            {(!soilLoaded ? 'Soil Classification ' : '')}
            {(!soilPropertiesLoaded ? 'Soil Properties ' : '')}
          </div>
        ) : null
      )}

      {cacheSaved && (
        <div className='mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center'>
          <Button onClick={handleViewAnalyticsData} className="w-full sm:w-auto">
            <Database className="w-4 h-4 mr-2" />
            View Analytics Data
          </Button>
          <Button onClick={() => window.location.href = '/Experts'} className="w-full sm:w-auto">
            Get Expert Advice
          </Button>
        </div>
      )}

      {showLocationRequiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Location Required
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                {locationModalMessage || "Location is required to start analysis. Please search for a location or let Eden track your current location."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleSearchOptionClick} className="flex items-center justify-center">
                  <Search className="w-4 h-4 mr-2" />
                  Search Location
                </Button>
                <Button
                  onClick={() => {
                    setShowLocationRequiredModal(false);
                    requestLocationPermission();
                  }}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;