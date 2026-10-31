import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  isTracking: boolean;
}

export function useGeolocation(autoStart = false) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    accuracy: null,
    error: null,
    isTracking: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState((prev) => ({ ...prev, error: 'Geolocation not supported by device' }));
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
          isTracking: true,
        });
      },
      (err) => {
        let msg = 'Unable to acquire location';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please enable location in browser settings.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setState((prev) => ({ ...prev, error: msg, isTracking: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    setWatchId(id);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState((prev) => ({ ...prev, isTracking: false }));
    }
  }, [watchId]);

  useEffect(() => {
    if (autoStart) startTracking();
    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [autoStart, startTracking, watchId]);

  return { ...state, startTracking, stopTracking };
}
