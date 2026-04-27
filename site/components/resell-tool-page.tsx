'use client';

import {
  ArrowLeft,
  BadgeDollarSign,
  ExternalLink,
  ImageUp,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { ThemeToggle } from '@/components/theme-toggle';
import { supabase } from '@/lib/supabase';
import type { ResellAnalysis } from '@/lib/types';
import { cn } from '@/lib/utils';

type ResellToolPageProps = {
  mode: 'image' | 'text';
  creditCost: number;
};

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  name: string | null;
};

function normalizeResellAnalysis(input: unknown): ResellAnalysis {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const productName =
    typeof source.productName === 'string' && source.productName.trim()
      ? source.productName
      : 'Unknown product';
  const searchQuery = encodeURIComponent(productName);

  return {
    productName,
    category: typeof source.category === 'string' ? source.category : 'General product',
    productSummary:
      typeof source.productSummary === 'string'
        ? source.productSummary
        : 'No summary was returned yet.',
    estimatedPrice:
      typeof source.estimatedPrice === 'string' ? source.estimatedPrice : 'Not available',
    recommendedSellPrice:
      typeof source.recommendedSellPrice === 'string'
        ? source.recommendedSellPrice
        : 'Not available',
    expectedProfitRange:
      typeof source.expectedProfitRange === 'string'
        ? source.expectedProfitRange
        : 'Not available',
    demandLevel:
      source.demandLevel === 'low' || source.demandLevel === 'medium' || source.demandLevel === 'high'
        ? source.demandLevel
        : 'medium',
    conditionNotes:
      typeof source.conditionNotes === 'string' ? source.conditionNotes : 'No condition notes yet.',
    keySellingPoints: Array.isArray(source.keySellingPoints)
      ? source.keySellingPoints.filter((item): item is string => typeof item === 'string')
      : [],
    adScript: typeof source.adScript === 'string' ? source.adScript : 'No ad script returned yet.',
    aliExpressSearchUrl:
      typeof source.aliExpressSearchUrl === 'string' && source.aliExpressSearchUrl.startsWith('http')
        ? source.aliExpressSearchUrl
        : `https://www.aliexpress.com/wholesale?SearchText=${searchQuery}`,
    confidenceScore:
      typeof source.confidenceScore === 'number' ? Math.max(0, Math.min(100, source.confidenceScore)) : 50,
    demandScore:
      typeof source.demandScore === 'number' ? Math.max(0, Math.min(100, source.demandScore)) : 50,
    marginScore:
      typeof source.marginScore === 'number' ? Math.max(0, Math.min(100, source.marginScore)) : 50,
    resaleSpeedScore:
      typeof source.resaleSpeedScore === 'number'
        ? Math.max(0, Math.min(100, source.resaleSpeedScore))
        : 50,
  };
}

