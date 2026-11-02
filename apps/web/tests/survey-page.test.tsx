/**
 * @vitest-environment jsdom
 */
import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Leaflet mock (self-contained factory; vi.mock is hoisted).
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

import { db } from '../src/db/schema';
import { clearDb, seedSurvey } from './seed';
import { SurveyPage } from '../src/pages/SurveyPage';

describe('SurveyPage (quality stream)', () => {
  beforeEach(async () => {
    await clearDb();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('survey→score: coordinate entry, segment save, observation save with a score', async () => {
    render(<SurveyPage />);
    expect(await screen.findByText(/Five-Minute Road Verge Survey/i)).toBeInTheDocument();
    // Safety acknowledgement.
    fireEvent.click(screen.getByRole('button', { name: /I understand/i }));
    // Coordinate entry mode, then the new-segment form.
    fireEvent.click(await screen.findByRole('button', { name: /Enter coordinates/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add a segment/i }));
    expect(await screen.findByText(/Manual Coordinate Entry/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Start Latitude/i), {
      target: { value: '51.5074' },
    });
    fireEvent.change(screen.getByLabelText(/Start Longitude/i), {
      target: { value: '-0.1278' },
    });
    fireEvent.change(screen.getByLabelText(/End Latitude/i), {
      target: { value: '51.508' },
    });
    fireEvent.change(screen.getByLabelText(/End Longitude/i), {
      target: { value: '-0.1281' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Segment Geometry/i }));
    expect(await screen.findByText(/Geometry confirmed/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Road name \(optional\)/i), {
      target: { value: 'Church Lane' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save segment/i }));
    expect(await screen.findByText(/Segment saved/i)).toBeInTheDocument();
    // Observation form for the new segment, scored on save.
    expect(await screen.findByText(/Add an observation/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Save observation and score it/i }));
    expect(await screen.findByText(/Observation saved\. Triage score/i)).toBeInTheDocument();
    const observations = await db.surveyObservations.toArray();
    expect(observations).toHaveLength(1);
    expect(observations[0]?.scoreResult?.finalScore).toBeGreaterThan(0);
  });

  it('seeded segment: edit, observation list, and delete', async () => {
    await seedSurvey();
    render(<SurveyPage />);
    expect(
      (await screen.findAllByText(/Church Lane \(70\.5 m, left side\)/i)).length,
    ).toBeGreaterThan(0);
    // Seeded segment is selected by default, so its observation form shows.
    expect(await screen.findByText(/Add an observation/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Edit segment/i }));
    expect(await screen.findByRole('heading', { name: /Edit segment/i })).toBeInTheDocument();
    const editName = screen.getByLabelText(/Road name \(optional\)/i);
    fireEvent.change(editName, { target: { value: 'Renamed Lane' } });
    fireEvent.click(screen.getByRole('button', { name: /Save segment changes/i }));
    await waitFor(async () => {
      expect(
        (await screen.findAllByText(/Renamed Lane \(70\.5 m, left side\)/i)).length,
      ).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole('button', { name: /Delete segment/i }));
    expect(await screen.findByText(/Segment deleted/i)).toBeInTheDocument();
  });

  it('map drawing toolbar starts drawing from the Survey page', async () => {
    render(<SurveyPage />);
    expect(await screen.findByText(/Map — your saved verges/i)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /Draw Verge Segment/i }));
    expect(await screen.findByText(/shorter than minimum/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel drawing/i }));
    expect(await screen.findByRole('button', { name: /Draw Verge Segment/i })).toBeInTheDocument();
  });
});
