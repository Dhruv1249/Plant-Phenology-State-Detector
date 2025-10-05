'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  panToPlace: (place: google.maps.places.PlaceResult) => void;
}

export const PlaceAutocomplete = ({ onPlaceSelect, panToPlace }: PlaceAutocompleteProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const places = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!places || !mapDivRef.current) return;
    autocompleteService.current = new places.AutocompleteService();
    placesService.current = new places.PlacesService(mapDivRef.current);
  }, [places]);

  useEffect(() => {
    if (!autocompleteService.current || !inputValue) {
      setSuggestions([]);
      return;
    }
    autocompleteService.current.getPlacePredictions({ input: inputValue }, (results) => {
      setSuggestions(results || []);
    });
  }, [inputValue]);

  const handleSuggestionClick = (placeId: string) => {
    if (!placesService.current) return;
    
    setInputValue('');
    setSuggestions([]);

    const request = {
      placeId,
      fields: ['name', 'geometry', 'formatted_address'],
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        // Call both functions: one for the marker, one for the camera
        onPlaceSelect(place);
        panToPlace(place);
      }
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <>
      <div style={styles.searchContainer}>
        <input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Search for a location"
          style={styles.searchInput}
          disabled={!places}
        />
        {suggestions.length > 0 && (
          <ul style={styles.suggestionList}>
            {suggestions.map(({ place_id, description }) => (
              <li
                key={place_id}
                onClick={() => handleSuggestionClick(place_id)}
                style={styles.suggestionItem}>
                {description}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={mapDivRef} style={{ display: 'none' }}></div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  searchContainer: {
    position: 'absolute',
    top: '80px',
    right: '24px',
    zIndex: 1001,
    width: '300px',
    fontFamily: 'sans-serif',
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    color: '#333',
  },
  suggestionList: {
    listStyleType: 'none',
    padding: '0',
    margin: '4px 0 0 0',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    color: '#333',
  },
  suggestionItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
  },
};