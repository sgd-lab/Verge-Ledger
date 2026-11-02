import { useState, useCallback, useRef } from 'react';
import type { Position } from '@verge-ledger/core';
import { calculateLineStringLength, validateSegmentLength } from '@verge-ledger/core';

export function useSegmentDrawing() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [coordinates, setCoordinates] = useState<Position[]>([]);
  const [rubberBandPoint, setRubberBandPoint] = useState<Position | null>(null);

  const startDrawing = useCallback((initialPosition?: Position) => {
    setIsDrawing(true);
    setCoordinates(initialPosition ? [initialPosition] : []);
    setRubberBandPoint(null);
  }, []);

  const addPoint = useCallback((point: Position) => {
    setCoordinates((prev) => [...prev, point]);
    setRubberBandPoint(null);
  }, []);

  // Throttle mousemove updates to one per animation frame. Leaflet fires
  // mousemove far more often than the screen refreshes, and every update
  // re-rendered the drawing layer — a direct cause of map lag while drawing.
  const rafRef = useRef(0);
  const pendingRef = useRef<Position | null>(null);
  const updateRubberBand = useCallback((point: Position) => {
    pendingRef.current = point;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (pendingRef.current) setRubberBandPoint(pendingRef.current);
    });
  }, []);

  const undoPoint = useCallback(() => {
    setCoordinates((prev) => {
      const next = prev.slice(0, -1);
      if (next.length === 0) setIsDrawing(false);
      return next;
    });
  }, []);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCoordinates([]);
    setRubberBandPoint(null);
  }, []);

  const activeCoordinates =
    rubberBandPoint && coordinates.length > 0 ? [...coordinates, rubberBandPoint] : coordinates;

  const runningLengthM = calculateLineStringLength(activeCoordinates);
  const validation = validateSegmentLength(runningLengthM);

  return {
    isDrawing,
    coordinates,
    activeCoordinates,
    vertexCount: coordinates.length,
    runningLengthM,
    validation,
    startDrawing,
    addPoint,
    updateRubberBand,
    undoPoint,
    cancelDrawing,
  };
}
