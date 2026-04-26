import { Suspense } from 'react';

import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4fbff] text-slate-900">
          Loading Scan Sell AI dashboard...
        </div>
      }
    >
      <div data-dashboard-version="scan-sell-ai-v1">
        <DashboardShell />
      </div>
    </Suspense>
  );
}
