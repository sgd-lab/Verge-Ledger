import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import {
  simulateCutDrop,
  type SimulationResult,
  type SimulatorTier,
} from '@verge-ledger/core';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { monthName } from '../lib/pageData';

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function SimulatorPage(): React.ReactElement {
  const [scheduleMonths, setScheduleMonths] = useState<number[]>([5, 7, 9]);
  const [safetyMonths, setSafetyMonths] = useState<number[]>([5]);
  const [tier, setTier] = useState<SimulatorTier>('ordinary');
  const [cuttingsRemovable, setCuttingsRemovable] = useState<'yes' | 'no' | 'unknown'>('unknown');
  const [cutsToRemove, setCutsToRemove] = useState(1);
  const [costPerCutPerKm, setCostPerCutPerKm] = useState('');
  const [fuelPerCutPerKm, setFuelPerCutPerKm] = useState('');
  const [kmOfRoad, setKmOfRoad] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleMonth = (month: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(month) ? list.filter((m) => m !== month) : [...list, month].sort());
  };

  const handleRun = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (scheduleMonths.length === 0) {
      setError('Add at least one cut to the current schedule.');
      return;
    }
    if (cutsToRemove < 1 || cutsToRemove > scheduleMonths.length) {
      setError('Cuts to remove must be between 1 and the number of cuts in the schedule.');
      return;
    }
    try {
      const currentCuts = scheduleMonths.map((month) => ({
        id: `month-${month}`,
        month,
        label: monthName(month),
        safetyCritical: safetyMonths.includes(month),
      }));
      const costInputs =
        costPerCutPerKm || fuelPerCutPerKm || kmOfRoad
          ? {
              ...(costPerCutPerKm ? { costPerCutPerKm: Number(costPerCutPerKm) } : {}),
              ...(fuelPerCutPerKm ? { fuelLitersPerCutPerKm: Number(fuelPerCutPerKm) } : {}),
              ...(kmOfRoad ? { kmOfRoad: Number(kmOfRoad) } : {}),
            }
          : undefined;
      setResult(
        simulateCutDrop({
          currentCuts,
          tier,
          cuttingsRemovable,
          cutsToRemove,
          ...(costInputs ? { costInputs } : {}),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not run the simulation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Which Cut Should We Drop? Scenario Simulator</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Rank which cuts to drop against wildflower-verge guidance. Safety-critical cuts are
          locked in and can never be dropped. This does not assess road safety — visibility cuts
          stay.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form
        onSubmit={handleRun}
        className="bg-white p-6 rounded-lg border border-slate-200 space-y-6"
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-800">
            Current annual cut schedule
          </legend>
          <p className="text-xs text-slate-600">
            Tick the months currently cut. For each cut month, tick “safety-critical” if it is a
            visibility or junction cut — those are never offered as cuts to drop.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_MONTHS.map((month) => (
              <div key={month} className="border border-slate-200 rounded-md p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={scheduleMonths.includes(month)}
                    onChange={() => toggleMonth(month, scheduleMonths, setScheduleMonths)}
                  />
                  {monthName(month)}
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 pl-6">
                  <input
                    type="checkbox"
                    disabled={!scheduleMonths.includes(month)}
                    checked={safetyMonths.includes(month)}
                    onChange={() => toggleMonth(month, safetyMonths, setSafetyMonths)}
                  />
                  Safety-critical
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="sim-tier"
            label="Verge tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as SimulatorTier)}
            options={[
              { value: 'ordinary', label: 'Ordinary verge' },
              { value: 'promising', label: 'Promising verge' },
              { value: 'expert_review', label: 'Refer for expert review' },
              { value: 'unknown', label: 'Unknown' },
            ]}
            required
          />
          <Select
            id="sim-cuttings"
            label="Can cuttings be removed?"
            value={cuttingsRemovable}
            onChange={(e) => setCuttingsRemovable(e.target.value as 'yes' | 'no' | 'unknown')}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'Unknown' },
            ]}
            required
          />
          <Input
            id="sim-cuts-to-remove"
            label="Cuts to remove"
            type="number"
            min={1}
            max={10}
            value={cutsToRemove}
            onChange={(e) => setCutsToRemove(Number(e.target.value))}
            required
          />
          <Input
            id="sim-km"
            label="Road length in km (optional, for savings)"
            type="number"
            min={0}
            step="0.1"
            placeholder="Leave blank if unknown"
            value={kmOfRoad}
            onChange={(e) => setKmOfRoad(e.target.value)}
          />
          <Input
            id="sim-cost"
            label="Cost per cut per km in £ (optional)"
            type="number"
            min={0}
            step="0.01"
            placeholder="Leave blank if unknown"
            value={costPerCutPerKm}
            onChange={(e) => setCostPerCutPerKm(e.target.value)}
          />
          <Input
            id="sim-fuel"
            label="Fuel litres per cut per km (optional)"
            type="number"
            min={0}
            step="0.01"
            placeholder="Leave blank if unknown"
            value={fuelPerCutPerKm}
            onChange={(e) => setFuelPerCutPerKm(e.target.value)}
          />
        </div>
        <Button type="submit">Rank cut-drop options</Button>
      </form>

      {result && (
        <section aria-labelledby="sim-results-heading" className="space-y-4">
          <h2 id="sim-results-heading" className="text-lg font-bold text-slate-900">
            Results — {result.summaryMessage}
          </h2>
          <Alert variant="warning">{result.safetyDisclaimer}</Alert>
          {result.status === 'no_valid_options' && (
            <Alert variant="error">
              No option meets guidance; consider alternatives. Safety-critical cuts stay, and for
              Promising or Refer-for-review verges at least one August or September cut must
              remain.
            </Alert>
          )}
          {result.options.map((option) => {
            const savings = option.savings;
            return (
              <Card key={option.rank}>
                <CardHeader>
                  <CardTitle>
                    Rank {option.rank} — {option.recommended ? 'Recommended' : 'Not recommended'}
                  </CardTitle>
                  <CardDescription>{option.recommendationReason}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Drop: {option.cutsDropped.map((c) => monthName(c.month)).join(', ') || 'none'}
                  </p>
                  <p>
                    Remaining: {option.remainingCuts.map((c) => monthName(c.month)).join(', ')}
                  </p>
                  <p>Alignment lost by dropping: {option.sumAlignmentRemoved}</p>
                  {option.warnings.map((warning) => (
                    <p key={warning} className="text-amber-900">
                      Warning: {warning}
                    </p>
                  ))}
                  {savings && (
                    <p>
                      Indicative savings:{' '}
                      {savings.costSavedGbp !== undefined && `£${savings.costSavedGbp.toFixed(2)} · `}
                      {savings.fuelSavedLitres !== undefined &&
                        `${savings.fuelSavedLitres.toFixed(1)} litres fuel · `}
                      {savings.carbonSavedKg !== undefined &&
                        `${savings.carbonSavedKg.toFixed(1)} kg CO₂ · `}
                      {savings.operationalReductionPercent}% fewer cuts. {savings.label}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
