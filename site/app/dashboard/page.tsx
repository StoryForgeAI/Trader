import { Suspense } from 'react';

import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-[var(--text-1)]">
          <div className="float-orb absolute -left-16 top-20 h-48 w-48 rounded-full bg-[var(--accent-soft)] blur-3xl" />
          <div className="float-orb-delayed absolute right-[-4rem] top-28 h-72 w-72 rounded-full bg-[var(--sky-soft)] blur-3xl" />
          <div className="surface-strong rounded-[1.8rem] px-6 py-5 text-sm font-semibold shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
            Loading Scan Sell AI dashboard...
          </div>
        </div>
      }
    >
      <div data-dashboard-version="scan-sell-ai-v1">
        <DashboardShell />
      </div>
    </Suspense>
  );
}
