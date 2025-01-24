// MapContainerComponent.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Location selector component
function LocationSelector({ onLocationSelect }) {
    useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            onLocationSelect({ lat, lng });
        },
    });
    return null;
}

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

const MapContainerComponent = ({ center, zoom, scannedLocation, icon, onLocationSelect }) => {
    return (
        <div style={{ position: 'center', width: '100%', height: '75vh' }}>
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
                <LocationSelector onLocationSelect={onLocationSelect} />
                {scannedLocation && (
                    <Marker position={scannedLocation} icon={icon}>
                        <Popup>Selected Location</Popup>
                    </Marker>
                )}
                <ResetCenterView selectPosition={scannedLocation} />
            </MapContainer>
        </div>
    );
};

export default MapContainerComponent;
