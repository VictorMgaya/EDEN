'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Navigation, Loader2 } from 'lucide-react';

const LocationDetails = ({ scannedLocation, onLoaded }) => {
  const [locationDetails, setLocationDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    const currentLatLng = scannedLocation?.lat && scannedLocation?.lng
      ? `${scannedLocation.lat},${scannedLocation.lng}`
      : null;

    if (currentLatLng && currentLatLng !== lastFetched) {
      fetchLocationDetails(scannedLocation.lat, scannedLocation.lng, currentLatLng);
    }
  }, [scannedLocation, lastFetched]);

  const fetchLocationDetails = async (lat, lon, currentLatLngKey) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the server-side proxy
      const response = await fetch(`/api/location?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const address = data.address || {};

      const locationInfo = {
        place_name: address.road || address.neighbourhood || address.suburb || "Unknown place",
        city: address.city || address.town || address.village || "Unknown city",
        region: address.state || address.county || "Unknown region",
        country: address.country || "Unknown country",
        country_code: (address.country_code || "").toUpperCase(),
        display_name: data.display_name || "No description available",
        latitude: lat,
        longitude: lon
      };

      setLocationDetails(locationInfo);
      setLastFetched(currentLatLngKey);
      if (onLoaded) onLoaded();
    } catch (err) {
      console.error("Error fetching location details:", err);
      setError(err.message);
      if (onLoaded) onLoaded();
    } finally {
      setIsLoading(false);
    }
  };

  if (!scannedLocation) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700 mb-6">
      <div className="flex items-center mb-4">
        <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Location Details
        </h2>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Retrieving location information...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <p>Unable to retrieve location details: {error}</p>
        </div>
      )}

      {locationDetails && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Coordinates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-2">
                <Navigation className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Coordinates</span>
              </div>
              <div className="text-sm">
                <p className="font-mono text-xs">Lat: {locationDetails.latitude.toFixed(6)}</p>
                <p className="font-mono text-xs">Lon: {locationDetails.longitude.toFixed(6)}</p>
              </div>
            </div>

            {/* Place Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-2">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Place Details</span>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Place:</span> {locationDetails.place_name}</p>
                <p><span className="font-medium">City:</span> {locationDetails.city}</p>
                <p><span className="font-medium">Region:</span> {locationDetails.region}</p>
              </div>
            </div>

            {/* Country */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-2">
                <Globe className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Country</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">{locationDetails.country}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{locationDetails.country_code}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Full Address</h3>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {locationDetails.display_name}
            </p>
          </div>
        </>
      )}

      {!isLoading && !error && !locationDetails && scannedLocation && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Location information not available</p>
        </div>
      )}
    </div>
  );
};

export default LocationDetails;
