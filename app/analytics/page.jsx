'use client';

import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import MapContainerComponent from '@/components/maps/container';
import TopSoilClassChart from '@/components/soil/allclasses';
import TopSoilClassComponent from '@/components/soil/dominatingclass';
import WeeklyWeather from '@/components/weather/weekly';
import SoilMineralRanking from '@/components/soil/soilMineralRanking';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'react-feather';

function AnalyticsPage() {
  const [center, setCenter] = useState({ lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(13);
  const [scannedLocation, setScannedLocation] = useState(null);

  const icon = L.icon({
    iconUrl: './locationtag.png',
    iconSize: [30, 32],
  });

  const handleLocationSelect = (location) => {
    setScannedLocation(location);
    // Optional: Update URL with new coordinates
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('lat', location.lat);
    searchParams.set('lon', location.lng);
    window.history.pushState({}, '', `?${searchParams.toString()}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon'));

    if (!isNaN(lat) && !isNaN(lon)) {
      setCenter({ lat, lng: lon });
      setScannedLocation({ lat, lng: lon });
      setZoom(13);
    }
  }, []);

  return (
    <div className='mx-auto mb-10 gap-10'>
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
      <SoilMineralRanking />
      <div className='mt-7'>
        <WeeklyWeather />
      </div>
      <div className='mt-7'>
        <TopSoilClassChart />
      </div>
    </div >
  );
}

export default AnalyticsPage;
