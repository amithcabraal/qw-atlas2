import React from 'react';
import Map, { Marker, MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface MapComponentProps {
  onMapClick?: (e: MapLayerMouseEvent) => void;
  markers?: Array<{ longitude: number; latitude: number; color?: string }>;
  interactive?: boolean;
  showLabels?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapComponent({ 
  onMapClick, 
  markers = [], 
  interactive = true,
  showLabels = false
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
    <div className="relative w-full h-full">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={showLabels ? 
          "mapbox://styles/mapbox/dark-v11" : 
          "mapbox://styles/mapbox/satellite-v9"
        }
        onClick={onMapClick}
        interactive={interactive}
        attributionControl={false}
        cursor={onMapClick ? 'crosshair' : 'grab'}
        renderWorldCopies={true}
        maxBounds={[[-180, -85], [180, 85]]}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
          >
            <MapPin 
              className={`w-6 h-6 ${marker.color || 'text-blue-500'} drop-shadow-lg transition-transform hover:scale-110`}
            />
          </Marker>
        ))}
      </Map>
      {onMapClick && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm">
          Click anywhere on the map to place your marker
        </div>
      )}
    </div>
  );
}
