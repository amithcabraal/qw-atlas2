import React from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface MapComponentProps {
  onMapClick?: (e: { lngLat: [number, number] }) => void;
  markers?: Array<{ longitude: number; latitude: number }>;
  answer?: { longitude: number; latitude: number };
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3RhY2tibGl0eiIsImEiOiJjbHRpYnF3Y2UwMGRqMmtvNng4bDhiM3k0In0.x2qWypGm8M6bZKfYEXzUxg';

export default function MapComponent({ onMapClick, markers = [], answer }: MapComponentProps) {
  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 1
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={onMapClick ? (e) => onMapClick(e) : undefined}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          longitude={marker.longitude}
          latitude={marker.latitude}
          anchor="bottom"
        >
          <MapPin className="w-6 h-6 text-blue-500" />
        </Marker>
      ))}
      {answer && (
        <Marker
          longitude={answer.longitude}
          latitude={answer.latitude}
          anchor="bottom"
        >
          <MapPin className="w-6 h-6 text-green-500" />
        </Marker>
      )}
    </Map>
  );
}