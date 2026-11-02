import { useState, useEffect, useCallback, useRef } from 'react';

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

  // The watch id must live in a ref, not state. The old version stored it
  // in state, so starting tracking re-ran the auto-start effect, which
  // cleared the just-created watch — tracking silently stopped after the
  // first position, and with autoStart it could start duplicate watches.
  const watchIdRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  const startTracking = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState((prev) => ({ ...prev, error: 'Geolocation not supported by device' }));
      return;
    }
    if (watchIdRef.current !== null) return; // already tracking

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
    watchIdRef.current = id;
  }, []);

  useEffect(() => {
    if (autoStart) startTracking();
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // Once-only for autoStart: startTracking is stable, and tracking must
    // not restart when a position arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return { ...state, startTracking, stopTracking };
}
