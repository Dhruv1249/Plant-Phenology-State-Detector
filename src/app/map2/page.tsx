'use client';

// Make sure useCallback is imported
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  useMap 
} from '@vis.gl/react-google-maps';
import NavBar from '@/components/NavBar';
import RouteLoading from './loading';
import DrawingTools from '@/components/map/DrawingTools';
import { PlaceAutocomplete } from '@/components/map/PlaceAutocomplete';

type AppConfig = {
  googleMapsApiKey: string;
  apiUrl: string;
  mapId: string;
};

export default function Map2Page(): React.ReactElement {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);

  // --- FIX: Wrap onMapLoad in useCallback to create a stable function ---
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []); // The empty dependency array [] ensures this function is created only once.

  const panToPlace = useCallback((place: google.maps.places.PlaceResult) => {
    const map = mapRef.current;
    if (!map) return;

    const location = place.geometry?.location;
    if (location && typeof location.lat === 'function' && typeof location.lng === 'function') {
      map.panTo(location);
      setTimeout(() => {
        map.setZoom(15);
      }, 100);
    }
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to fetch configuration');
        const data: AppConfig = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  if (loading) return <RouteLoading />;
  if (error || !config) return <div>Error: {error || 'Config not available'}</div>;
  if (!config.googleMapsApiKey) return <div>Error: Google Maps API Key is missing.</div>;
  
  return (
    <APIProvider apiKey={config.googleMapsApiKey} libraries={['drawing', 'geometry', 'marker', 'places']}>
      <div style={{ height: "100dvh", width: "100%", position: "relative" }}>
        <NavBar />

        <PlaceAutocomplete 
          onPlaceSelect={setSelectedPlace} 
          panToPlace={panToPlace} 
        />
        
        <GoogleMap
          defaultZoom={7}
          defaultCenter={{ lat: 36.77, lng: -119.4 }}
          gestureHandling="greedy"
          mapId={config.mapId}
          colorScheme={darkMode ? "DARK": "LIGHT"}
          restriction={{ latLngBounds: { north: 85, south: -85, west: -179, east: 179 }, strictBounds: true }}
        >
          <DrawingTools 
            darkMode={darkMode} 
            onToggleDarkMode={toggleDarkMode}
            apiUrl={config.apiUrl}
          />
          
          {selectedPlace && <AdvancedMarker position={selectedPlace.geometry?.location} />}

          <MapHandler onMapLoad={onMapLoad} />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}

function MapHandler({ onMapLoad }: { onMapLoad: (map: google.maps.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  return null;
}