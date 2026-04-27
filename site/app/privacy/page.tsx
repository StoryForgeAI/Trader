import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Scan Sell AI',
};

export default function PrivacyPage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="glass rounded-[2.2rem] px-6 py-7 shadow-[0_22px_74px_rgba(15,23,42,0.08)] sm:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Scan Sell AI
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-2)] sm:text-base">
            This page explains what data Scan Sell AI may handle and how that data may be used to provide account access, app functionality, product analysis, and chat features.
          </p>

          <div className="mt-8 space-y-4">
            <PolicyBlock
              title="What data may be collected"
              body="We may process account details such as your email address, authentication data, usage activity, uploaded product images, product text inputs, chat prompts, generated outputs, and credit-related events."
            />
            <PolicyBlock
              title="Why data is used"
              body="Your data may be used to authenticate you, run the app, store your account state, process credits, save research history, and return product or chat results."
            />
            <PolicyBlock
              title="Third-party processing"
              body="Scan Sell AI uses Supabase and Vercel. This means some personal or usage data may be stored, transmitted, logged, or processed by third-party infrastructure providers as part of delivering the service."
            />
            <PolicyBlock
              title="Uploads and generated content"
              body="Images, text prompts, and generated outputs may be stored to support app history, usability, debugging, and service continuity."
            />
            <PolicyBlock
              title="Your responsibility"
              body="Please avoid uploading sensitive personal data, confidential business information, or any content you do not want processed through the platform and its providers."
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
