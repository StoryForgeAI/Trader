'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeDollarSign,
  ImageUp,
  PackageSearch,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { IMAGE_ANALYSIS_COST, TEXT_ANALYSIS_COST } from '@/lib/catalog';

export function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-300 text-white shadow-[0_18px_40px_rgba(56,189,248,0.28)]">
              <PackageSearch size={22} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
                Scan Sell AI
              </div>
              <div className="text-xs text-slate-500">AI resale research for products, listings, and quick ad ideas</div>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-sky-100 bg-white/90 px-6 py-8 shadow-[0_32px_120px_rgba(75,135,255,0.12)] md:px-10 md:py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-100/50 blur-3xl"
          />

          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                <Sparkles size={16} className="text-sky-500" />
                Find products. Estimate resale price. Sell faster.
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] text-slate-900 md:text-7xl"
              >
                Turn product photos or names into a resale plan in seconds.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg"
              >
                Scan Sell AI helps you identify products, estimate resale prices, create quick ad scripts, and jump into AliExpress research without wasting time.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.18 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Now
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#tools"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  See the tools
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.26 }}
                className="mt-10 grid gap-4 md:grid-cols-3"
              >
                <Metric label="Image analysis" value={`${IMAGE_ANALYSIS_COST} credits`} />
                <Metric label="Text analysis" value={`${TEXT_ANALYSIS_COST} credits`} />
                <Metric label="Built for" value="Phone + desktop" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="rounded-[2rem] border border-slate-200 bg-[#f8fcff] p-4 shadow-[0_24px_60px_rgba(97,131,171,0.08)]">
                <div className="rounded-[1.7rem] border border-sky-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Resell workflow
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-900">Simple product research</div>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Ready
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <PreviewBlock
                      icon={<ImageUp size={18} />}
                      title="Image to Analysis"
                      body="Upload a photo and get the product name, estimate, resale price, and selling script."
                    />
                    <PreviewBlock
                      icon={<SearchCheck size={18} />}
                      title="Text to Analysis"
                      body="Type the product name to save credits and get a quick resale overview."
                    />
                    <PreviewBlock
                      icon={<BadgeDollarSign size={18} />}
                      title="Sell with more confidence"
                      body="Use the estimated value, suggested listing price, and ad hook to move faster."
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="tools" className="mt-8 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<ImageUp size={18} />}
            title="Image-based product scan"
            body="Great when you have a supplier image, a screenshot, or a product photo from your gallery."
          />
          <FeatureCard
            icon={<SearchCheck size={18} />}
            title="Cheaper text lookup"
            body="Type the product name and save credits when you do not need image recognition."
          />
          <FeatureCard
            icon={<BadgeDollarSign size={18} />}
            title="Made for resellers"
            body="Focus on resale price, fast-moving demand, and short ad scripts instead of generic descriptions."
          />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[#f6fbff] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white/88 p-5 shadow-[0_16px_48px_rgba(120,142,168,0.08)]">
      <div className="mb-3 text-sky-500">{icon}</div>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function PreviewBlock({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-sky-100 bg-sky-50/70 p-4">
      <div className="flex items-center gap-2 text-sky-600">
        {icon}
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{body}</div>
    </div>
  );
}
