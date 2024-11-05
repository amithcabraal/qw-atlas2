import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import Map, { Marker, MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface MapComponentProps {
  onMapClick?: (e: MapLayerMouseEvent) => void;
  markers?: Array<{ 
    longitude: number; 
    latitude: number; 
    color?: string;
    fill?: boolean;
    label?: string;
  }>;
  interactive?: boolean;
  showLabels?: boolean;
  showMarkerLabels?: boolean;
  key?: string; // Add key prop for forced remount
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
  bearing: 0,
  pitch: 0
};

const MapComponent = forwardRef<any, MapComponentProps>(({ 
  onMapClick, 
  markers = [], 
  interactive = true,
  showLabels = false,
  showMarkerLabels = false
}, ref) => {
  const mapRef = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (options: any) => {
      if (mapRef.current) {
        mapRef.current.flyTo(options);
      }
    },
    resetView: () => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          ...DEFAULT_VIEW_STATE,
          duration: 0
        });
      }
    }
  }));

  useEffect(() => {
    // Reset map when markers change
    if (mapRef.current && markers.length === 0) {
      mapRef.current.flyTo({
        ...DEFAULT_VIEW_STATE,
        duration: 0
      });
    }
  }, [markers]);

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
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={DEFAULT_VIEW_STATE}
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
        reuseMaps={false}
      >
        {markers.map((marker, index) => (
          <Marker
            key={`${marker.latitude}-${marker.longitude}-${index}`}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
          >
            <div className="relative group">
              <div className={`
                w-6 h-6 
                ${marker.fill ? 'bg-current' : ''} 
                ${marker.color || 'text-blue-500'} 
                rounded-full 
                shadow-lg 
                transition-transform 
                hover:scale-110
                border-2
                border-current
                flex
                items-center
                justify-center
              `}>
                <MapPin 
                  className={`w-4 h-4 ${marker.fill ? 'text-white' : 'text-current'}`}
                />
              </div>
              {marker.label && (
                <>
                  {showMarkerLabels && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                                  whitespace-nowrap bg-black/75 text-white px-2 py-1 
                                  text-xs rounded-full">
                      {marker.label}
                    </div>
                  )}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                                pointer-events-none opacity-0 group-hover:opacity-100 
                                transition-opacity duration-200 whitespace-nowrap 
                                bg-black/90 text-white px-3 py-1.5 text-sm rounded-lg
                                shadow-lg z-50">
                    {marker.label}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 
                                  border-4 border-transparent border-b-black/90"></div>
                  </div>
                </>
              )}
            </div>
          </Marker>
        ))}
      </Map>
      {onMapClick && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                      bg-black/75 text-white px-4 py-2 rounded-full text-sm">
          Click anywhere on the map to place your marker
        </div>
      )}
    </div>
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
