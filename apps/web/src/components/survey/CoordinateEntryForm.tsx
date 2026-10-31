import React, { useState } from 'react';
import { Navigation, Check, AlertCircle } from 'lucide-react';
import { haversineDistance, validateSegmentLength, type Position } from '@verge-ledger/core';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';

export interface CoordinateEntryResult {
  geometry: {
    type: 'LineString';
    coordinates: Position[]; // [lon, lat]
  };
  lengthM: number;
}

export interface CoordinateEntryFormProps {
  initialStart?: [number, number]; // [lat, lon]
  initialEnd?: [number, number]; // [lat, lon]
  onSave: (result: CoordinateEntryResult) => void;
  onCancel?: () => void;
}

export function CoordinateEntryForm({
  initialStart,
  initialEnd,
  onSave,
  onCancel,
}: CoordinateEntryFormProps): React.ReactElement {
  const [startLat, setStartLat] = useState<string>(initialStart ? initialStart[0].toString() : '');
  const [startLon, setStartLon] = useState<string>(initialStart ? initialStart[1].toString() : '');
  const [endLat, setEndLat] = useState<string>(initialEnd ? initialEnd[0].toString() : '');
  const [endLon, setEndLon] = useState<string>(initialEnd ? initialEnd[1].toString() : '');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse numerical coordinates
  const sLat = parseFloat(startLat);
  const sLon = parseFloat(startLon);
  const eLat = parseFloat(endLat);
  const eLon = parseFloat(endLon);

  const hasValidStart =
    !isNaN(sLat) && !isNaN(sLon) && sLat >= -90 && sLat <= 90 && sLon >= -180 && sLon <= 180;
  const hasValidEnd =
    !isNaN(eLat) && !isNaN(eLon) && eLat >= -90 && eLat <= 90 && eLon >= -180 && eLon <= 180;

  // Calculate length via haversine [lon, lat]
  let calculatedLengthM: number | null = null;
  let validationResult: { valid: boolean; error?: string } = { valid: false };

  if (hasValidStart && hasValidEnd) {
    const startPos: Position = [sLon, sLat];
    const endPos: Position = [eLon, eLat];
    calculatedLengthM = haversineDistance(startPos, endPos);
    validationResult = validateSegmentLength(calculatedLengthM);
  }

  // HTML5 Geolocation capture for start point
  const handleAcquireGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        setStartLat(position.coords.latitude.toFixed(6));
        setStartLon(position.coords.longitude.toFixed(6));
        setGpsMessage(`Location acquired (accuracy ±${Math.round(position.coords.accuracy)} m)`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsMessage(`Unable to retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasValidStart) {
      setError(
        'Please provide valid Start Point coordinates (Latitude: -90 to 90, Longitude: -180 to 180).',
      );
      return;
    }
    if (!hasValidEnd) {
      setError('Please provide valid End Point coordinates.');
      return;
    }
    if (!validationResult.valid || calculatedLengthM === null) {
      setError(validationResult.error || 'Segment length is invalid.');
      return;
    }

    onSave({
      geometry: {
        type: 'LineString',
        coordinates: [
          [sLon, sLat],
          [eLon, eLat],
        ],
      },
      lengthM: Math.round(calculatedLengthM * 10) / 10,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg border border-slate-200"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <span>Manual Coordinate Entry (Map Alternative)</span>
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Enter decimal degrees (WGS84) for the start and end points of the verge. Representative
          sample should be at least 10 m and maximum 500 m.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Start Point Fieldset */}
      <fieldset className="p-4 border border-slate-200 rounded-md space-y-3">
        <legend className="text-sm font-semibold text-slate-800 px-1">Start Point</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="start-lat"
            label="Start Latitude (°N)"
            type="number"
            step="0.000001"
            placeholder="e.g. 51.507400"
            value={startLat}
            onChange={(e) => setStartLat(e.target.value)}
            required
          />
          <Input
            id="start-lon"
            label="Start Longitude (°E/W)"
            type="number"
            step="0.000001"
            placeholder="e.g. -0.127800"
            value={startLon}
            onChange={(e) => setStartLon(e.target.value)}
            required
          />
        </div>
        <div className="pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAcquireGps}
            isLoading={gpsLoading}
          >
            Use My Current Location
          </Button>
          {gpsMessage && (
            <p className="text-xs text-slate-600 mt-1.5" role="status">
              {gpsMessage}
            </p>
          )}
        </div>
      </fieldset>

      {/* End Point Fieldset */}
      <fieldset className="p-4 border border-slate-200 rounded-md space-y-3">
        <legend className="text-sm font-semibold text-slate-800 px-1">End Point</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="end-lat"
            label="End Latitude (°N)"
            type="number"
            step="0.000001"
            placeholder="e.g. 51.508000"
            value={endLat}
            onChange={(e) => setEndLat(e.target.value)}
            required
          />
          <Input
            id="end-lon"
            label="End Longitude (°E/W)"
            type="number"
            step="0.000001"
            placeholder="e.g. -0.128100"
            value={endLon}
            onChange={(e) => setEndLon(e.target.value)}
            required
          />
        </div>
      </fieldset>

      {/* Live Calculated Length & Validation Status */}
      <div className="p-4 rounded-md bg-slate-50 border border-slate-200" aria-live="polite">
        <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">
          Calculated Segment Length
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-2xl font-black text-slate-900">
            {calculatedLengthM !== null ? `${calculatedLengthM.toFixed(1)} m` : '—'}
          </span>
          {calculatedLengthM !== null &&
            (validationResult.valid ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800">
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Valid (5 m – 500 m)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span>{validationResult.error}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={!validationResult.valid || calculatedLengthM === null}
        >
          Confirm Segment Geometry
        </Button>
      </div>
    </form>
  );
}
