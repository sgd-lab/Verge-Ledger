import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapInstance } from './MapContext';
import { Locate } from 'lucide-react';

export interface GpsMarkerProps {
  position: [number, number] | null; // [lat, lng]
  accuracy: number | null; // metres
}

export const GpsMarker: React.FC<GpsMarkerProps> = ({ position, accuracy }) => {
  const map = useMapInstance();
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Update the marker in place. The old version removed and recreated the
  // marker and circle in the effect cleanup on every position/accuracy
  // update, so a moving GPS fix flickered and re-added layers constantly.
  useEffect(() => {
    if (!map) return;
    if (!position) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      return;
    }

    const [lat, lng] = position;

    const pulseIcon = L.divIcon({
      className: 'gps-pulse-marker',
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <span class="absolute inline-flex w-full h-full rounded-full bg-sky-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow-md"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(pulseIcon);
    }

    if (accuracy) {
      if (!circleRef.current) {
        circleRef.current = L.circle([lat, lng], {
          radius: accuracy,
          color: '#38BDF8',
          fillColor: '#BAE6FD',
          fillOpacity: 0.2,
          weight: 1,
          dashArray: '4, 4',
          interactive: false,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(accuracy);
      }
    }
    // No per-update cleanup: layers are only removed when the position
    // becomes null, or when the map unmounts (Leaflet removes its layers).
  }, [map, position, accuracy]);

  const handleCenter = () => {
    if (map && position) {
      map.flyTo(position, 17, { duration: 0.8 });
    }
  };

  if (!position) return null;

  return (
    <button
      type="button"
      onClick={handleCenter}
      className="absolute bottom-6 left-3 z-[1000] min-h-[44px] min-w-[44px] bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-md border border-slate-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label="Center map on your current location"
      title="Center on my location"
    >
      <Locate className="w-5 h-5 text-sky-600" aria-hidden="true" />
    </button>
  );
};