export function ResellToolPage({ mode, creditCost }: ResellToolPageProps) {
  const [upload, setUpload] = useState<UploadState>({
    file: null,
    previewUrl: null,
    name: null,
  });
  const [textInput, setTextInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ResellAnalysis | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('Preparing your request...');

  useEffect(() => {
    return () => {
      if (upload.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    };
  }, [upload.previewUrl]);

  useEffect(() => {
    void loadCredits();
  }, []);

  useEffect(() => {
    if (!busy) {
      setLoadingStatus('Preparing your request...');
      return;
    }

    const labels =
      mode === 'image'
        ? [
            'Uploading your product image...',
            'Reading the product details...',
            'Estimating resell value...',
            'Building your selling script...',
          ]
        : [
            'Reading your product idea...',
            'Estimating resell value...',
            'Comparing selling potential...',
            'Building your selling script...',
          ];

    setLoadingStatus(labels[0]);
    const timers = labels.slice(1).map((label, index) =>
      window.setTimeout(() => setLoadingStatus(label), (index + 1) * 1200),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [busy, mode]);

  async function loadCredits() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) {
        setCredits(null);
        return;
      }

      const { data, error } = await supabase.from('users').select('credits').eq('id', userId).single();
      if (error) throw error;
      setCredits(typeof data?.credits === 'number' ? data.credits : null);
    } catch {
      setCredits(null);
    }
  }

  function onFileChange(file: File | null) {
    if (upload.previewUrl) {
      URL.revokeObjectURL(upload.previewUrl);
    }

    if (!file) {
      setUpload({ file: null, previewUrl: null, name: null });
      return;
    }

    setUpload({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    });
    setMessage(`Selected image: ${file.name}`);
  }

  async function handleRunAnalysis() {
    setBusy(true);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      if (!session?.access_token || !user) {
        window.location.href = '/auth';
        return;
      }

      if (mode === 'image') {
        if (!upload.file) {
          throw new Error('Please choose an image first.');
        }

        const safeName = upload.file.name.replace(/\s+/g, '-');
        const storagePath = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(storagePath, upload.file, {
          upsert: false,
          contentType: upload.file.type || 'image/png',
        });

        if (uploadError) {
          throw uploadError;
        }

        const response = await fetch('/api/resell/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ storagePath }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : `Image analysis failed with status ${response.status}.`,
          );
        }

        setAnalysis(normalizeResellAnalysis(data.analysis));
        await loadCredits();
        setMessage('Image analysis complete.');
      } else {
        if (!textInput.trim()) {
          throw new Error('Please enter a product name or short product description.');
        }

        const response = await fetch('/api/resell/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ productText: textInput.trim() }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : `Text analysis failed with status ${response.status}.`,
          );
        }

        setAnalysis(normalizeResellAnalysis(data.analysis));
        await loadCredits();
        setMessage('Text analysis complete.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Analysis failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4fbff] px-4 py-4 md:px-8 md:py-8">
      {busy ? <AnalysisLoadingOverlay status={loadingStatus} /> : null}
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Scan Sell AI
            </div>
            <div className="mt-1 text-xs text-[var(--text-3)] sm:text-sm">
              {mode === 'image' ? 'Image tool' : 'Text tool'}
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 md:mb-5 md:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 md:py-3"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:px-4 sm:py-2 sm:text-sm">
            {creditCost} credits per analysis
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2.5 md:mb-5 md:gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 sm:px-4 sm:py-2 sm:text-sm">
            <BadgeDollarSign size={16} className="text-sky-600" />
            Current credits: {credits ?? '...'}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:px-4 sm:py-2 sm:text-sm">
            {mode === 'image' ? 'Image route' : 'Text route'}
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[1.75rem] border border-sky-100 bg-white p-4 shadow-[0_20px_60px_rgba(117,149,176,0.08)] md:rounded-[2rem] md:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              {mode === 'image' ? 'Image to Analysis' : 'Text to Analysis'}
            </div>
            <h1 className="mt-2 text-2xl font-black leading-tight text-slate-900 sm:mt-3 sm:text-3xl">
              {mode === 'image'
                ? 'Upload a product image for a quick resell read'
                : 'Type a product name for a quick, lower-cost estimate'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {mode === 'image'
                ? 'One image in, clearer pricing and selling direction out.'
                : 'Best when you already know the item and just need a fast check.'}
            </p>

            {mode === 'image' ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const dropped = event.dataTransfer.files?.[0];
                  if (dropped) {
                    onFileChange(dropped);
                  }
                }}
                className={cn(
                  'mt-4 rounded-[1.7rem] border border-dashed p-4 transition sm:mt-6 sm:rounded-[2rem] sm:p-5',
                  dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-slate-50/80',
                )}
              >
                {upload.previewUrl ? (
                  <img
                    src={upload.previewUrl}
                    alt="Selected product"
                    className="h-[220px] w-full rounded-[1.25rem] object-cover sm:h-[320px] sm:rounded-[1.5rem]"
                  />
                ) : (
                  <div className="flex h-[220px] flex-col items-center justify-center rounded-[1.25rem] border border-slate-200 bg-white px-4 text-center sm:h-[320px] sm:rounded-[1.5rem]">
                    <ImageUp size={28} className="mb-3 text-sky-500 sm:mb-4 sm:size-[30px]" />
                    <div className="text-base font-semibold text-slate-900 sm:text-lg">Drop a product image here</div>
                    <div className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                      Drag in a screenshot, supplier image, or product photo.
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                    />
                    Choose image
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleRunAnalysis()}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles size={16} />
                    Run image analysis
                  </button>
                </div>
                <div className="mt-3 text-sm text-slate-600 sm:mt-4">
                  {upload.name ? `Selected: ${upload.name}` : 'No image selected yet.'}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.7rem] border border-slate-200 bg-slate-50 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-5">
                <label className="block">
                  <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <SearchCheck size={16} />
                    Product name or short product description
                  </span>
                  <textarea
                    value={textInput}
                    onChange={(event) => setTextInput(event.target.value)}
                    rows={5}
                    placeholder="Example: portable mini blender for smoothies"
                    className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-300 sm:rounded-[1.5rem] sm:px-4 sm:py-4"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleRunAnalysis()}
                  disabled={busy}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Sparkles size={16} />
                  Run text analysis
                </button>
              </div>
            )}

            {message ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {message}
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.75rem] border border-sky-100 bg-white p-4 shadow-[0_20px_60px_rgba(117,149,176,0.08)] md:rounded-[2rem] md:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Result</div>
            {analysis ? (
              <div className="mt-4 space-y-4 md:space-y-5">
                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 sm:rounded-[1.5rem]">
                  <div className="text-sm text-slate-500">Product name</div>
                  <div className="mt-2 text-xl font-black leading-tight text-slate-900 sm:text-2xl">
                    {analysis.productName}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{analysis.productSummary}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Estimated market price" value={analysis.estimatedPrice} />
                  <MetricCard label="Recommended sell price" value={analysis.recommendedSellPrice} />
                  <MetricCard label="Expected profit range" value={analysis.expectedProfitRange} />
                  <MetricCard label="Demand level" value={analysis.demandLevel} />
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 sm:rounded-[1.5rem]">
                  <div className="mb-4 text-sm font-semibold text-slate-700">Resell score bars</div>
                  <BarsChart
                    items={[
                      { label: 'Demand', value: analysis.demandScore },
                      { label: 'Margin', value: analysis.marginScore },
                      { label: 'Resell speed', value: analysis.resaleSpeedScore },
                    ]}
                  />
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 sm:rounded-[1.5rem]">
                  <div className="text-sm font-semibold text-slate-900">Selling points</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.keySellingPoints.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:block">
                  <div className="text-sm font-semibold text-slate-900">Ad script for TikTok or YouTube</div>
                  <div className="mt-3 text-sm leading-7 text-slate-700">{analysis.adScript}</div>
                </div>

                <details className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 sm:hidden">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                    Show ad script
                  </summary>
                  <div className="mt-3 text-sm leading-6 text-slate-700">{analysis.adScript}</div>
                </details>

                <a
                  href={analysis.aliExpressSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 sm:w-auto"
                >
                  Search on AliExpress
                  <ExternalLink size={16} />
                </a>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 sm:rounded-[1.5rem] sm:p-5">
                Run an analysis to see the product name, pricing, score bars, ad script, and AliExpress link here.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function AnalysisLoadingOverlay({ status }: { status: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(244,251,255,0.82)] backdrop-blur-md">
      <div className="flex w-[min(92vw,420px)] flex-col items-center rounded-[2rem] border border-sky-100 bg-white/94 px-8 py-10 text-center shadow-[0_30px_100px_rgba(93,146,184,0.18)]">
        <div className="relative mb-8 h-28 w-28">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.3, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-sky-400 border-r-cyan-300"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.7, ease: 'linear' }}
            className="absolute inset-3 rounded-full border-[5px] border-transparent border-b-sky-500 border-l-blue-300"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: 'linear' }}
            className="absolute inset-[26px] rounded-full border-[4px] border-transparent border-t-cyan-400"
          />
          <div className="absolute inset-[34px] rounded-full bg-gradient-to-br from-sky-100 to-cyan-50 shadow-inner" />
        </div>

        <div className="text-lg font-black text-slate-900">AI analysis in progress</div>
        <div className="mt-3 text-sm font-medium text-slate-600">{status}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-black text-slate-900">{value}</div>
    </div>
  );
}

function BarsChart({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="font-semibold text-slate-500">{item.value}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
              style={{ width: `${Math.max(8, Math.min(100, item.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
