import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { generateFoiRequest, type FoiPreset } from '@verge-ledger/core';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Alert } from '../components/ui/Alert';
import { db } from '../db/schema';
import { generateUlid } from '../lib/id';
import { useSurveyData } from '../hooks/useSurveyData';
import {
  councilFactRecordFromForm,
  validateCouncilFactForm,
  type CouncilFactForm,
} from '../lib/pageData';

const EMPTY_FORM: CouncilFactForm = {
  authorityName: '',
  councilId: '',
  tier: 'county',
  policyType: 'rural',
  key: 'ruralCutsPerYear',
  value: '',
  sourceUrl: '',
  sourceRetrievedAt: '',
  status: 'unverified',
};

const FACT_KEYS = [
  'ruralCutsPerYear',
  'urbanCutsPerYear',
  'firstCutMonth',
  'cuttingsPolicy',
  'designatedScheme',
  'designatedCount',
  'designatedLengthKm',
  'other',
];

export function CouncilsPage(): React.ReactElement {
  const { councilFacts } = useSurveyData();
  const [form, setForm] = useState<CouncilFactForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [councilName, setCouncilName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [preset, setPreset] = useState<FoiPreset>('canonical');
  const [foiOutput, setFoiOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateForm = (patch: Partial<CouncilFactForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleAddFact = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateCouncilFactForm(form);
    setFormErrors(errors);
    setSavedMessage(null);
    if (errors.length > 0) return;
    await db.councilFacts.add(councilFactRecordFromForm(form, generateUlid()));
    setForm(EMPTY_FORM);
    setSavedMessage('Council fact saved. It is stored locally only, with its source.');
  };

  const handleGenerateFoi = (event: React.FormEvent) => {
    event.preventDefault();
    setCopied(false);
    setFoiOutput(
      generateFoiRequest({
        councilName: councilName.trim(),
        requesterName: requesterName.trim() ? requesterName.trim() : undefined,
        preset,
      }),
    );
  };

  const handleCopy = async () => {
    if (!foiOutput) return;
    try {
      await navigator.clipboard.writeText(foiOutput);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>English Highway Authorities & Council Registry</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Facts you add here are stored locally only. Every fact must carry its source web address
          and the date you retrieved it. Unknown stays unknown — nothing here is pre-filled with
          council data.
        </p>
      </div>

      {savedMessage && <Alert variant="success">{savedMessage}</Alert>}

      <section aria-labelledby="facts-heading" className="space-y-4">
        <h2 id="facts-heading" className="text-lg font-bold text-slate-900">
          Council facts you have added ({councilFacts.length})
        </h2>
        {councilFacts.length === 0 ? (
          <Alert variant="info">
            No council facts have been added yet. Add one below with its source, or use the
            request builder to ask a council for its verge information.
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {councilFacts.map((fact) => (
              <Card key={fact.id}>
                <CardHeader>
                  <CardTitle>{fact.authorityName}</CardTitle>
                  <CardDescription>
                    {fact.tier} · {fact.policyType} · {fact.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>{fact.key}:</strong> {String(fact.value)}
                  </p>
                  <p>
                    Source:{' '}
                    <a
                      href={fact.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 underline break-all"
                    >
                      {fact.sourceUrl}
                    </a>{' '}
                    (retrieved {fact.sourceRetrievedAt})
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="add-fact-heading" className="space-y-4">
        <h2 id="add-fact-heading" className="text-lg font-bold text-slate-900">
          Add a council fact
        </h2>
        {formErrors.length > 0 && (
          <Alert variant="error">
            <ul className="list-disc pl-5">
              {formErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </Alert>
        )}
        <form
          onSubmit={handleAddFact}
          className="bg-white p-6 rounded-lg border border-slate-200 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="fact-authority"
              label="Authority name"
              placeholder="e.g. Example County Council"
              value={form.authorityName}
              onChange={(e) => updateForm({ authorityName: e.target.value })}
              required
            />
            <Input
              id="fact-council-id"
              label="Council ID"
              placeholder="A short ID you use for this council"
              value={form.councilId}
              onChange={(e) => updateForm({ councilId: e.target.value })}
              required
            />
            <Select
              id="fact-tier"
              label="Tier"
              value={form.tier}
              onChange={(e) => updateForm({ tier: e.target.value })}
              options={[
                { value: 'county', label: 'County' },
                { value: 'unitary', label: 'Unitary' },
                { value: 'district', label: 'District' },
                { value: 'parish', label: 'Parish' },
              ]}
              required
            />
            <Select
              id="fact-policy-type"
              label="Policy type"
              value={form.policyType}
              onChange={(e) => updateForm({ policyType: e.target.value })}
              options={[
                { value: 'rural', label: 'Rural' },
                { value: 'urban', label: 'Urban' },
                { value: 'safety', label: 'Safety' },
                { value: 'designated', label: 'Designated' },
              ]}
              required
            />
            <Select
              id="fact-key"
              label="Fact key"
              value={form.key}
              onChange={(e) => updateForm({ key: e.target.value })}
              options={FACT_KEYS.map((key) => ({ value: key, label: key }))}
              required
            />
            <Input
              id="fact-value"
              label="Fact value"
              placeholder="e.g. 2, or the policy wording"
              value={form.value}
              onChange={(e) => updateForm({ value: e.target.value })}
              required
            />
            <Input
              id="fact-source-url"
              label="Source URL"
              type="url"
              placeholder="https://…"
              value={form.sourceUrl}
              onChange={(e) => updateForm({ sourceUrl: e.target.value })}
              required
            />
            <Input
              id="fact-source-date"
              label="Source retrieved date"
              type="date"
              value={form.sourceRetrievedAt}
              onChange={(e) => updateForm({ sourceRetrievedAt: e.target.value })}
              required
            />
            <Select
              id="fact-status"
              label="Status"
              value={form.status}
              onChange={(e) => updateForm({ status: e.target.value })}
              options={[
                { value: 'unverified', label: 'Unverified' },
                { value: 'verified', label: 'Verified' },
              ]}
              required
            />
          </div>
          <Button type="submit">Save council fact</Button>
        </form>
      </section>

      <section aria-labelledby="foi-heading" className="space-y-4">
        <h2 id="foi-heading" className="text-lg font-bold text-slate-900">
          Freedom of Information / Environmental Information request builder
        </h2>
        <p className="text-sm text-slate-600">
          This builds a letter, it does not send anything. Check the council&apos;s publication
          scheme and FOI contact address before sending. This is not legal advice.
        </p>
        <form
          onSubmit={handleGenerateFoi}
          className="bg-white p-6 rounded-lg border border-slate-200 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="foi-council"
              label="Council name"
              placeholder="e.g. Example County Council"
              value={councilName}
              onChange={(e) => setCouncilName(e.target.value)}
              required
            />
            <Input
              id="foi-requester"
              label="Your name (optional)"
              placeholder="Leave blank to use a placeholder"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
            />
            <Select
              id="foi-preset"
              label="Question set"
              value={preset}
              onChange={(e) => setPreset(e.target.value as FoiPreset)}
              options={[
                { value: 'canonical', label: 'Standard questions' },
                { value: 'ecological', label: 'Ecological questions' },
                { value: 'comprehensive', label: 'Comprehensive questions' },
              ]}
              required
            />
          </div>
          <Button type="submit">Generate request letter</Button>
        </form>
        {foiOutput && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Your request letter</h3>
              <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy letter'}
              </Button>
            </div>
            <textarea
              aria-label="Generated request letter"
              readOnly
              rows={24}
              className="w-full p-4 text-sm rounded-md bg-white border border-slate-300"
              value={foiOutput}
            />
          </div>
        )}
      </section>
    </div>
  );
}
