/**
 * @vitest-environment jsdom
 */
import './setup';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../src/db/schema';
import { clearDb, seedSurvey } from './seed';
import { useSegmentDrawing } from '../src/hooks/useSegmentDrawing';
import { useGeolocation } from '../src/hooks/useGeolocation';
import { useDraftSurvey } from '../src/hooks/useDraftSurvey';
import { useSegments } from '../src/hooks/useSegments';
import { useObservations } from '../src/hooks/useObservations';
import { useSyncStatus } from '../src/hooks/useSyncStatus';
import { workspaceRepo } from '../src/db/repositories/WorkspaceRepository';
import { photoRepo } from '../src/db/repositories/PhotoRepository';

describe('Hooks (quality stream)', () => {
  beforeEach(async () => {
    await clearDb();
    vi.unstubAllGlobals();
    // jsdom lacks URL.createObjectURL; patch only that method so the
    // PhotoRepository canvas path can run (constructor stays intact).
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => 'blob:test',
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: () => undefined,
      configurable: true,
    });
  });

  it('useSegmentDrawing: start, add, undo, rubber-band and cancel', async () => {
    const { result } = renderHook(() => useSegmentDrawing());
    act(() => {
      result.current.startDrawing();
    });
    expect(result.current.isDrawing).toBe(true);
    act(() => {
      result.current.addPoint([-0.1278, 51.5074]);
      result.current.addPoint([-0.1281, 51.508]);
    });
    expect(result.current.vertexCount).toBe(2);
    expect(result.current.runningLengthM).toBeGreaterThan(0);
    expect(result.current.validation.valid).toBe(true);
    act(() => {
      result.current.undoPoint();
    });
    expect(result.current.vertexCount).toBe(1);
    act(() => {
      result.current.undoPoint();
    });
    expect(result.current.isDrawing).toBe(false);
    act(() => {
      result.current.startDrawing([-0.1278, 51.5074]);
      result.current.cancelDrawing();
    });
    expect(result.current.vertexCount).toBe(0);
  });

  it('useGeolocation: unsupported device, then watch success and error', async () => {
    // jsdom has no geolocation by default in this setup: startTracking
    // reports unsupported.
    const { result, unmount } = renderHook(() => useGeolocation());
    act(() => {
      result.current.startTracking();
    });
    expect(result.current.error).toBe('Geolocation not supported by device');
    unmount();

    const watchPosition = vi.fn((_ok: unknown, _err: unknown, _opts: unknown) => 42);
    const clearWatch = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition, clearWatch },
      configurable: true,
    });
    const { result: tracked, unmount: unmount2 } = renderHook(() => useGeolocation());
    act(() => {
      tracked.current.startTracking();
    });
    expect(watchPosition).toHaveBeenCalledTimes(1);
    // Second start is a no-op while a watch is active.
    act(() => {
      tracked.current.startTracking();
    });
    expect(watchPosition).toHaveBeenCalledTimes(1);
    const success = watchPosition.mock.calls[0]![0] as (pos: {
      coords: { latitude: number; longitude: number; accuracy: number };
    }) => void;
    act(() => {
      success({ coords: { latitude: 51.5, longitude: -0.12, accuracy: 15 } });
    });
    expect(tracked.current.coords).toEqual({ lat: 51.5, lng: -0.12 });
    act(() => {
      tracked.current.stopTracking();
    });
    expect(clearWatch).toHaveBeenCalledWith(42);
    unmount2();

    // Error path: permission denied.
    const watchError = vi.fn(((_ok: unknown, err: unknown) => {
      const e = err as { code: number; PERMISSION_DENIED: number };
      e.code = 1;
      (err as (e: unknown) => void)({ code: 1, PERMISSION_DENIED: 1, message: 'denied' });
      return 7;
    }) as never);
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: watchError, clearWatch: vi.fn() },
      configurable: true,
    });
    const { result: denied } = renderHook(() => useGeolocation());
    act(() => {
      denied.current.startTracking();
    });
    expect(denied.current.error).toMatch(/permission denied/i);
  });

  it('useDraftSurvey, useSegments, useObservations round-trip seeded data', async () => {
    const { segment, observation } = await seedSurvey();
    const draftHook = renderHook(() => useDraftSurvey());
    await act(async () => {
      await draftHook.result.current.saveDraft(2, { roadName: 'Church Lane' });
    });
    await waitFor(() => {
      expect(draftHook.result.current.hasDraft).toBe(true);
    });
    await act(async () => {
      await draftHook.result.current.clearDraft();
    });
    await waitFor(() => {
      expect(draftHook.result.current.hasDraft).toBe(false);
    });

    const segmentsHook = renderHook(() => useSegments(segment.workspaceId));
    await waitFor(() => {
      expect(segmentsHook.result.current.segments).toHaveLength(1);
    });
    const observationsHook = renderHook(() => useObservations(segment.id));
    await waitFor(() => {
      expect(observationsHook.result.current.observations).toHaveLength(1);
    });
    await act(async () => {
      await observationsHook.result.current.updateObservation(observation.id, {
        notes: 'Updated note',
      });
    });
    await act(async () => {
      await observationsHook.result.current.deleteObservation(observation.id);
    });
    await waitFor(() => {
      expect(observationsHook.result.current.observations).toHaveLength(0);
    });
    // No workspace / no segment: empty lists, not errors.
    const emptySegments = renderHook(() => useSegments());
    const emptyObservations = renderHook(() => useObservations());
    expect(emptySegments.result.current.segments).toEqual([]);
    expect(emptyObservations.result.current.observations).toEqual([]);
  });

  it('useSyncStatus: local-only by default, synced when enabled, offline events', async () => {
    const workspace = await workspaceRepo.create({ name: 'Sync Parish', syncEnabled: true });
    await db.appSettings.put({ key: `lastSyncedAt_${workspace.id}`, value: '2026-01-02' });
    const { result } = renderHook(() => useSyncStatus(workspace.id));
    await waitFor(() => {
      expect(result.current.state).toBe('synced');
    });
    expect(result.current.lastSyncedAt).toBe('2026-01-02');
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await waitFor(() => {
      expect(result.current.state).toBe('offline');
    });
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => {
      expect(result.current.state).toBe('synced');
    });
    const localOnly = renderHook(() => useSyncStatus());
    expect(localOnly.result.current.state).toBe('local-only');
  });

  it('PhotoRepository: save, list and EXIF fallback processing', async () => {
    // jsdom never fires Image.onload, so the canvas path would hang.
    // Stub Image to load immediately; jsdom canvas has no 2d context,
    // so stripExifAndProcess takes its no-context fallback path.
    const OriginalImage = globalThis.Image;
    class StubImage {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal('Image', StubImage);
    const { observation } = await seedSurvey();
    const file = new File(['fake-image'], 'verge.jpg', { type: 'image/jpeg' });
    const saved = await photoRepo.savePhoto({ observationId: observation.id, file });
    expect(saved.mimeType).toBe('image/jpeg');
    const listed = await photoRepo.listByObservation(observation.id);
    expect(listed).toHaveLength(1);
    expect(await photoRepo.getById(saved.id)).toBeDefined();
    const processed = await photoRepo.stripExifAndProcess(file);
    expect(processed.width).toBeGreaterThan(0);
    await photoRepo.delete(saved.id);
    expect(await photoRepo.listByObservation(observation.id)).toHaveLength(0);
    vi.stubGlobal('Image', OriginalImage);
  });
});
