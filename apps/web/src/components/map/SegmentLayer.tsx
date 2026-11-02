import type React from 'react';
import { useEffect, useRef } from 'react';
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
  // Keep one persistent layer group instead of rebuilding every segment on
  // every render. The old code cleared and re-added every polyline whenever
  // the in-progress drawing point moved — i.e. on every mousemove — which
  // is what made drawing feel laggy and flickery.
  const savedGroupRef = useRef<L.LayerGroup | null>(null);
  const draftRef = useRef<L.Polyline | null>(null);
  const onSelectRef = useRef(onSelectSegment);
  onSelectRef.current = onSelectSegment;

  // Saved segments: rebuild only when the segments or the selection change.
  useEffect(() => {
    if (!map) return;
    if (!savedGroupRef.current) {
      savedGroupRef.current = L.layerGroup().addTo(map);
    }
    const layerGroup = savedGroupRef.current;
    layerGroup.clearLayers();

    segments.forEach((segment) => {
      const latlngs: [number, number][] = segment.geometry.coordinates.map(([lon, lat]) => [
        lat,
        lon,
      ]);

      const halo = L.polyline(latlngs, {
        color: '#FFFFFF',
        weight: 7,
        opacity: 0.85,
        lineCap: 'round',
        interactive: false,
      });
      layerGroup.addLayer(halo);

      const style = getSegmentStyle(segment.isDemo, null);
      const polyline = L.polyline(latlngs, {
        ...style,
        weight: segment.id === selectedSegmentId ? 6 : style.weight,
      });

      polyline.on('click', () => onSelectRef.current?.(segment));
      polyline.bindTooltip(
        `<strong>${segment.roadName || 'Unnamed Verge'}</strong> (${segment.lengthM.toFixed(1)} m)${
          segment.isDemo ? ' <span class="text-purple-600 font-bold">[DEMO]</span>' : ''
        }`,
        { sticky: true },
      );

      layerGroup.addLayer(polyline);
    });

    return () => {
      layerGroup.clearLayers();
    };
  }, [map, segments, selectedSegmentId]);

  // In-progress drawing line: update a single polyline in place, never
  // touching the saved segments.
  useEffect(() => {
    if (!map) return;
    if (inProgressCoordinates.length >= 2) {
      const draftLatLngs: [number, number][] = inProgressCoordinates.map(([lon, lat]) => [
        lat,
        lon,
      ]);
      if (!draftRef.current) {
        draftRef.current = L.polyline(draftLatLngs, {
          color: '#059669',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.9,
        }).addTo(map);
      } else {
        draftRef.current.setLatLngs(draftLatLngs);
      }
    } else if (draftRef.current) {
      map.removeLayer(draftRef.current);
      draftRef.current = null;
    }
  }, [map, inProgressCoordinates]);

  return null;
};
