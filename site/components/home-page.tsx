'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeDollarSign,
  ImageUp,
  PackageSearch,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WandSparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { IMAGE_ANALYSIS_COST, TEXT_ANALYSIS_COST } from '@/lib/catalog';

const stats = [
  { label: 'Image scan', value: `${IMAGE_ANALYSIS_COST} credits` },
  { label: 'Text lookup', value: `${TEXT_ANALYSIS_COST} credits` },
  { label: 'Ideal flow', value: 'Phone first' },
  { label: 'Output', value: 'Price + angle' },
];

const featureCards = [
  {
    icon: <ImageUp size={18} />,
    title: 'Image-based product scan',
    body: 'Drop in a supplier image, marketplace screenshot, or product photo and get a fast resale breakdown.',
  },
  {
    icon: <SearchCheck size={18} />,
    title: 'Cheaper text lookup',
    body: 'Type a product name when you already know what you are researching and want to save credits.',
  },
  {
    icon: <BadgeDollarSign size={18} />,
    title: 'Built for resellers',
    body: 'It focuses on sellability, rough pricing, and quick listing hooks instead of bland generic copy.',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Bring a product idea',
    body: 'Start from a single image or just a product name when you want to move quickly.',
  },
  {
    step: '02',
    title: 'Get a usable market read',
    body: 'See product naming, rough price expectations, and the likely resale angle in one pass.',
  },
  {
    step: '03',
    title: 'Turn insight into action',
    body: 'Use the suggested value and ad hook to build a listing faster instead of researching from scratch.',
  },
];

const proofPoints = [
  {
    icon: <Zap size={16} />,
    label: 'Fast enough for daily product hunting',
  },
  {
    icon: <ShieldCheck size={16} />,
    label: 'Clean mobile-first flow',
  },
  {
    icon: <TrendingUp size={16} />,
    label: 'Made for quick resale decisions',
  },
];

