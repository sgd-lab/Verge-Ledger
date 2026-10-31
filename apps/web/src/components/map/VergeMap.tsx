import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { initLeafletIcons } from './leaflet-icons';
import { MapContext } from './MapContext';

export interface VergeMapProps {
  center?: [number, number]; // [lat, lng], defaults to [52.5, -1.5] (England)
  zoom?: number;
  tileUrl?: string;
  fallbackTileUrl?: string;
  className?: string;
  onMapClick?: (latlng: L.LatLng) => void;
  onMapMouseMove?: (latlng: L.LatLng) => void;
  onMapDoubleClick?: (latlng: L.LatLng) => void;
  children?: React.ReactNode;
}

export const VergeMap: React.FC<VergeMapProps> = ({
  center = [52.5, -1.5],
  zoom = 7,
  tileUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TILE_URL) ||
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  fallbackTileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  className = 'w-full h-[450px]',
  onMapClick,
  onMapMouseMove,
  onMapDoubleClick,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const onMapMouseMoveRef = useRef(onMapMouseMove);
  onMapMouseMoveRef.current = onMapMouseMove;

  const onMapDoubleClickRef = useRef(onMapDoubleClick);
  onMapDoubleClickRef.current = onMapDoubleClick;

  useEffect(() => {
    initLeafletIcons();
    if (!containerRef.current) return;

    const mapInstance = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false, // Customized below to ensure visibility
    });

    // Mandatory OSM Attribution Control (MAP-3)
    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      )
      .addTo(mapInstance);

    // Primary Tile Layer with CartoDB Fallback
    let tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      minZoom: 6,
      subdomains: ['a', 'b', 'c'],
    }).addTo(mapInstance);

    let consecutiveErrors = 0;
    tileLayer.on('tileerror', () => {
      consecutiveErrors++;
      if (consecutiveErrors >= 5) {
        mapInstance.removeLayer(tileLayer);
        tileLayer = L.tileLayer(fallbackTileUrl, {
          maxZoom: 19,
          minZoom: 6,
          subdomains: ['a', 'b', 'c'],
        }).addTo(mapInstance);
      }
    });
    tileLayer.on('tileload', () => {
      consecutiveErrors = 0;
    });

    // Map Events
    mapInstance.on('click', (e) => onMapClickRef.current?.(e.latlng));
    mapInstance.on('mousemove', (e) => onMapMouseMoveRef.current?.(e.latlng));
    mapInstance.on('dblclick', (e) => onMapDoubleClickRef.current?.(e.latlng));

    // Resize Observer for dynamic layout changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapInstance.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    setMap(mapInstance);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      mapInstance.remove();
    };
  }, [center, fallbackTileUrl, tileUrl, zoom]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg overflow-hidden border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${className}`}
      role="region"
      aria-label="Verge interactive survey map"
      tabIndex={0}
    >
      <MapContext.Provider value={map}>{map && children}</MapContext.Provider>
    </div>
  );
};
