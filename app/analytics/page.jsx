'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap,  } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ResponsiveStyles.css';  // Import the CSS file

// Custom component for resetting the map's center view
function ResetCenterView({ selectPosition }) {
  const map = useMap();

  useEffect(() => {
    if (selectPosition) {
      map.setView(
        L.latLng(selectPosition.lat, selectPosition.lng),
        map.getZoom(),
        { animate: true }
      );
    }
  }, [selectPosition, map]);

  return null;
}

function AnalyticsPage() {
  const [center, setCenter] = useState({ lat: 51.9, lng: -0.09 });
  const [zoom, setZoom] = useState(13);
  const [scannedLocation, setScannedLocation] = useState(null);

  const icon = L.icon({
    iconUrl: './locationtag.png',
    iconSize: [32, 32],
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
  }, []);

  const handleSearchLocation = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon'));

    if (!isNaN(lat) && !isNaN(lon)) {
      setScannedLocation({ lat, lng: lon });
      window.location.reload();
    }
  };

  return (
    <div className="responsive-container rounded-lg">
      {/* Map Section */}
      <div
        style={{
          flex: 3,
          zIndex: 0,
          height: '100%',
          width: '100%',
          
        }}
      >
        <MapContainer center={center} zoom={20} scrollWheelZoom={true} style={{ height: '75%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          />
          {scannedLocation && (
            <Marker position={scannedLocation} icon={icon}>
              <Popup>Scanned Location</Popup>
            </Marker>
          )}
          <ResetCenterView selectPosition={scannedLocation} />
        </MapContainer>
      </div>
    </div>
  );
}
export default AnalyticsPage;
