// MapContainerComponent.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom component for resetting the map's center view
function ResetCenterView({ selectPosition }) {
    const map = useMap();

    React.useEffect(() => {
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

const MapContainerComponent = ({ center, zoom, scannedLocation, icon }) => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '75vh' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
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
    );
};

export default MapContainerComponent;
