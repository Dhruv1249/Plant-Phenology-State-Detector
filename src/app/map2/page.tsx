'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

  // State for the marker location
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  
  // State to hold the map instance itself
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // A stable callback function to pan the map
  const panToPlace = useCallback((place: google.maps.places.PlaceResult) => {
    if (!mapInstance) return;

    const location = place.geometry?.location;
    if (location && typeof location.lat === 'function' && typeof location.lng === 'function') {
      mapInstance.panTo(location);
      mapInstance.setZoom(15);
    }
  }, [mapInstance]); // This function is stable as long as mapInstance is the same

  // Effect to fetch initial configuration
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
          defaultZoom={10}
          defaultCenter={{ lat: 28.6139, lng: 77.2090 }} // Initial center (New Delhi)
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

          {/* This component's only job is to get the map instance and lift it up */}
          <MapHandler onMapLoad={setMapInstance} />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}

// Helper component to get the map instance from the context and pass it to the parent
function MapHandler({ onMapLoad }: { onMapLoad: (map: google.maps.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  return null;
}