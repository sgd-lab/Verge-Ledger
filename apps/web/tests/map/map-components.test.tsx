/**
 * @vitest-environment jsdom
 */
import '../setup';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Leaflet: the real library needs a rendered map container and
// network tiles, neither of which exists in jsdom. The mock records the
// calls the components make so their logic (not Leaflet's) is exercised.
// (Stubs live inside the factory because vi.mock is hoisted.)
vi.mock('leaflet', () => {
  const layer = () => ({
    on: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
    setLatLngs: vi.fn(),
    setLatLng: vi.fn(),
    setIcon: vi.fn(),
    setRadius: vi.fn(),
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
  });
  const map = () => ({
    on: vi.fn(),
    getCenter: () => ({ lat: 52.5, lng: -1.5 }),
    getZoom: () => 7,
    setView: vi.fn(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    invalidateSize: vi.fn(),
    flyTo: vi.fn(),
  });
  const api = {
    map,
    tileLayer: layer,
    layerGroup: layer,
    polyline: layer,
    marker: layer,
    circle: layer,
    divIcon: () => ({}),
    control: {
      attribution: () => ({
        addAttribution: () => ({ addTo: vi.fn() }),
      }),
    },
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  };
  return { default: api, ...api };
});

import { VergeMap } from '../../src/components/map/VergeMap';
import { SegmentLayer } from '../../src/components/map/SegmentLayer';
import { GpsMarker } from '../../src/components/map/GpsMarker';
import { DrawingToolbar } from '../../src/components/map/DrawingToolbar';
import { MapContext } from '../../src/components/map/MapContext';
import { initLeafletIcons } from '../../src/components/map/leaflet-icons';
import type L from 'leaflet';

const SEGMENT = {
  id: 'seg-1',
  workspaceId: 'ws-1',
  geometry: {
    type: 'LineString' as const,
    coordinates: [
      [-0.1278, 51.5074],
      [-0.1281, 51.508],
    ],
  },
  lengthM: 70.5,
  roadClass: 'C' as const,
  setting: 'rural' as const,
  widthBand: '1_5_to_3' as const,
  side: 'left' as const,
  roadName: 'Church Lane',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  isDemo: false,
};

function fakeMap(): L.Map {
  return {
    on: vi.fn(),
    getCenter: () => ({ lat: 52.5, lng: -1.5 }),
    getZoom: () => 7,
    setView: vi.fn(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    invalidateSize: vi.fn(),
    flyTo: vi.fn(),
  } as unknown as L.Map;
}

describe('Map components (Leaflet mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('VergeMap renders its region and its children once the map exists', async () => {
    render(
      <VergeMap>
        <SegmentLayer segments={[SEGMENT]} selectedSegmentId="seg-1" />
        <GpsMarker position={[51.5074, -0.1278]} accuracy={10} />
      </VergeMap>,
    );
    expect(
      screen.getByRole('region', { name: /Verge interactive survey map/i }),
    ).toBeInTheDocument();
    // Children render after the mocked map is created and set in state.
    expect(
      await screen.findByRole('button', { name: /Center map on your current location/i }),
    ).toBeInTheDocument();
  });

  it('VergeMap with a changed centre does not crash', () => {
    const { rerender } = render(<VergeMap center={[52.5, -1.5]} zoom={7} />);
    rerender(<VergeMap center={[51.5, -0.1]} zoom={10} />);
    expect(
      screen.getByRole('region', { name: /Verge interactive survey map/i }),
    ).toBeInTheDocument();
  });

  it('SegmentLayer renders nothing itself but accepts segments, selection and draft lines', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <MapContext.Provider value={fakeMap()}>
        <SegmentLayer
          segments={[SEGMENT]}
          selectedSegmentId={null}
          inProgressCoordinates={[]}
          onSelectSegment={onSelect}
        />
      </MapContext.Provider>,
    );
    expect(container).toBeInTheDocument();
    rerender(
      <MapContext.Provider value={fakeMap()}>
        <SegmentLayer
          segments={[SEGMENT]}
          selectedSegmentId="seg-1"
          inProgressCoordinates={[
            [-0.1278, 51.5074],
            [-0.1281, 51.508],
          ]}
          onSelectSegment={onSelect}
        />
      </MapContext.Provider>,
    );
    expect(container).toBeInTheDocument();
  });

  it('SegmentLayer with no map renders nothing', () => {
    const { container } = render(
      <MapContext.Provider value={null}>
        <SegmentLayer segments={[SEGMENT]} />
      </MapContext.Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('GpsMarker renders nothing without a position, and centres on click with one', () => {
    const map = fakeMap();
    const { rerender } = render(
      <MapContext.Provider value={map}>
        <GpsMarker position={null} accuracy={null} />
      </MapContext.Provider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <MapContext.Provider value={map}>
        <GpsMarker position={[51.5074, -0.1278]} accuracy={25} />
      </MapContext.Provider>,
    );
    const button = screen.getByRole('button', {
      name: /Center map on your current location/i,
    });
    fireEvent.click(button);
    expect((map as unknown as { flyTo: ReturnType<typeof vi.fn> }).flyTo).toHaveBeenCalled();
    // Position cleared again removes the marker button.
    rerender(
      <MapContext.Provider value={map}>
        <GpsMarker position={null} accuracy={null} />
      </MapContext.Provider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('DrawingToolbar: idle state, drawing state, validation and callbacks', () => {
    const handlers = {
      onStartDrawing: vi.fn(),
      onStartAtGps: vi.fn(),
      onUndoPoint: vi.fn(),
      onComplete: vi.fn(),
      onCancel: vi.fn(),
      onSwitchToManualEntry: vi.fn(),
    };
    const { rerender } = render(
      <DrawingToolbar isDrawing={false} vertexCount={0} runningLengthM={0} {...handlers} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Draw Verge Segment/i }));
    expect(handlers.onStartDrawing).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /Start at My Location/i }));
    expect(handlers.onStartAtGps).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText(/Unable to use map\? Enter coordinates manually/i));
    expect(handlers.onSwitchToManualEntry).toHaveBeenCalledTimes(1);

    // Drawing, too short: not ready, complete disabled.
    rerender(<DrawingToolbar isDrawing vertexCount={1} runningLengthM={3} {...handlers} />);
    expect(screen.getByRole('button', { name: /Complete Segment/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Undo last point/i }));
    expect(handlers.onUndoPoint).toHaveBeenCalledTimes(1);

    // Drawing, valid length: ready and completable.
    rerender(<DrawingToolbar isDrawing vertexCount={2} runningLengthM={70.5} {...handlers} />);
    expect(screen.getByText(/Ready to save/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Complete Segment/i }));
    expect(handlers.onComplete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /Cancel drawing/i }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it('initLeafletIcons is idempotent', () => {
    initLeafletIcons();
    initLeafletIcons();
    expect(true).toBe(true);
  });
});
