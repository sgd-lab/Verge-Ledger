import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Compass, Calculator, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { loadDemoWorkspace } from '../lib/demo';

export function HomePage(): React.ReactElement {
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLoadDemo = async () => {
    setDemoMessage(null);
    setDemoError(null);
    setDemoLoading(true);
    try {
      const workspace = await loadDemoWorkspace();
      setDemoMessage(
        `Demo workspace “${workspace.name}” loaded with synthetic segments. Demo data is labelled DEMO and excluded from impact counters.`,
      );
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Could not load the demo workspace.');
    } finally {
      setDemoLoading(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-emerald-900 text-white rounded-2xl p-8 sm:p-12 shadow-md">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-semibold">
            <Sprout className="h-4 w-4" aria-hidden="true" />
            Parish Council & Volunteer Habitat Toolkit
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Verge Ledger</h1>
          <p className="text-lg text-emerald-100 leading-relaxed">
            Evidence-based road verge habitat triage, cut-timing guidance, and scenario simulation
            for England. Completely offline-first and open source.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link to="/survey">
              <Button
                size="lg"
                className="bg-white text-emerald-900 hover:bg-emerald-50 focus-visible:ring-white"
              >
                <span>Start Verge Survey</span>
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/advisor">
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-300 text-emerald-100 hover:bg-emerald-800"
              >
                <span>Cut-Timing Advisor</span>
              </Button>
            </Link>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="border-emerald-300 text-emerald-100 hover:bg-emerald-800"
              onClick={() => void handleLoadDemo()}
              disabled={demoLoading}
            >
              <span>{demoLoading ? 'Loading demo…' : 'Load demo workspace'}</span>
            </Button>
          </div>
          {demoMessage && <Alert variant="success">{demoMessage}</Alert>}
          {demoError && <Alert variant="error">{demoError}</Alert>}
        </div>
      </section>

      {/* Toolkit Features Grid */}
      <section aria-labelledby="features-heading" className="space-y-4">
        <h2 id="features-heading" className="text-xl font-bold text-slate-900">
          Decision Support Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg w-fit mb-2">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>5-Minute Survey</CardTitle>
              <CardDescription>
                Fast, mobile-first survey workflow to record botanical diversity, structural height,
                and positive indicators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/survey"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Begin survey <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg w-fit mb-2">
                <Sprout className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>Cut-Timing Advisor</CardTitle>
              <CardDescription>
                Tailored mowing regimes (R1, RA, RB, RU) aligning with Plantlife guidelines and
                Highway Safety sightline rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/advisor"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Consult advisor <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg w-fit mb-2">
                <Calculator className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>Cut-Drop Simulator</CardTitle>
              <CardDescription>
                Quantify fuel savings, expenditure cuts, and carbon emissions avoided by dropping
                non-essential mowing passes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/simulator"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Run simulation <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Safety Reminder */}
      <section
        aria-labelledby="safety-heading"
        className="bg-amber-50 border border-amber-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 id="safety-heading" className="text-base font-bold text-amber-950">
              Surveyor Safety Protocol
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed">
              Always survey in daylight with high-visibility clothing. Stay on pedestrian verges or
              footways. Never survey high-speed dual carriageways or motorways. Visibility
              sightlines at junctions (1.0 m – 1.2 m height) must remain uncompromised.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
