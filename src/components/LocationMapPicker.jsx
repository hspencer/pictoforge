import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

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

  // Buscar direcciones con debounce
  const searchAddress = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      // Nominatim requiere un User-Agent y recomienda email
      // También agregamos addressdetails para obtener más información
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(query)}` +
        `&limit=5` +
        `&addressdetails=1` +
        `&accept-language=es`, // Preferir nombres en español
        {
          headers: {
            'User-Agent': 'PictoForge/0.0.1 (https://github.com/mediafranca/pictoforge)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('🔍 Búsqueda de dirección:', {
        query,
        results: data.length,
        data: data.slice(0, 2) // Log primeros 2 resultados
      });

      setSearchResults(data);
      setShowSuggestions(data.length > 0);

      if (data.length === 0) {
        console.warn('⚠️ No se encontraron resultados para:', query);
      }
    } catch (error) {
      console.error('❌ Error buscando dirección:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Manejar cambio en el input de búsqueda con debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Crear nuevo timeout
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(query);
    }, 500); // 500ms de debounce
  };

  // Seleccionar un resultado de búsqueda
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    handleLocationChange({
      address: result.display_name,
      coordinates: { lat, lng }
    });

    setSearchQuery(result.display_name);
    setShowSuggestions(false);
    setSearchResults([]);

    // Centrar el mapa
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      {/* Campo de búsqueda */}
      <div className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar ciudad o dirección..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            ) : (
              <Search size={16} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Sugerencias de búsqueda */}
        {showSuggestions && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors border-b last:border-b-0"
              >
                <div className="font-medium truncate">{result.display_name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  {result.type && <span className="capitalize">{result.type}</span>}
                  {result.type && <span>•</span>}
                  <span className="font-mono">{parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
          <div className="text-sm text-muted-foreground mt-1 px-2">
            No se encontraron resultados para "{searchQuery}"
          </div>
        )}
      </div>

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
