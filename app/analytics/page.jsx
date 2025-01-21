'use client';

// AnalyticsPage.js
import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import MapContainerComponent from '@/components/maps/container'; // Import the new map container component
import TopSoilClassChart from '@/components/soil/allclasses';
import TopSoilClassComponent from '@/components/soil/dominatingclass';
import WeeklyWeather from '@/components/weather/weekly'
import DailyWeather from '@/components/weather/daily';

function AnalyticsPage() {
  const [center, setCenter] = useState({ lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(13);
  const [scannedLocation, setScannedLocation] = useState(null);

  const icon = L.icon({
    iconUrl: './locationtag.png',
    iconSize: [30, 32],
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon'));

    if (!isNaN(lat) && !isNaN(lon)) {
      setCenter({ lat, lng: lon });
      setScannedLocation({ lat, lng: lon });
      setZoom(13);
    }

    const handleSearchLocation = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const lat = parseFloat(urlParams.get('lat'));
      const lon = parseFloat(urlParams.get('lon'));

      if (!isNaN(lat) && !isNaN(lon)) {
        setScannedLocation({ lat, lng: lon });
        window.location.reload();
      }
    };

  }, []);


  return (
    <div className='mx-auto mb-10'>
      <div className='container grid  md:grid-cols-2 sm:grid-cols-1 gap-4'>
        {/* Map Section */}
        <div className='justify-center items-stretch content-center rounded-2xl bg-blue-500/20 z-0 relative'>
          <MapContainerComponent
            center={center}
            zoom={zoom}
            scannedLocation={scannedLocation}
            icon={icon}
          />
        </div>
        <DailyWeather />

      </div>
      <div className='mt-7'>


        <WeeklyWeather />
      </div>
      <div className='mt-7' >
        <TopSoilClassChart />
      </div>

    </div>
  );
}

export default AnalyticsPage;
