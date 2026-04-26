import { AuthCard } from '@/components/auth-card';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthPage() {
  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
              Scan Sell AI
            </div>
            <div className="mt-1 text-sm text-stone-500">Account access</div>
          </div>
          <ThemeToggle />
        </div>

        <section className="rounded-[2.2rem] border border-sky-100 bg-white/90 p-5 shadow-[0_28px_100px_rgba(117,149,176,0.10)] backdrop-blur md:p-8">
          <AuthCard />
        </section>
      </div>
    </main>
  );
}
