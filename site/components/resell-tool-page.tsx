'use client';

import {
  ArrowLeft,
  BadgeDollarSign,
  ExternalLink,
  ImageUp,
  LoaderCircle,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    return () => {
      if (upload.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    };
  }, [upload.previewUrl]);

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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-trade-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            },
            body: JSON.stringify({ storagePath }),
          },
        );

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : `Image analysis failed with status ${response.status}.`,
          );
        }

        setAnalysis(data.analysis as ResellAnalysis);
        setMessage('Image analysis complete.');
      } else {
        if (!textInput.trim()) {
          throw new Error('Please enter a product name or short product description.');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-product-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            },
            body: JSON.stringify({ productText: textInput.trim() }),
          },
        );

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : `Text analysis failed with status ${response.status}.`,
          );
        }

        setAnalysis(data.analysis as ResellAnalysis);
        setMessage('Text analysis complete.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Analysis failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4fbff] px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-700">
            {creditCost} credits per analysis
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[2rem] border border-sky-100 bg-white p-5 shadow-[0_20px_60px_rgba(117,149,176,0.08)] md:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              {mode === 'image' ? 'Image to Analysis' : 'Text to Analysis'}
            </div>
            <h1 className="mt-3 text-3xl font-black text-slate-900">
              {mode === 'image'
                ? 'Upload a product image and get a resale breakdown'
                : 'Type a product name and get a lower-cost resale estimate'}
            </h1>

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
                  'mt-6 rounded-[2rem] border border-dashed p-5 transition',
                  dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-slate-50/80',
                )}
              >
                {upload.previewUrl ? (
                  <img
                    src={upload.previewUrl}
                    alt="Selected product"
                    className="h-[320px] w-full rounded-[1.5rem] object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white text-center">
                    <ImageUp size={30} className="mb-4 text-sky-500" />
                    <div className="text-lg font-semibold text-slate-900">Drop a product image here</div>
                    <div className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                      You can drag in a product screenshot, supplier image, or gallery photo.
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
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
                    className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    Run image analysis
                  </button>
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  {upload.name ? `Selected: ${upload.name}` : 'No image selected yet.'}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <label className="block">
                  <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <SearchCheck size={16} />
                    Product name or short product description
                  </span>
                  <textarea
                    value={textInput}
                    onChange={(event) => setTextInput(event.target.value)}
                    rows={8}
                    placeholder="Example: portable mini blender for smoothies"
                    className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-sky-300"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleRunAnalysis()}
                  disabled={busy}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Run text analysis
                </button>
              </div>
            )}

            {message ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-sky-100 bg-white p-5 shadow-[0_20px_60px_rgba(117,149,176,0.08)] md:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Result</div>
            {analysis ? (
              <div className="mt-4 space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Product name</div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{analysis.productName}</div>
                  <div className="mt-2 text-sm text-slate-600">{analysis.productSummary}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Estimated market price" value={analysis.estimatedPrice} />
                  <MetricCard label="Recommended sell price" value={analysis.recommendedSellPrice} />
                  <MetricCard label="Expected profit range" value={analysis.expectedProfitRange} />
                  <MetricCard label="Demand level" value={analysis.demandLevel} />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 text-sm font-semibold text-slate-700">Resell score bars</div>
                  <BarsChart
                    items={[
                      { label: 'Demand', value: analysis.demandScore },
                      { label: 'Margin', value: analysis.marginScore },
                      { label: 'Resale speed', value: analysis.resaleSpeedScore },
                    ]}
                  />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
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

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">Ad script for TikTok or YouTube</div>
                  <div className="mt-3 text-sm leading-7 text-slate-700">{analysis.adScript}</div>
                </div>

                <a
                  href={analysis.aliExpressSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                >
                  Search on AliExpress
                  <ExternalLink size={16} />
                </a>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Run an analysis to see the product name, estimated price, suggested selling price, score bars, ad script, and AliExpress search link here.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
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
