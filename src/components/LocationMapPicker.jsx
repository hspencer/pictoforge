import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix para los iconos de Leaflet en Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/**
 * LocationMapPicker - Selector de ubicación con mapa OpenStreetMap
 *
 * Permite al usuario:
 * - Ver un mapa interactivo
 * - Hacer click para colocar/mover el pin
 * - Obtener coordenadas y dirección (reverse geocoding)
 */

// Componente para manejar clicks en el mapa
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Reverse geocoding usando Nominatim (OSM)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();

        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        onLocationChange({
          address,
          coordinates: { lat, lng }
        });
      } catch (error) {
        console.error('Error en reverse geocoding:', error);
        onLocationChange({
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          coordinates: { lat, lng }
        });
      }
    },
  });

  return null;
}

export function LocationMapPicker({ location, onLocationChange }) {
  // Auckland, NZ por defecto
  const defaultCoords = { lat: -36.8485, lng: 174.7633 };

  const [position, setPosition] = useState(
    location?.coordinates || defaultCoords
  );

  const mapRef = useRef(null);

  // Actualizar posición cuando cambia la ubicación desde fuera
  useEffect(() => {
    if (location?.coordinates) {
      setPosition(location.coordinates);

      // Centrar el mapa en la nueva posición
      if (mapRef.current) {
        mapRef.current.setView([location.coordinates.lat, location.coordinates.lng], 13);
      }
    }
  }, [location?.coordinates]);

  const handleLocationChange = (newLocation) => {
    setPosition(newLocation.coordinates);
    onLocationChange(newLocation);
  };

  return (
    <div className="space-y-2">
      <div
        className="border rounded-lg overflow-hidden"
        style={{ height: '300px', width: '100%' }}
      >
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[position.lat, position.lng]} />

          <MapClickHandler onLocationChange={handleLocationChange} />
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        {location?.address || 'Click on the map to set a location'}
      </p>

      {location?.coordinates && (
        <p className="text-xs text-muted-foreground font-mono">
          {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}

export default LocationMapPicker;
