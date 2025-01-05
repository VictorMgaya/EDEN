'use client';

import React, { useState, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const DraggableMarker = () => {
  const [draggable, setDraggable] = useState(false);
  const [position, setPosition] = useState({ lat: 51.505, lng: -0.09 });
  const markerRef = useRef(null);

  const toggleDraggable = () => {
    setDraggable((d) => !d);
  };

  const updatePosition = () => {
    const marker = markerRef.current;
    if (marker != null) {
      setPosition(marker.getLatLng());
    }
  };

  return (
    <Marker
      draggable={draggable}
      eventHandlers={{
        dragend: updatePosition,
      }}
      position={position}
      ref={markerRef}
    >
      <Popup minWidth={90}>
        <span onClick={toggleDraggable}>
          {draggable ? 'Marker is draggable' : 'Click here to make marker draggable'}
        </span>
      </Popup>
    </Marker>
  );
};

export default DraggableMarker;
