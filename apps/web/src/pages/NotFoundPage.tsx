import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage(): React.ReactElement {
  return (
    <div className="py-16 text-center space-y-4 max-w-md mx-auto">
      <div className="bg-slate-100 text-slate-700 p-3 rounded-full w-fit mx-auto">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-600">The requested page does not exist or has been moved.</p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Return to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
