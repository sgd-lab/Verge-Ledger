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

const DEFAULT_CENTER: [number, number] = [52.5, -1.5];

export const VergeMap: React.FC<VergeMapProps> = ({
  center = DEFAULT_CENTER,
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
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const onMapMouseMoveRef = useRef(onMapMouseMove);
  onMapMouseMoveRef.current = onMapMouseMove;

  const onMapDoubleClickRef = useRef(onMapDoubleClick);
  onMapDoubleClickRef.current = onMapDoubleClick;

  // Create the map exactly once. Previously this effect re-ran whenever the
  // parent passed a new center array / zoom, destroying the map, dropping
  // all tiles and layers, and re-downloading everything — the main cause of
  // the map feeling laggy and flickering on every render.
  useEffect(() => {
    initLeafletIcons();
    if (!containerRef.current || mapRef.current) return;

    const mapInstance = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
      // Canvas rendering keeps many polylines cheap; the default SVG
      // renderer creates a DOM node per segment and slows panning.
      preferCanvas: true,
    });

    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      )
      .addTo(mapInstance);

    // Tile layer with a one-time fallback. The fallback layer gets the same
    // error handling, and the counter resets on any successful load, so a
    // few stray tile errors do not permanently switch the source.
    let fellBack = false;
    const makeTiles = (url: string): L.TileLayer => {
      const layer = L.tileLayer(url, { maxZoom: 19, minZoom: 6, subdomains: ['a', 'b', 'c'] });
      let consecutiveErrors = 0;
      layer.on('tileerror', () => {
        consecutiveErrors++;
        if (consecutiveErrors >= 5 && !fellBack) {
          fellBack = true;
          mapInstance.removeLayer(layer);
          makeTiles(fallbackTileUrl).addTo(mapInstance);
        }
      });
      layer.on('tileload', () => {
        consecutiveErrors = 0;
      });
      return layer;
    };
    makeTiles(tileUrl).addTo(mapInstance);

    mapInstance.on('click', (e) => onMapClickRef.current?.(e.latlng));
    mapInstance.on('mousemove', (e) => onMapMouseMoveRef.current?.(e.latlng));
    mapInstance.on('dblclick', (e) => onMapDoubleClickRef.current?.(e.latlng));

    mapRef.current = mapInstance;
    setMap(mapInstance);

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
    // Intentionally once-only: view changes are handled below, and tile
    // URLs are fixed for the life of the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the existing map instead of recreating it when the view changes.
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) return;
    const current = mapInstance.getCenter();
    const currentZoom = mapInstance.getZoom();
    if (
      Math.abs(current.lat - center[0]) > 0.000001 ||
      Math.abs(current.lng - center[1]) > 0.000001 ||
      currentZoom !== zoom
    ) {
      mapInstance.setView(center, zoom);
    }
  }, [center, zoom]);

  // Resize handling: only invalidate when the container size actually
  // changed, throttled to one animation frame. The old code called
  // invalidateSize() on every ResizeObserver notification, and Leaflet's
  // own layout work can trigger the observer again — a feedback loop that
  // made the map stutter while the page was resizing or scrolling.
  useEffect(() => {
    const mapInstance = mapRef.current;
    const container = containerRef.current;
    if (!mapInstance || !container || typeof ResizeObserver === 'undefined') return;
    let lastWidth = container.clientWidth;
    let lastHeight = container.clientHeight;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w !== lastWidth || h !== lastHeight) {
          lastWidth = w;
          lastHeight = h;
          mapInstance.invalidateSize();
        }
      });
    });
    observer.observe(container);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map]);

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
