import { useState, useCallback } from 'react';
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

  const updateRubberBand = useCallback((point: Position) => {
    setRubberBandPoint(point);
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
