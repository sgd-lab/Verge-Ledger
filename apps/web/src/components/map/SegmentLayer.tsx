import type React from 'react';
import { useEffect } from 'react';
import L from 'leaflet';
import { useMapInstance } from './MapContext';
import { getSegmentStyle } from './map-styles';
import type { VergeSegment, Position } from '@verge-ledger/core';

export interface SegmentLayerProps {
  segments: VergeSegment[];
  selectedSegmentId?: string | null;
  inProgressCoordinates?: Position[];
  onSelectSegment?: (segment: VergeSegment) => void;
}

export const SegmentLayer: React.FC<SegmentLayerProps> = ({
  segments,
  selectedSegmentId,
  inProgressCoordinates = [],
  onSelectSegment,
}) => {
  const map = useMapInstance();

  useEffect(() => {
    if (!map) return;
    const layerGroup = L.layerGroup().addTo(map);

    // 1. Render Saved Segments
    segments.forEach((segment) => {
      const latlngs: [number, number][] = segment.geometry.coordinates.map(([lon, lat]) => [
        lat,
        lon,
      ]);

      // Contrast Underlay
      const halo = L.polyline(latlngs, {
        color: '#FFFFFF',
        weight: 7,
        opacity: 0.85,
        lineCap: 'round',
        interactive: false,
      });
      layerGroup.addLayer(halo);

      // Top Dual-Encoded Line
      const style = getSegmentStyle(segment.isDemo, null);
      const polyline = L.polyline(latlngs, {
        ...style,
        weight: segment.id === selectedSegmentId ? 6 : style.weight,
      });

      // Hover / Click interaction
      polyline.on('click', () => onSelectSegment?.(segment));
      polyline.bindTooltip(
        `<strong>${segment.roadName || 'Unnamed Verge'}</strong> (${segment.lengthM.toFixed(1)} m)${
          segment.isDemo ? ' <span class="text-purple-600 font-bold">[DEMO]</span>' : ''
        }`,
        { sticky: true },
      );

      layerGroup.addLayer(polyline);
    });

    // 2. Render In-Progress Drawing Line
    if (inProgressCoordinates.length >= 2) {
      const draftLatLngs: [number, number][] = inProgressCoordinates.map(([lon, lat]) => [
        lat,
        lon,
      ]);
      const draftPolyline = L.polyline(draftLatLngs, {
        color: '#059669',
        weight: 4,
        dashArray: '6, 6',
        opacity: 0.9,
      });
      layerGroup.addLayer(draftPolyline);
    }

    return () => {
      layerGroup.clearLayers();
      map.removeLayer(layerGroup);
    };
  }, [map, segments, selectedSegmentId, inProgressCoordinates, onSelectSegment]);

  return null;
};
