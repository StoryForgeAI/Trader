import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Scan Sell AI',
};

export default function TermsPage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="glass rounded-[2.2rem] px-6 py-7 shadow-[0_22px_74px_rgba(15,23,42,0.08)] sm:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Scan Sell AI
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-2)] sm:text-base">
            By using Scan Sell AI, you agree to use the service lawfully, provide accurate account information, and avoid misuse, abuse, scraping, reverse engineering, or attempts to disrupt the platform.
          </p>

          <div className="mt-8 space-y-4">
            <PolicyBlock
              title="Service use"
              body="You may use the service for product research, resell planning, and related business workflows. You are responsible for how you use the results, pricing ideas, and generated copy."
            />
            <PolicyBlock
              title="Accounts and access"
              body="You are responsible for keeping your login secure and for all activity that happens through your account."
            />
            <PolicyBlock
              title="Credits and availability"
              body="Credits, features, and availability may change over time. We may update, improve, limit, or discontinue parts of the service when needed."
            />
            <PolicyBlock
              title="Third-party services"
              body="Scan Sell AI uses Supabase and Vercel. Because of that, some account, usage, and app data may be processed, stored, or transmitted through third-party infrastructure providers."
            />
            <PolicyBlock
              title="No guarantee"
              body="The service provides helpful estimates and guidance, but it does not guarantee resale demand, market fit, profit, pricing accuracy, or business outcomes."
            />
          </div>

          <div className="mt-8">
            <Link
              href="/auth"
              className="btn-primary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition hover:translate-y-[-1px]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function PolicyBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="surface-soft rounded-[1.5rem] p-5">
      <h2 className="font-display text-xl font-semibold text-[var(--text-1)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--text-2)]">{body}</p>
    </section>
  );
}