export function HomePage() {
  const reducedMotion = useReducedMotion();

  function reveal(delay = 0, y = 28) {
    if (reducedMotion) {
      return {
        initial: false,
        whileInView: undefined,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      };
    }

    return {
      initial: { opacity: 0, y },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.25 },
      transition: { duration: 0.68, delay },
    };
  }

  const heroReveal = reducedMotion
    ? {
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.72 },
      };

  return (
    <main id="top" className="relative min-h-screen overflow-x-clip px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid-fade absolute inset-x-0 top-0 h-[34rem] opacity-70" />
        <div className="float-orb absolute -left-16 top-24 h-48 w-48 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="float-orb-delayed absolute right-[-4rem] top-36 h-72 w-72 rounded-full bg-[var(--sky-soft)] blur-3xl" />
        <div className="float-orb absolute bottom-10 left-1/3 h-44 w-44 rounded-full bg-[rgba(250,204,21,0.12)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <header className="glass mb-6 flex items-center justify-between rounded-[2rem] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-400 to-sky-400 text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)]">
              <PackageSearch size={22} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)] sm:text-sm">
                Scan Sell AI
              </div>
              <div className="truncate text-xs text-[var(--text-3)] sm:text-sm">
                AI resale research for product hunters and quick flips
              </div>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="glass panel-sheen relative overflow-hidden rounded-[2.6rem] px-5 py-7 shadow-[0_28px_120px_rgba(15,23,42,0.10)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,420px)] lg:items-center">
            <div>
              <motion.div
                {...heroReveal}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text-2)] shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              >
                <Sparkles size={16} className="shrink-0 text-[var(--accent)]" />
                <span className="truncate">Product photo in, resale plan out</span>
              </motion.div>

              <motion.h1
                {...(reducedMotion
                  ? heroReveal
                  : {
                      ...heroReveal,
                      transition: {
                        duration: 0.78,
                        delay: 0.08,
                      },
                    })}
                className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-[var(--text-1)] sm:text-5xl lg:text-7xl"
              >
                Stop guessing which products can sell.
                <span className="mt-2 block text-[var(--accent)]">Build a better flip faster.</span>
              </motion.h1>

              <motion.p
                {...(reducedMotion
                  ? heroReveal
                  : {
                      ...heroReveal,
                      transition: {
                        duration: 0.72,
                        delay: 0.16,
                      },
                    })}
                className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-2)] sm:text-lg sm:leading-8"
              >
                Scan Sell AI helps you identify products, estimate resale value, and turn a rough idea into a usable listing angle without wasting time on messy research.
              </motion.p>

              <motion.div
                {...(reducedMotion
                  ? heroReveal
                  : {
                      ...heroReveal,
                      transition: {
                        duration: 0.7,
                        delay: 0.24,
                      },
                    })}
                className="mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--text-1)] px-6 py-4 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-black/90"
                >
                  Start researching
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#tools"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-6 py-4 text-sm font-semibold text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
                >
                  Explore the workflow
                </a>
              </motion.div>

              <motion.div
                {...(reducedMotion
                  ? heroReveal
                  : {
                      ...heroReveal,
                      transition: {
                        duration: 0.72,
                        delay: 0.32,
                      },
                    })}
                className="mt-8 flex flex-wrap gap-3"
              >
                {proofPoints.map((point) => (
                  <div
                    key={point.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-2)]"
                  >
                    <span className="text-[var(--accent)]">{point.icon}</span>
                    <span>{point.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              {...(reducedMotion
                ? heroReveal
                : {
                    ...heroReveal,
                    transition: {
                      duration: 0.8,
                      delay: 0.22,
                    },
                  })}
              className="relative"
            >
              <div className="surface-strong relative rounded-[2rem] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-[var(--surface-soft)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">
                        Live workflow
                      </div>
                      <div className="mt-2 font-display text-2xl font-semibold text-[var(--text-1)]">
                        From photo to pricing angle
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[var(--success)]">
                      Ready now
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <PreviewBlock
                      icon={<ImageUp size={18} />}
                      title="Image to Analysis"
                      body="Upload a product image to get a cleaner name, a rough value, and a likely resale price range."
                    />
                    <PreviewBlock
                      icon={<SearchCheck size={18} />}
                      title="Text to Analysis"
                      body="Skip the upload when you already know the item name and just need a cheaper research pass."
                    />
                    <PreviewBlock
                      icon={<WandSparkles size={18} />}
                      title="Quick ad angle"
                      body="Use the positioning hints and pricing context to write listings with more confidence."
                    />
                  </div>

                  <div className="mt-5 rounded-[1.4rem] border border-[color:var(--line)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between text-sm text-[var(--text-2)]">
                      <span>Estimated resale window</span>
                      <span className="font-semibold text-[var(--text-1)]">$42 - $59</span>
                    </div>
                    <div className="mt-4 flex items-end gap-2">
                      <Bar height="h-14" tone="bg-slate-300/70" />
                      <Bar height="h-20" tone="bg-sky-300/80" />
                      <Bar height="h-24" tone="bg-orange-300/80" />
                      <Bar height="h-16" tone="bg-slate-300/70" />
                      <Bar height="h-28" tone="bg-[var(--accent)]" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">
                      <span>Demand</span>
                      <span>Margin</span>
                      <span>Listing hook</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 left-4 right-4 hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">
                    Faster decisions
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-2)]">
                    Better than bouncing between tabs and generic AI answers.
                  </div>
                </div>
                <div className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                  Built for mobile
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <motion.section
          {...reveal(0.04, 22)}
          className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => (
            <Metric key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </motion.section>

        <motion.section {...reveal(0.06)} id="tools" className="mt-8">
          <SectionHeading
            eyebrow="Core tools"
            title="Everything on the page now points toward action."
            body="The layout is cleaner, the hierarchy is stronger, and each section explains what the product actually does for a reseller."
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <motion.div key={feature.title} {...reveal(index * 0.06, 20)}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section {...reveal(0.1)} className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="surface-strong rounded-[2rem] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <SectionHeading
              eyebrow="Why it feels better"
              title="Less flat, more guided."
              body="Instead of one big block, the landing page now has visual pacing, focused messaging, and clear mobile breakpoints."
            />
            <div className="mt-6 space-y-4">
              <MiniPoint
                title="Sharper first impression"
                body="The new hero uses deeper layering, contrast, and typography so the page feels intentional the moment it opens."
              />
              <MiniPoint
                title="Better on small screens"
                body="Buttons stack, cards breathe more, and key content stays readable without awkward squeezing."
              />
              <MiniPoint
                title="Motion with restraint"
                body="Subtle reveal timing and floating background elements add polish without slowing the page down."
              />
            </div>
          </div>

          <div className="surface-strong rounded-[2rem] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <SectionHeading
              eyebrow="Workflow"
              title="A clearer story from idea to listing."
              body="This section gives visitors a fast understanding of how they would actually use the product."
            />
            <div className="mt-6 grid gap-4">
              {workflow.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...reveal(index * 0.05, 18)}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-[var(--surface-soft)] p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-display text-sm font-semibold text-[var(--accent-strong)]">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[var(--text-1)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--text-2)] sm:text-base">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          {...reveal(0.08)}
          className="surface-strong mt-8 rounded-[2.4rem] px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:px-8 sm:py-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
                Ready to use
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--text-1)] sm:text-4xl">
                Open the app, test an item, and see if the idea is worth chasing.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)] sm:text-base">
                The new landing page pushes visitors toward a single clear next step instead of making them decode the interface.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[var(--accent-strong)]"
              >
                Launch Scan Sell AI
                <ArrowRight size={18} />
              </Link>
              <a
                href="#top"
                className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[var(--surface-soft)] px-6 py-4 text-sm font-semibold text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
              >
                Back to the top
              </a>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-strong rounded-[1.7rem] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold text-[var(--text-1)]">{value}</div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{eyebrow}</div>
      <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--text-1)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-2)] sm:text-base">{body}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-strong rounded-[1.85rem] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--text-1)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{body}</p>
    </div>
  );
}

function PreviewBlock({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[color:var(--line)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-center gap-2 text-[var(--accent-strong)]">
        {icon}
        <div className="text-sm font-semibold text-[var(--text-1)]">{title}</div>
      </div>
      <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{body}</div>
    </div>
  );
}

function MiniPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[color:var(--line)] bg-[var(--surface-soft)] p-4">
      <h3 className="font-display text-xl font-semibold text-[var(--text-1)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--text-2)]">{body}</p>
    </div>
  );
}

function Bar({ height, tone }: { height: string; tone: string }) {
  return <div className={`w-full rounded-t-full ${height} ${tone}`} />;
}
