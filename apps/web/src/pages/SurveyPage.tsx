import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Compass } from 'lucide-react';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import {
  calculateLineStringLength,
  calculateTriageScore,
  validateSegmentLength,
  type CutState,
  type CuttingsState,
  type ForbCountBand,
  type RoadClass,
  type Setting,
  type Shade,
  type Side,
  type Slope,
  type SwardStructure,
  type WidthBand,
} from '@verge-ledger/core';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import {
  CoordinateEntryForm,
  type CoordinateEntryResult,
} from '../components/survey/CoordinateEntryForm';
import { VergeMap } from '../components/map/VergeMap';
import { SegmentLayer } from '../components/map/SegmentLayer';
import { DrawingToolbar } from '../components/map/DrawingToolbar';
import { GpsMarker } from '../components/map/GpsMarker';
import { useSegmentDrawing } from '../hooks/useSegmentDrawing';
import { useGeolocation } from '../hooks/useGeolocation';
import { db } from '../db/schema';
import { segmentRepo } from '../db/repositories/SegmentRepository';
import { observationRepo } from '../db/repositories/ObservationRepository';
import { draftRepo } from '../db/repositories/DraftRepository';
import { photoRepo } from '../db/repositories/PhotoRepository';
import { ensureWorkspace, useSurveyData } from '../hooks/useSurveyData';
import {
  FORB_BAND_LABELS,
  SWARD_LABELS,
  WIDTH_LABELS,
  hasSensitiveTaxa,
  indicatorById,
  latestObservationsBySegment,
  scoreForObservation,
  segmentLabel,
} from '../lib/pageData';

const SAFETY_COPY =
  'Survey from a safe position. Never stand on the carriageway. Never cut/damage a verge without written permission. Do not trespass.';

function triStateToBoolean(value: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function booleanToTriState(value: boolean | undefined): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
}

