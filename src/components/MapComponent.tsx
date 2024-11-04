import React from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface MapComponentProps {
  onMapClick?: (e: { lngLat: [number, number] }) => void;
  markers?: Array<{ longitude: number; latitude: number; color?: string }>;
  interactive?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapComponent({ 
  onMapClick, 
  markers = [], 
  interactive = true 
}: MapComponentProps) {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not found');
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl">
        <p className="text-red-400">Map configuration error</p>
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 0,
        latitude: 20,
        zoom: 1.5
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      onClick={onMapClick ? (e) => onMapClick(e) : undefined}
      interactive={interactive}
      attributionControl={false}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          longitude={marker.longitude}
          latitude={marker.latitude}
          anchor="bottom"
        >
          <MapPin 
            className={`w-6 h-6 ${marker.color || 'text-blue-500'}`}
            style={{ transform: 'translate(-50%, -100%)' }}
          />
        </Marker>
      ))}
    </Map>
  );
}