function draftString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function draftStringArray(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

const POSITIVE_INDICATORS = INDICATOR_SPECIES.filter((s) => s.group !== 'nutrient_enrichment');
const NUTRIENT_DOMINANTS = INDICATOR_SPECIES.filter((s) => s.group === 'nutrient_enrichment');

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function SurveyPage(): React.ReactElement {
  const { segments, observations, isLoading } = useSurveyData();
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [geometry, setGeometry] = useState<CoordinateEntryResult | null>(null);
  const [roadClass, setRoadClass] = useState<RoadClass>('U');
  const [setting, setSetting] = useState<Setting>('rural');
  const [widthBand, setWidthBand] = useState<WidthBand>('1_5_to_3');
  const [side, setSide] = useState<Side>('unknown');
  const [roadName, setRoadName] = useState('');
  const [soilType, setSoilType] = useState('');
  const [slope, setSlope] = useState<string>('');
  const [shade, setShade] = useState<string>('');
  const [footwayPresence, setFootwayPresence] = useState<string>('');
  const [sightlineSplay, setSightlineSplay] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Segment edit (soft-delete only; see handleDeleteSegment).
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editRoadName, setEditRoadName] = useState('');
  const [editRoadClass, setEditRoadClass] = useState<RoadClass>('U');
  const [editSetting, setEditSetting] = useState<Setting>('rural');
  const [editWidthBand, setEditWidthBand] = useState<WidthBand>('1_5_to_3');
  const [editSide, setEditSide] = useState<Side>('unknown');
  const [editSoilType, setEditSoilType] = useState('');
  const [editSlope, setEditSlope] = useState<string>('');
  const [editShade, setEditShade] = useState<string>('');
  const [editFootway, setEditFootway] = useState<string>('');
  const [editSplay, setEditSplay] = useState<string>('');

  // Safety acknowledgement (SUR-6): persisted in appSettings.
  const safetySetting = useLiveQuery(() => db.appSettings.get('safetyAcknowledged'), []);
  const safetyAcknowledged = safetySetting?.value === 'true' || safetySetting?.value === true;

  // Draft auto-save / resume.
  const [draftData, setDraftData] = useState<Record<string, unknown> | null>(null);
  const [draftGate, setDraftGate] = useState<'loading' | 'blocked' | 'open'>('loading');
  const draftLoadedRef = useRef(false);

  // Photos pending upload for the next observation (max 3).
  const [pendingPhotos, setPendingPhotos] = useState<{ name: string; blob: Blob }[]>([]);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  const [forbBand, setForbBand] = useState<ForbCountBand>('3_5');
  const [indicatorIds, setIndicatorIds] = useState<string[]>([]);
  const [nutrientIds, setNutrientIds] = useState<string[]>([]);
  const [sward, setSward] = useState<SwardStructure>('medium_mixed');
  const [cutState, setCutState] = useState<CutState>('unknown');
  const [cuttingsState, setCuttingsState] = useState<CuttingsState>('na');
  const [lastCutMonth, setLastCutMonth] = useState('');
  const [notes, setNotes] = useState('');

  // Map drawing (the map was previously built but never rendered anywhere,
  // so the Survey page showed no map at all). Drawing state lives here so
  // the map above and the road-details form below share one geometry.
  const drawing = useSegmentDrawing();
  const geo = useGeolocation(false);
  const [startAtGpsPending, setStartAtGpsPending] = useState(false);
  const [mapMode, setMapMode] = useState<'map' | 'coordinates'>('map');
  const mapCenter: [number, number] = useMemo(
    () => (geo.coords ? [geo.coords.lat, geo.coords.lng] : [52.5, -1.5]),
    [geo.coords],
  );
  const mapZoom = geo.coords ? 17 : 7;

  useEffect(() => {
    if (startAtGpsPending && geo.coords) {
      drawing.startDrawing([geo.coords.lng, geo.coords.lat]);
      setStartAtGpsPending(false);
    }
  }, [startAtGpsPending, geo.coords, drawing]);

  // Load any saved draft once. If one exists, auto-save stays blocked until
  // the user resumes or discards it, so empty defaults never overwrite it.
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    void draftRepo
      .getDraft()
      .then((draft) => {
        if (draft) {
          setDraftData(draft.data);
          setDraftGate('blocked');
        } else {
          setDraftGate('open');
        }
      })
      .catch(() => setDraftGate('open'));
  }, []);

  // Draft auto-save: persist the in-progress survey form locally.
  useEffect(() => {
    if (draftGate !== 'open') return;
    const timer = window.setTimeout(() => {
      void draftRepo.saveDraft(1, {
        roadName,
        soilType,
        slope,
        shade,
        footwayPresence,
        sightlineSplay,
        roadClass,
        setting,
        widthBand,
        side,
        selectedSegmentId,
        forbBand,
        indicatorIds,
        nutrientIds,
        sward,
        cutState,
        cuttingsState,
        lastCutMonth,
        notes,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    draftGate,
    roadName,
    soilType,
    slope,
    shade,
    footwayPresence,
    sightlineSplay,
    roadClass,
    setting,
    widthBand,
    side,
    selectedSegmentId,
    forbBand,
    indicatorIds,
    nutrientIds,
    sward,
    cutState,
    cuttingsState,
    lastCutMonth,
    notes,
  ]);

  const handleSelectSegment = useCallback((id: string) => {
    setSelectedSegmentId(id);
  }, []);

  const handleCompleteDrawing = () => {
    const coords = drawing.activeCoordinates;
    if (coords.length < 2) return;
    const lengthM = Math.round(calculateLineStringLength(coords) * 10) / 10;
    const validation = validateSegmentLength(lengthM);
    if (!validation.valid) {
      setError(validation.error ?? 'Segment length is invalid (must be 5–500 m).');
      return;
    }
    setGeometry({ geometry: { type: 'LineString', coordinates: coords }, lengthM });
    drawing.cancelDrawing();
    setShowSegmentForm(true);
    setSavedMessage(`Map segment drawn (${lengthM} m). Fill in the road details and save.`);
  };

  const latestBySegment = useMemo(() => latestObservationsBySegment(observations), [observations]);
  const selectedSegment = segments.find((s) => s.id === selectedSegmentId) ?? segments[0];
  const selectedObservations = useMemo(
    () =>
      selectedSegment
        ? observations
            .filter((o) => o.segmentId === selectedSegment.id)
            .slice()
            .sort((a, b) => (a.observedAt < b.observedAt ? 1 : -1))
        : [],
    [observations, selectedSegment],
  );

  useEffect(() => {
    if (selectedObservations.length === 0) return;
    void (async () => {
      const counts: Record<string, number> = {};
      for (const obs of selectedObservations) {
        counts[obs.id] = (await photoRepo.listByObservation(obs.id)).length;
      }
      setPhotoCounts((prev) => ({ ...prev, ...counts }));
    })();
  }, [selectedObservations]);

  const handleAcknowledgeSafety = async () => {
    await db.appSettings.put({ key: 'safetyAcknowledged', value: 'true' });
  };

  const handleResumeDraft = () => {
    if (!draftData) return;
    setRoadName(draftString(draftData, 'roadName'));
    setSoilType(draftString(draftData, 'soilType'));
    setSlope(draftString(draftData, 'slope'));
    setShade(draftString(draftData, 'shade'));
    setFootwayPresence(draftString(draftData, 'footwayPresence'));
    setSightlineSplay(draftString(draftData, 'sightlineSplay'));
    const rc = draftString(draftData, 'roadClass');
    if (rc) setRoadClass(rc as RoadClass);
    const st = draftString(draftData, 'setting');
    if (st) setSetting(st as Setting);
    const wb = draftString(draftData, 'widthBand');
    if (wb) setWidthBand(wb as WidthBand);
    const sd = draftString(draftData, 'side');
    if (sd) setSide(sd as Side);
    const segId = draftString(draftData, 'selectedSegmentId');
    if (segId) setSelectedSegmentId(segId);
    const fb = draftString(draftData, 'forbBand');
    if (fb) setForbBand(fb as ForbCountBand);
    setIndicatorIds(draftStringArray(draftData, 'indicatorIds'));
    setNutrientIds(draftStringArray(draftData, 'nutrientIds'));
    const sw = draftString(draftData, 'sward');
    if (sw) setSward(sw as SwardStructure);
    const cs = draftString(draftData, 'cutState');
    if (cs) setCutState(cs as CutState);
    const ct = draftString(draftData, 'cuttingsState');
    if (ct) setCuttingsState(ct as CuttingsState);
    setLastCutMonth(draftString(draftData, 'lastCutMonth'));
    setNotes(draftString(draftData, 'notes'));
    setDraftData(null);
    setDraftGate('open');
    setSavedMessage('Draft resumed.');
  };

  const handleDiscardDraft = async () => {
    await draftRepo.clearDraft();
    setDraftData(null);
    setDraftGate('open');
  };

  const handlePhotoSelect = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const chosen = Array.from(files);
    if (pendingPhotos.length + chosen.length > 3) {
      setError('Maximum of 3 photos per observation.');
      return;
    }
    try {
      const processed: { name: string; blob: Blob }[] = [];
      for (const file of chosen) {
        // Strip EXIF by canvas re-encode before the photo is stored.
        const result = await photoRepo.stripExifAndProcess(file);
        processed.push({ name: file.name, blob: result.blob });
      }
      setPendingPhotos((prev) => [...prev, ...processed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process the photo.');
    }
  };

  const handleAddPhotosToObservation = async (observationId: string, files: FileList | null) => {
    if (!files) return;
    setError(null);
    try {
      const existing = await photoRepo.listByObservation(observationId);
      if (existing.length + files.length > 3) {
        setError('Maximum of 3 photos per observation.');
        return;
      }
      for (const file of Array.from(files)) {
        await photoRepo.savePhoto({ observationId, file });
      }
      const updated = await photoRepo.listByObservation(observationId);
      setPhotoCounts((prev) => ({ ...prev, [observationId]: updated.length }));
      setSavedMessage('Photo saved. Photos are stored locally only.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the photo.');
    }
  };

  const startEditSegment = (segment: (typeof segments)[number]) => {
    setEditingSegmentId(segment.id);
    setEditRoadName(segment.roadName ?? '');
    setEditRoadClass(segment.roadClass);
    setEditSetting(segment.setting);
    setEditWidthBand(segment.widthBand);
    setEditSide(segment.side);
    setEditSoilType(segment.soilType ?? '');
    setEditSlope(segment.slope ?? '');
    setEditShade(segment.shade ?? '');
    setEditFootway(booleanToTriState(segment.footwayPresence));
    setEditSplay(booleanToTriState(segment.sightlineSplay));
  };

  const handleUpdateSegment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSegmentId) return;
    setError(null);
    try {
      const updates: Parameters<typeof segmentRepo.update>[1] = {
        roadName: editRoadName.trim() ? editRoadName.trim() : null,
        roadClass: editRoadClass,
        setting: editSetting,
        widthBand: editWidthBand,
        side: editSide,
      };
      if (editSoilType.trim()) updates.soilType = editSoilType.trim();
      if (editSlope) updates.slope = editSlope as Slope;
      if (editShade) updates.shade = editShade as Shade;
      const footway = triStateToBoolean(editFootway);
      if (footway !== undefined) updates.footwayPresence = footway;
      const splay = triStateToBoolean(editSplay);
      if (splay !== undefined) updates.sightlineSplay = splay;
      await segmentRepo.update(editingSegmentId, updates);
      setEditingSegmentId(null);
      setSavedMessage('Segment updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the segment.');
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (
      !window.confirm(
        'Delete this segment? It will be kept as a deleted record, not removed outright.',
      )
    ) {
      return;
    }
    try {
      // Soft delete (tombstone via deletedAt). Never the hard-delete cascade here.
      await segmentRepo.softDelete(id);
      if (selectedSegmentId === id) setSelectedSegmentId(null);
      if (editingSegmentId === id) setEditingSegmentId(null);
      setSavedMessage('Segment deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the segment.');
    }
  };

  const handleCreateSegment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    if (!geometry) {
      setError('Enter start and end coordinates first, so the segment length can be checked.');
      return;
    }
    try {
      const workspace = await ensureWorkspace();
      const created = await segmentRepo.create({
        workspaceId: workspace.id,
        geometry: geometry.geometry,
        lengthM: geometry.lengthM,
        roadClass,
        setting,
        widthBand,
        side,
        roadName: roadName.trim() ? roadName.trim() : null,
        soilType: soilType.trim() ? soilType.trim() : undefined,
        slope: slope ? (slope as Slope) : undefined,
        shade: shade ? (shade as Shade) : undefined,
        footwayPresence: triStateToBoolean(footwayPresence),
        sightlineSplay: triStateToBoolean(sightlineSplay),
        isDemo: false,
      });
      setSelectedSegmentId(created.id);
      setGeometry(null);
      setRoadName('');
      setSoilType('');
      setSlope('');
      setShade('');
      setFootwayPresence('');
      setSightlineSplay('');
      setShowSegmentForm(false);
      setSavedMessage(`Segment saved (${created.lengthM} m). Now add a survey observation below.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the segment.');
    }
  };

  const handleCreateObservation = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    if (!selectedSegment) {
      setError('Create a segment first.');
      return;
    }
    try {
      const indicators = indicatorIds
        .map((id) => indicatorById(INDICATOR_SPECIES, id))
        .filter((item) => item !== undefined);
      const scoreResult = calculateTriageScore({
        forbCountBand: forbBand,
        indicators,
        nutrientDominantCount: nutrientIds.length,
        swardStructure: sward,
        cutState,
        cuttingsState,
        lastCutMonth: lastCutMonth ? Number(lastCutMonth) : null,
      });
      const now = new Date().toISOString();
      const createdObservation = await observationRepo.create({
        segmentId: selectedSegment.id,
        observedAt: now,
        forbCountBand: forbBand,
        indicatorIds,
        nutrientDominantIds: nutrientIds,
        swardStructure: sward,
        cutState,
        cuttingsState,
        lastCutMonth: lastCutMonth ? Number(lastCutMonth) : null,
        notes: notes.trim() ? notes.trim() : null,
        photoIds: [],
        scoringVersion: 'verge-triage-v1',
        scoreResult,
        isDemo: false,
      });
      // Attach pending photos (already EXIF-stripped on selection; savePhoto
      // strips again on storage). Enforced at max 3 by the photo picker.
      // Photos are linked by observationId; the observation itself is not
      // re-saved here because re-scoring on update would change its score.
      for (const photo of pendingPhotos) {
        await photoRepo.savePhoto({ observationId: createdObservation.id, file: photo.blob });
      }
      setPendingPhotos([]);
      await draftRepo.clearDraft();
      setIndicatorIds([]);
      setNutrientIds([]);
      setNotes('');
      setLastCutMonth('');
      setSavedMessage(
        `Observation saved. Triage score ${scoreResult.finalScore}/100 — ${scoreResult.tierLabel}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the observation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Five-Minute Road Verge Survey</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Record a segment, then add what you saw. Everything is stored on this device only. Survey
          from a safe position, on a footway or verge with clear sightlines. Never stand on the
          carriageway, and never survey fast roads.
        </p>
      </div>

      {!safetyAcknowledged && (
        <Alert variant="warning" title="Before you survey — please acknowledge">
          <p>{SAFETY_COPY}</p>
          <p className="mt-2">
            Survey from a safe position, avoid fast roads, and keep highway safety rules above any
            recommendation.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2"
            onClick={() => void handleAcknowledgeSafety()}
          >
            I understand — acknowledge once
          </Button>
        </Alert>
      )}

      {draftData && (
        <Alert variant="info" title="Unfinished survey draft found">
          <p>Your in-progress survey was saved on this device. Resume it, or discard it.</p>
          <div className="flex gap-2 mt-2">
            <Button type="button" size="sm" onClick={handleResumeDraft}>
              Resume draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void handleDiscardDraft()}
            >
              Discard draft
            </Button>
          </div>
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {savedMessage && <Alert variant="success">{savedMessage}</Alert>}

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading your saved verges…</p>
      ) : (
        <>
          <section aria-labelledby="map-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="map-heading" className="text-lg font-bold text-slate-900">
                Map — your saved verges
              </h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mapMode === 'map' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMapMode('map')}
                >
                  Draw on map
                </Button>
                <Button
                  type="button"
                  variant={mapMode === 'coordinates' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMapMode('coordinates')}
                >
                  Enter coordinates
                </Button>
              </div>
            </div>
            {mapMode === 'map' ? (
              <VergeMap
                center={mapCenter}
                zoom={mapZoom}
                onMapClick={(latlng) => {
                  if (drawing.isDrawing) drawing.addPoint([latlng.lng, latlng.lat]);
                }}
                onMapMouseMove={(latlng) => {
                  if (drawing.isDrawing) drawing.updateRubberBand([latlng.lng, latlng.lat]);
                }}
              >
                <SegmentLayer
                  segments={segments}
                  selectedSegmentId={selectedSegment?.id ?? null}
                  inProgressCoordinates={drawing.activeCoordinates}
                  onSelectSegment={(segment) => handleSelectSegment(segment.id)}
                />
                <GpsMarker
                  position={geo.coords ? [geo.coords.lat, geo.coords.lng] : null}
                  accuracy={geo.accuracy}
                />
                <DrawingToolbar
                  isDrawing={drawing.isDrawing}
                  vertexCount={drawing.vertexCount}
                  runningLengthM={drawing.runningLengthM}
                  onStartDrawing={() => drawing.startDrawing()}
                  onStartAtGps={() => {
                    geo.startTracking();
                    if (geo.coords) {
                      drawing.startDrawing([geo.coords.lng, geo.coords.lat]);
                    } else {
                      setStartAtGpsPending(true);
                    }
                  }}
                  onUndoPoint={drawing.undoPoint}
                  onComplete={handleCompleteDrawing}
                  onCancel={() => {
                    drawing.cancelDrawing();
                    setStartAtGpsPending(false);
                  }}
                  onSwitchToManualEntry={() => setMapMode('coordinates')}
                />
              </VergeMap>
            ) : (
              <p className="text-sm text-slate-600">
                Coordinate entry is in the “New segment” form below — open it with “Add a segment”.
                The map is the faster way: tap “Draw on map”, then tap the map to place points.
              </p>
            )}
            {geo.error && <Alert variant="error">{geo.error}</Alert>}
            <p className="text-xs text-slate-600">
              Tap a saved verge on the map to select it. Map tiles are from OpenStreetMap; if tiles
              fail to load, a fallback map style is used automatically.
            </p>
          </section>

          <section aria-labelledby="segments-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="segments-heading" className="text-lg font-bold text-slate-900">
                Your verge segments ({segments.length})
              </h2>
              <Button type="button" onClick={() => setShowSegmentForm((v) => !v)}>
                {showSegmentForm ? 'Hide segment form' : 'Add a segment'}
              </Button>
            </div>

            {segments.length === 0 && !showSegmentForm && (
              <Alert variant="info">
                No segments yet. Add your first segment with start and end coordinates below.
              </Alert>
            )}

            {segments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map((segment) => {
                  const latest = latestBySegment.get(segment.id);
                  const score = latest ? scoreForObservation(latest, INDICATOR_SPECIES) : null;
                  const isSelected = selectedSegment?.id === segment.id;
                  return (
                    <Card key={segment.id} className={isSelected ? 'ring-2 ring-emerald-700' : ''}>
                      <CardHeader>
                        <CardTitle>{segmentLabel(segment)}</CardTitle>
                        <CardDescription>
                          Road class {segment.roadClass} · {segment.setting} · Width{' '}
                          {WIDTH_LABELS[segment.widthBand] ?? segment.widthBand}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(segment.soilType ||
                          segment.slope ||
                          segment.shade ||
                          segment.footwayPresence !== undefined ||
                          segment.sightlineSplay !== undefined) && (
                          <p className="text-sm text-slate-600">
                            {segment.soilType ? `Soil: ${segment.soilType}. ` : ''}
                            {segment.slope ? `Slope: ${segment.slope}. ` : ''}
                            {segment.shade ? `Shade: ${segment.shade}. ` : ''}
                            {segment.footwayPresence !== undefined
                              ? `Footway: ${segment.footwayPresence ? 'present' : 'absent'}. `
                              : ''}
                            {segment.sightlineSplay !== undefined
                              ? `Sightline splay: ${segment.sightlineSplay ? 'yes' : 'no'}.`
                              : ''}
                          </p>
                        )}
                        {score ? (
                          <p className="text-sm">
                            Latest score:{' '}
                            <strong>
                              {score.finalScore}/100 — {score.tierLabel}
                            </strong>{' '}
                            <Badge
                              variant={
                                score.tier === 'expert_review'
                                  ? 'tier-expert'
                                  : score.tier === 'promising'
                                    ? 'tier-promising'
                                    : 'tier-ordinary'
                              }
                            />
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600">No observation recorded yet.</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={isSelected ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedSegmentId(segment.id)}
                          >
                            {isSelected ? 'Selected' : 'Select for survey'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => startEditSegment(segment)}
                          >
                            Edit segment
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void handleDeleteSegment(segment.id)}
                          >
                            Delete segment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {editingSegmentId && (
            <section aria-labelledby="edit-segment-heading" className="space-y-4">
              <h2 id="edit-segment-heading" className="text-lg font-bold text-slate-900">
                Edit segment
              </h2>
              <form
                onSubmit={handleUpdateSegment}
                className="bg-white p-6 rounded-lg border border-slate-200 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="edit-road-name"
                    label="Road name (optional)"
                    value={editRoadName}
                    onChange={(e) => setEditRoadName(e.target.value)}
                  />
                  <Select
                    id="edit-road-class"
                    label="Road class"
                    value={editRoadClass}
                    onChange={(e) => setEditRoadClass(e.target.value as RoadClass)}
                    options={[
                      { value: 'A', label: 'A road' },
                      { value: 'B', label: 'B road' },
                      { value: 'C', label: 'C road' },
                      { value: 'U', label: 'Unclassified' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                    required
                  />
                  <Select
                    id="edit-setting"
                    label="Setting"
                    value={editSetting}
                    onChange={(e) => setEditSetting(e.target.value as Setting)}
                    options={[
                      { value: 'rural', label: 'Rural' },
                      { value: 'urban', label: 'Urban' },
                    ]}
                    required
                  />
                  <Select
                    id="edit-width-band"
                    label="Verge width"
                    value={editWidthBand}
                    onChange={(e) => setEditWidthBand(e.target.value as WidthBand)}
                    options={[
                      { value: 'lt1_5', label: 'Under 1.5 m' },
                      { value: '1_5_to_3', label: '1.5–3 m' },
                      { value: 'gt3', label: 'Over 3 m' },
                    ]}
                    required
                  />
                  <Select
                    id="edit-side"
                    label="Side of road"
                    value={editSide}
                    onChange={(e) => setEditSide(e.target.value as Side)}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                      { value: 'both', label: 'Both sides' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                    required
                  />
                  <Input
                    id="edit-soil-type"
                    label="Soil type (optional)"
                    placeholder="e.g. clay, chalk, sandy"
                    value={editSoilType}
                    onChange={(e) => setEditSoilType(e.target.value)}
                  />
                  <Select
                    id="edit-slope"
                    label="Slope (optional)"
                    value={editSlope}
                    onChange={(e) => setEditSlope(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'flat', label: 'Flat' },
                      { value: 'gentle', label: 'Gentle' },
                      { value: 'steep', label: 'Steep' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                  />
                  <Select
                    id="edit-shade"
                    label="Shade (optional)"
                    value={editShade}
                    onChange={(e) => setEditShade(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'open', label: 'Open' },
                      { value: 'partial', label: 'Partial shade' },
                      { value: 'shaded', label: 'Shaded' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                  />
                  <Select
                    id="edit-footway"
                    label="Footway present (optional)"
                    value={editFootway}
                    onChange={(e) => setEditFootway(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                  <Select
                    id="edit-splay"
                    label="Sightline splay present (optional)"
                    value={editSplay}
                    onChange={(e) => setEditSplay(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save segment changes</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingSegmentId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </section>
          )}

          {showSegmentForm && (
            <section aria-labelledby="new-segment-heading" className="space-y-4">
              <h2 id="new-segment-heading" className="text-lg font-bold text-slate-900">
                New segment
              </h2>
              {mapMode === 'coordinates' ? (
                <CoordinateEntryForm
                  onSave={(result) => setGeometry(result)}
                  onCancel={() => {
                    setGeometry(null);
                    setShowSegmentForm(false);
                  }}
                />
              ) : (
                <Alert variant="info">
                  Draw the segment on the map above (Draw Verge Segment, then Complete Segment), or
                  switch to “Enter coordinates” at the top of the map to type coordinates instead.
                </Alert>
              )}
              {geometry && (
                <p className="text-sm text-emerald-800" role="status">
                  Geometry confirmed: {geometry.lengthM} m. Fill in the road details and save.
                </p>
              )}
              <form
                onSubmit={handleCreateSegment}
                className="bg-white p-6 rounded-lg border border-slate-200 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="road-name"
                    label="Road name (optional)"
                    placeholder="e.g. Church Lane"
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                  />
                  <Select
                    id="road-class"
                    label="Road class"
                    value={roadClass}
                    onChange={(e) => setRoadClass(e.target.value as RoadClass)}
                    options={[
                      { value: 'A', label: 'A road' },
                      { value: 'B', label: 'B road' },
                      { value: 'C', label: 'C road' },
                      { value: 'U', label: 'Unclassified' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                    required
                  />
                  <Select
                    id="setting"
                    label="Setting"
                    value={setting}
                    onChange={(e) => setSetting(e.target.value as Setting)}
                    options={[
                      { value: 'rural', label: 'Rural' },
                      { value: 'urban', label: 'Urban' },
                    ]}
                    required
                  />
                  <Select
                    id="width-band"
                    label="Verge width"
                    value={widthBand}
                    onChange={(e) => setWidthBand(e.target.value as WidthBand)}
                    options={[
                      { value: 'lt1_5', label: 'Under 1.5 m' },
                      { value: '1_5_to_3', label: '1.5–3 m' },
                      { value: 'gt3', label: 'Over 3 m' },
                    ]}
                    required
                  />
                  <Select
                    id="side"
                    label="Side of road"
                    value={side}
                    onChange={(e) => setSide(e.target.value as Side)}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                      { value: 'both', label: 'Both sides' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                    required
                  />
                  <Input
                    id="soil-type"
                    label="Soil type (optional)"
                    placeholder="e.g. clay, chalk, sandy"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                  />
                  <Select
                    id="slope"
                    label="Slope (optional)"
                    value={slope}
                    onChange={(e) => setSlope(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'flat', label: 'Flat' },
                      { value: 'gentle', label: 'Gentle' },
                      { value: 'steep', label: 'Steep' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                  />
                  <Select
                    id="shade"
                    label="Shade (optional)"
                    value={shade}
                    onChange={(e) => setShade(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'open', label: 'Open' },
                      { value: 'partial', label: 'Partial shade' },
                      { value: 'shaded', label: 'Shaded' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                  />
                  <Select
                    id="footway-presence"
                    label="Footway present (optional)"
                    value={footwayPresence}
                    onChange={(e) => setFootwayPresence(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                  <Select
                    id="sightline-splay"
                    label="Sightline splay present (optional)"
                    value={sightlineSplay}
                    onChange={(e) => setSightlineSplay(e.target.value)}
                    options={[
                      { value: '', label: 'Not recorded' },
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                </div>
                <Button type="submit" disabled={!geometry}>
                  Save segment
                </Button>
                {!geometry && (
                  <p className="text-xs text-slate-600">
                    Confirm the coordinates above first — the form needs a checked length of 5–500
                    m.
                  </p>
                )}
              </form>
            </section>
          )}

          {selectedSegment && (
            <section aria-labelledby="observation-heading" className="space-y-4">
              <h2 id="observation-heading" className="text-lg font-bold text-slate-900">
                Add an observation — {segmentLabel(selectedSegment)}
              </h2>
              <Alert variant="warning">
                <p>Reminder for every survey: {SAFETY_COPY}</p>
              </Alert>
              {hasSensitiveTaxa(INDICATOR_SPECIES, [...indicatorIds, ...nutrientIds]) && (
                <Alert variant="warning" title="Sensitive species selected">
                  <p>
                    A sensitive species (or orchid) is selected. Public exports coarsen its location
                    to 1 km, so its precise location is never shown publicly.
                  </p>
                </Alert>
              )}
              <form
                onSubmit={handleCreateObservation}
                className="bg-white p-6 rounded-lg border border-slate-200 space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    id="forb-band"
                    label="How many forb (wildflower) species did you see?"
                    value={forbBand}
                    onChange={(e) => setForbBand(e.target.value as ForbCountBand)}
                    options={Object.entries(FORB_BAND_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    required
                  />
                  <Select
                    id="sward"
                    label="Sward structure"
                    value={sward}
                    onChange={(e) => setSward(e.target.value as SwardStructure)}
                    options={Object.entries(SWARD_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    required
                  />
                  <Select
                    id="cut-state"
                    label="Cut state"
                    value={cutState}
                    onChange={(e) => setCutState(e.target.value as CutState)}
                    options={[
                      { value: 'uncut', label: 'Uncut' },
                      { value: 'cut_recent', label: 'Cut recently' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                    required
                  />
                  <Select
                    id="cuttings-state"
                    label="Cuttings"
                    value={cuttingsState}
                    onChange={(e) => setCuttingsState(e.target.value as CuttingsState)}
                    options={[
                      { value: 'removed', label: 'Removed from site' },
                      { value: 'left', label: 'Left on site' },
                      { value: 'na', label: 'Not applicable / unknown' },
                    ]}
                    required
                  />
                  <Input
                    id="last-cut-month"
                    label="Last cut month (1–12, optional)"
                    type="number"
                    min={1}
                    max={12}
                    placeholder="Leave blank if unknown"
                    value={lastCutMonth}
                    onChange={(e) => setLastCutMonth(e.target.value)}
                  />
                  <Input
                    id="notes"
                    label="Notes (optional, max 1000 characters)"
                    placeholder="e.g. Wide verge, hedge at back"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-800">
                    Indicator species seen (tick all that apply)
                  </legend>
                  <p className="text-xs text-slate-600">
                    Sensitive species such as orchids are recorded here but are never shown at
                    precise location in a public export.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {POSITIVE_INDICATORS.map((species) => (
                      <label key={species.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={indicatorIds.includes(species.id)}
                          onChange={() => setIndicatorIds((ids) => toggleId(ids, species.id))}
                        />
                        <span>
                          {species.commonName}{' '}
                          <span className="text-slate-500">({species.scientificName})</span>
                          {species.sensitive && (
                            <span className="text-amber-800"> · sensitive</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-800">
                    Nutrient-loving dominants (tick all that apply)
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {NUTRIENT_DOMINANTS.map((species) => (
                      <label key={species.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={nutrientIds.includes(species.id)}
                          onChange={() => setNutrientIds((ids) => toggleId(ids, species.id))}
                        />
                        <span>
                          {species.commonName}{' '}
                          <span className="text-slate-500">({species.scientificName})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-800">
                    Photos (optional, max 3 per observation)
                  </legend>
                  <p className="text-xs text-slate-600">
                    Photos are stored locally only. EXIF location data is stripped on processing and
                    on export.
                  </p>
                  <label
                    className="block text-sm font-semibold text-slate-800"
                    htmlFor="observation-photos"
                  >
                    Take a photo or choose files
                  </label>
                  <input
                    id="observation-photos"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="block w-full text-sm text-slate-700"
                    onChange={(e) => void handlePhotoSelect(e.target.files)}
                  />
                  {pendingPhotos.length > 0 && (
                    <ul className="space-y-1 text-sm">
                      {pendingPhotos.map((photo, index) => (
                        <li
                          key={`${photo.name}-${index}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>
                            {photo.name} — will be attached when you save this observation.
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setPendingPhotos((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </fieldset>

                <Button type="submit">Save observation and score it</Button>
              </form>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Observations for this segment ({selectedObservations.length})
                </h3>
                {selectedObservations.length === 0 && (
                  <p className="text-sm text-slate-600">No observations yet for this segment.</p>
                )}
                {selectedObservations.map((obs) => {
                  const score = scoreForObservation(obs, INDICATOR_SPECIES);
                  return (
                    <Card key={obs.id}>
                      <CardHeader>
                        <CardTitle>
                          {new Date(obs.observedAt).toLocaleString()} —{' '}
                          {score ? `${score.finalScore}/100 — ${score.tierLabel}` : 'Not scored'}
                        </CardTitle>
                        <CardDescription>
                          {FORB_BAND_LABELS[obs.forbCountBand] ?? obs.forbCountBand} ·{' '}
                          {SWARD_LABELS[obs.swardStructure] ?? obs.swardStructure} · Confidence:{' '}
                          {score?.confidence ?? 'unknown'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          Indicators:{' '}
                          {obs.indicatorIds
                            .map((id) => indicatorById(INDICATOR_SPECIES, id)?.commonName ?? id)
                            .join(', ') || 'none recorded'}
                        </p>
                        <p>
                          Nutrient dominants:{' '}
                          {obs.nutrientDominantIds
                            .map((id) => indicatorById(INDICATOR_SPECIES, id)?.commonName ?? id)
                            .join(', ') || 'none recorded'}
                        </p>
                        {obs.notes && <p>Notes: {obs.notes}</p>}
                        <p>
                          Photos: {photoCounts[obs.id] ?? 0} of 3 (stored locally only; EXIF
                          stripped on processing and on export).
                        </p>
                        <label
                          className="block text-sm font-semibold text-slate-800"
                          htmlFor={`photos-${obs.id}`}
                        >
                          Add photos to this observation (max 3 in total)
                        </label>
                        <input
                          id={`photos-${obs.id}`}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          className="block w-full text-sm text-slate-700"
                          onChange={(e) =>
                            void handleAddPhotosToObservation(obs.id, e.target.files)
                          }
                        />
                        {score && (
                          <>
                            <ul className="list-disc pl-5 space-y-1">
                              {score.breakdown.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                            <p className="text-xs text-slate-600">{score.disclaimer}</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
