'use client';

import {
  ArrowRight,
  CandlestickChart,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gauge,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  RefreshCcw,
  Sparkles,
  Star,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/theme-toggle';
import { ANALYSIS_COST, CREDIT_PACKS, SUBSCRIPTIONS } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import type {
  AnalysisRecord,
  DashboardData,
  TradeAnalysis,
  UserProfile,
} from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  name: string | null;
};

type ActiveTab = 'dashboard' | 'analyze' | 'plans' | 'profile' | 'about';

type NoticeTone = 'success' | 'error' | 'neutral';

const tabs: { id: ActiveTab; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'analyze', label: 'Analyze', icon: <Sparkles size={18} /> },
  { id: 'plans', label: 'Plans', icon: <CreditCard size={18} /> },
  { id: 'profile', label: 'Profile', icon: <UserRound size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

const analysisSteps = [
  'Uploading your screenshot',
  'Reading structure, momentum, and zones',
  'Scoring confidence and risk',
  'Preparing the full-screen report',
];

export function DashboardShell() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [upload, setUpload] = useState<UploadState>({
    file: null,
    previewUrl: null,
    name: null,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showResult, setShowResult] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success') {
      setNotice({
        tone: 'success',
        text: 'Checkout completed. Your balance may update in a few seconds.',
      });
      setActiveTab('plans');
      params.delete('checkout');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', next);
    }
    if (checkout === 'canceled') {
      setNotice({
        tone: 'neutral',
        text: 'Checkout was canceled. No payment was taken.',
      });
      setActiveTab('plans');
      params.delete('checkout');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (upload.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    };
  }, [upload.previewUrl]);

  useEffect(() => {
    if (!busy) {
      setAnalysisStep(0);
      return;
    }

    const timers = [
      window.setTimeout(() => setAnalysisStep(1), 700),
      window.setTimeout(() => setAnalysisStep(2), 1800),
      window.setTimeout(() => setAnalysisStep(3), 3000),
    ];

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [busy]);

  const latestSaved = dashboard?.analyses[0] ?? null;
  const effectiveAnalysis = analysis ?? latestSaved?.result ?? null;
  const progress = [12, 42, 76, 100][analysisStep] ?? 0;
  const creditCount = dashboard?.profile.credits ?? 0;
  const hasCredits = creditCount >= ANALYSIS_COST;

  async function loadDashboard() {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      const userId = session.user.id;

      const [{ data: profile, error: profileError }, { data: subscription }, { data: analyses }] =
        await Promise.all([
          supabase.from('users').select('*').eq('id', userId).single(),
          supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
          supabase
            .from('analyses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

      if (profileError) {
        throw profileError;
      }

      setDashboard({
        profile: profile as UserProfile,
        subscription: dashboardSubscriptionOrNull(subscription),
        analyses: (analyses as AnalysisRecord[]) ?? [],
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not load your dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }

  function setUploadFile(file: File | null) {
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
    setNotice({ tone: 'success', text: `Selected screenshot: ${file.name}` });
  }

  async function handleAnalyze() {
    if (!upload.file) {
      setNotice({ tone: 'error', text: 'Please choose a screenshot before starting the analysis.' });
      return;
    }

    if (!dashboard) {
      setNotice({ tone: 'error', text: 'Dashboard data is still loading. Please try again.' });
      return;
    }

    if (!hasCredits) {
      setActiveTab('plans');
      setNotice({
        tone: 'error',
        text: 'You do not have enough credits. Please buy more credits or switch to a plan.',
      });
      return;
    }

    setBusy(true);
    setNotice(null);
    setActiveTab('analyze');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;

      if (!user || !session) {
        router.replace('/auth');
        return;
      }

      if (!session?.access_token) {
        throw new Error('Your session expired. Please sign in again.');
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

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-trade-image`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: JSON.stringify({ storagePath }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorText =
          typeof data?.error === 'string'
            ? data.error
            : `The analysis request failed with status ${response.status}.`;
        throw new Error(errorText);
      }

      if (!data?.analysis) {
        throw new Error('No analysis came back from the server.');
      }

      setAnalysis(data.analysis as TradeAnalysis);
      setShowResult(true);
      setNotice({
        tone: 'success',
        text: 'Analysis complete. The result has been saved and your credits were updated.',
      });
      await loadDashboard();
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Analysis failed.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckout(productId: string, mode: 'payment' | 'subscription') {
    setBusy(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId, mode },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('Missing Stripe checkout URL.');
      }

      window.location.href = data.url as string;
    } catch (error) {
      setBusy(false);
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not open checkout.',
      });
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf4] text-stone-700">
        <LoaderCircle className="animate-spin text-orange-500" size={30} />
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#fffaf4] px-0 py-3 md:pr-6 md:py-6">
      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close mobile menu overlay"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <div className="flex w-full gap-4">
        <Sidebar
          activeTab={activeTab}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          profile={dashboard.profile}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          setCollapsed={setSidebarCollapsed}
          setMobileOpen={setMobileMenuOpen}
          onSignOut={() => void handleSignOut()}
        />

        <div className="min-w-0 flex-1">
          <TopBar
            busy={busy}
            onRefresh={() => void loadDashboard()}
            onToggleSidebar={() => setMobileMenuOpen(true)}
          />

          {notice ? <NoticeBanner tone={notice.tone} text={notice.text} /> : null}

          {activeTab === 'dashboard' ? (
            <DashboardTab
              dashboard={dashboard}
              analysis={effectiveAnalysis}
              onOpenAnalyze={() => setActiveTab('analyze')}
              onOpenPlans={() => setActiveTab('plans')}
            />
          ) : null}

          {activeTab === 'analyze' ? (
            <AnalyzeTab
              busy={busy}
              creditCount={creditCount}
              dragging={dragging}
              hasCredits={hasCredits}
              progress={progress}
              stepIndex={analysisStep}
              upload={upload}
              setDragging={setDragging}
              onAnalyze={() => void handleAnalyze()}
              onFileChange={setUploadFile}
            />
          ) : null}

          {activeTab === 'plans' ? (
            <PlansTab
              currentPlan={dashboard.profile.plan}
              onCheckout={(id, mode) => void handleCheckout(id, mode)}
            />
          ) : null}

          {activeTab === 'profile' ? (
            <ProfileTab
              dashboard={dashboard}
              onAnalyze={() => setActiveTab('analyze')}
              onPlans={() => setActiveTab('plans')}
            />
          ) : null}

          {activeTab === 'about' ? <AboutTab /> : null}
        </div>
      </div>

      {showResult && effectiveAnalysis ? (
        <ResultOverlay
          analysis={effectiveAnalysis}
          previewUrl={upload.previewUrl}
          savedAt={latestSaved?.created_at ?? null}
          onClose={() => setShowResult(false)}
        />
      ) : null}
    </main>
  );
}

function dashboardSubscriptionOrNull(value: DashboardData['subscription'] | null | undefined) {
  return value ?? null;
}

function explainSentiment(value: string) {
  switch (value) {
    case 'bullish':
      return 'Price looks stronger';
    case 'bearish':
      return 'Price looks weaker';
    default:
      return 'Price looks mixed';
  }
}

function explainRisk(value: string) {
  switch (value) {
    case 'low':
      return 'Lower risk setup';
    case 'medium':
      return 'Medium risk setup';
    case 'high':
      return 'Higher risk setup';
    default:
      return value;
  }
}

function planStrengthValue(plan: string) {
  switch (plan) {
    case 'starter':
      return 40;
    case 'pro':
      return 65;
    case 'trader':
      return 82;
    case 'money_printer':
      return 100;
    default:
      return 18;
  }
}

function Sidebar({
  activeTab,
  collapsed,
  mobileOpen,
  profile,
  setActiveTab,
  setCollapsed,
  setMobileOpen,
  onSignOut,
}: {
  activeTab: ActiveTab;
  collapsed: boolean;
  mobileOpen: boolean;
  profile: UserProfile;
  setActiveTab: (tab: ActiveTab) => void;
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
  onSignOut: () => void;
}) {
  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 flex-col rounded-[2rem] border border-orange-100 bg-white px-3 py-3 shadow-[0_24px_80px_rgba(177,123,52,0.12)] md:sticky md:top-6 md:flex md:h-[calc(100vh-3rem)]',
          collapsed ? 'md:w-[96px]' : 'md:w-[280px]',
        )}
      >
        <SidebarInner
          activeTab={activeTab}
          collapsed={collapsed}
          profile={profile}
          setActiveTab={setActiveTab}
          onClose={() => setMobileOpen(false)}
          onSignOut={onSignOut}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      {mobileOpen ? (
        <aside className="fixed inset-y-3 left-3 z-50 flex w-[288px] flex-col rounded-[2rem] border border-orange-100 bg-white px-3 py-3 shadow-[0_24px_80px_rgba(177,123,52,0.16)] md:hidden">
          <SidebarInner
            activeTab={activeTab}
            collapsed={false}
            profile={profile}
            setActiveTab={setActiveTab}
            onClose={() => setMobileOpen(false)}
            onSignOut={onSignOut}
          />
        </aside>
      ) : null}
    </>
  );
}

function SidebarInner({
  activeTab,
  collapsed,
  profile,
  setActiveTab,
  onClose,
  onSignOut,
  onToggleCollapse,
}: {
  activeTab: ActiveTab;
  collapsed: boolean;
  profile: UserProfile;
  setActiveTab: (tab: ActiveTab) => void;
  onClose: () => void;
  onSignOut: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-2 px-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-300 text-white">
            <CandlestickChart size={20} />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                TradeScope
              </div>
              <div className="break-all text-xs text-stone-500">{profile.email}</div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 md:inline-flex"
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 md:hidden"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition',
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-[0_12px_30px_rgba(249,115,22,0.24)]'
                : 'text-stone-600 hover:bg-orange-50 hover:text-stone-900',
              collapsed && 'justify-center',
            )}
          >
            {tab.icon}
            {!collapsed ? <span>{tab.label}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-3 px-2">
        {!collapsed ? (
          <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Credits</div>
            <div className="mt-2 text-2xl font-black text-stone-900">{profile.credits}</div>
          </div>
        ) : (
          <div className="flex justify-center rounded-2xl border border-orange-100 bg-orange-50 px-2 py-3">
            <span className="text-sm font-black text-stone-900">{profile.credits}</span>
          </div>
        )}

        {!collapsed ? (
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-stone-900">Ready</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300',
            collapsed && 'justify-center',
          )}
        >
          <LogOut size={17} />
          {!collapsed ? 'Sign out' : null}
        </button>
      </div>
    </>
  );
}

function TopBar({
  busy,
  onRefresh,
  onToggleSidebar,
}: {
  busy: boolean;
  onRefresh: () => void;
  onToggleSidebar: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.75rem] border border-orange-100 bg-white px-4 py-3 shadow-[0_20px_60px_rgba(177,123,52,0.10)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <span className={cn('h-2.5 w-2.5 rounded-full bg-emerald-500', busy && 'animate-pulse')} />
          {busy ? 'Running' : 'Ready'}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-stone-800 transition hover:border-orange-300 hover:bg-orange-100"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>
    </div>
  );
}

function NoticeBanner({ tone, text }: { tone: NoticeTone; text: string }) {
  const palette =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'neutral'
        ? 'border-stone-200 bg-stone-50 text-stone-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-900';

  return (
    <div className={cn('mb-4 flex items-start gap-3 rounded-[1.5rem] px-5 py-4 text-sm', palette)}>
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function DashboardTab({
  dashboard,
  analysis,
  onOpenAnalyze,
  onOpenPlans,
}: {
  dashboard: DashboardData;
  analysis: TradeAnalysis | null;
  onOpenAnalyze: () => void;
  onOpenPlans: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <Card className="overflow-hidden bg-gradient-to-br from-[#fff9f2] via-white to-[#fff3df]">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div>
            <SectionEyebrow>Start here</SectionEyebrow>
            <h2 className="mt-3 break-words text-3xl font-black text-stone-900">
              Upload a chart and get a simple trading answer fast.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600">
              TradeScope is built to make chart screenshots easier to understand, even if trading words still feel new.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <MetricCard label="Credits" value={String(dashboard.profile.credits)} />
              <MetricCard label="Plan" value={dashboard.profile.plan} />
              <MetricCard label="Saved" value={String(dashboard.analyses.length)} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton onClick={onOpenAnalyze}>Analyze now</PrimaryButton>
              <SecondaryButton onClick={onOpenPlans}>Open plans</SecondaryButton>
            </div>
          </div>

          <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-5">
            <div className="mb-5 text-sm font-semibold text-stone-500">Quick answers</div>
            <div className="space-y-3">
              <FaqCard
                question="What will I get after uploading a chart?"
                answer="A simple read of what the price is doing, when to consider buying, when to consider selling, and how risky the setup looks."
              />
              <FaqCard
                question="Do I need to know trading words?"
                answer="No. The result explains whether price looks stronger, weaker, or mixed in plain English."
              />
              <FaqCard
                question="What if the chart is unclear?"
                answer="The AI lowers confidence and gives a safer answer instead of pretending it is certain."
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <RatingCard title="Easy to read" value="4.9/5" />
              <RatingCard title="Fast answer" value="4.8/5" />
              <RatingCard title="Beginner friendly" value="5.0/5" />
            </div>

            {analysis ? (
              <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Latest read</div>
                <div className="mt-3 space-y-2">
                  <SummaryRow label="Price direction" value={explainSentiment(analysis.marketSentiment)} />
                  <SummaryRow label="Risk level" value={explainRisk(analysis.riskLevel)} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Why people stay</SectionEyebrow>
        <h3 className="mt-3 text-xl font-black text-stone-900">Built to keep things simple</h3>
        <div className="mt-5 grid gap-3">
          <RetentionCard
            title="Clear buy and sell timing"
            body="Instead of chart jargon first, the result starts with when to enter and when to take profit."
          />
          <RetentionCard
            title="Beginner-friendly wording"
            body="Price looks stronger, weaker, or mixed. Lower risk or higher risk. Easy to read at a glance."
          />
          <RetentionCard
            title="Saved chart history"
            body="Every finished analysis stays in your account, so you can compare old screenshots and spot patterns."
          />
          <RetentionCard
            title="Fast top-ups and plans"
            body="When you run low on credits, one tap opens the plan or credit pack that fits your pace."
          />
        </div>
      </Card>
    </div>
  );
}

function AnalyzeTab({
  busy,
  creditCount,
  dragging,
  hasCredits,
  progress,
  stepIndex,
  upload,
  setDragging,
  onAnalyze,
  onFileChange,
}: {
  busy: boolean;
  creditCount: number;
  dragging: boolean;
  hasCredits: boolean;
  progress: number;
  stepIndex: number;
  upload: UploadState;
  setDragging: (value: boolean) => void;
  onAnalyze: () => void;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionEyebrow>Analyze</SectionEyebrow>
            <h2 className="mt-3 text-2xl font-black text-stone-900">
              Upload a chart and launch the AI reading flow
            </h2>
          </div>
          <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-stone-700">
            {ANALYSIS_COST} credits per analysis
          </div>
        </div>

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
            dragging ? 'border-orange-400 bg-orange-50' : 'border-stone-300 bg-stone-50/80',
          )}
        >
          {upload.previewUrl ? (
            <img src={upload.previewUrl} alt="Selected chart" className="h-[340px] w-full rounded-[1.5rem] object-cover" />
          ) : (
            <div className="flex h-[340px] flex-col items-center justify-center rounded-[1.5rem] border border-stone-200 bg-white text-center">
              <UploadCloud size={28} className="mb-4 text-orange-500" />
              <div className="px-4 text-lg font-semibold text-stone-900">Drop a trading screenshot here</div>
              <div className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                TradingView, Binance, MetaTrader, broker dashboards, crypto, forex, and stocks all work well.
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
              Choose screenshot
            </label>

            <PrimaryButton onClick={onAnalyze} disabled={busy}>
              {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Run AI analysis
            </PrimaryButton>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="max-w-full break-all rounded-full border border-stone-200 bg-white px-3 py-2 text-stone-700">
              {upload.name ? `Selected: ${upload.name}` : 'No screenshot selected yet'}
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-2',
                hasCredits
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700',
              )}
            >
              {hasCredits ? `${creditCount} credits available` : 'Not enough credits to run analysis'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-gradient-to-br from-white via-[#fff9f1] to-[#fff2e1]">
        <SectionEyebrow>Process</SectionEyebrow>
        <h3 className="mt-3 text-2xl font-black text-stone-900">Animated analysis flow</h3>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          The process stays simple: upload, read the structure, score the setup, then open the report full screen.
        </p>

        <div className="mt-6 rounded-[1.75rem] border border-orange-100 bg-white/85 p-5">
          <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
            <span>AI progress</span>
            <span>{busy ? `${progress}%` : 'Waiting for your screenshot'}</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-orange-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5 space-y-3">
            {analysisSteps.map((step, index) => (
              <ProcessStep key={step} active={busy && stepIndex >= index} label={step} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function PlansTab({
  currentPlan,
  onCheckout,
}: {
  currentPlan: string;
  onCheckout: (id: string, mode: 'payment' | 'subscription') => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#fff9f2] to-white">
        <SectionEyebrow>Plans</SectionEyebrow>
        <h2 className="mt-3 text-3xl font-black text-stone-900">Subscriptions and credit packs</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Use a plan for weekly credits, or top up with one-time packs when you need more chart reads.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
            20% better value on paid plans
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Weekly refill included
          </span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {SUBSCRIPTIONS.map((plan) => (
          <PlanCard
            key={plan.id}
            title={plan.title}
            price={plan.priceLabel}
            description={plan.description}
            featured={currentPlan === plan.id}
            accent={plan.id}
            promo={
              plan.id === 'pro'
                ? 'Most popular'
              : plan.id === 'trader'
                  ? '20% better value'
                  : plan.id === 'money_printer'
                    ? 'Best for heavy usage'
                    : 'Starter option'
            }
            buttonLabel={currentPlan === plan.id ? 'Current plan' : 'Open checkout'}
            onClick={() => onCheckout(plan.id, plan.mode)}
          />
        ))}
      </div>

      <Card>
        <SectionEyebrow>Credit packs</SectionEyebrow>
        <h3 className="mt-3 text-2xl font-black text-stone-900">One-time packs</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <PlanCard
              key={pack.id}
              title={pack.title}
              price={pack.priceLabel}
              description={pack.description}
              accent={pack.id}
              promo={pack.id === 'pack_500' ? 'Best pack discount' : 'Instant top-up'}
              buttonLabel="Buy credits"
              compact
              onClick={() => onCheckout(pack.id, pack.mode)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProfileTab({
  dashboard,
  onAnalyze,
  onPlans,
}: {
  dashboard: DashboardData;
  onAnalyze: () => void;
  onPlans: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card>
        <SectionEyebrow>Profile</SectionEyebrow>
        <h2 className="mt-3 text-2xl font-black text-stone-900">Account details</h2>
        <div className="mt-6 space-y-3">
          <InfoLine label="Email" value={dashboard.profile.email} />
          <InfoLine label="Credits" value={String(dashboard.profile.credits)} />
          <InfoLine label="Plan" value={dashboard.profile.plan} />
          <InfoLine label="Member since" value={formatDate(dashboard.profile.created_at)} />
          <InfoLine label="Current period end" value={formatDate(dashboard.subscription?.current_period_end)} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton onClick={onAnalyze}>Analyze a chart</PrimaryButton>
          <SecondaryButton onClick={onPlans}>See plans</SecondaryButton>
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Performance</SectionEyebrow>
        <h3 className="mt-3 text-2xl font-black text-stone-900">Your account at a glance</h3>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          A quick visual summary of how much runway you have left for new chart reads.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatTile title="Credits left" value={String(dashboard.profile.credits)} accent="orange" />
          <StatTile title="Saved analyses" value={String(dashboard.analyses.length)} accent="blue" />
          <StatTile title="Account tier" value={dashboard.profile.plan} accent="green" />
        </div>
        <div className="mt-6 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
          <div className="mb-4 text-sm font-semibold text-stone-700">Account health</div>
          <BarsChart
            items={[
              { label: 'Credits available', value: Math.min(100, dashboard.profile.credits) },
              { label: 'Analysis history', value: Math.min(100, dashboard.analyses.length * 12) },
              { label: 'Plan strength', value: planStrengthValue(dashboard.profile.plan) },
            ]}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MiniMetric title="Next action" value="Run a new scan" />
          <MiniMetric title="Billing state" value={dashboard.subscription?.status ?? 'inactive'} />
          <MiniMetric title="Refill cycle" value={dashboard.subscription ? 'Weekly' : 'No active plan'} />
        </div>
      </Card>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="bg-gradient-to-br from-[#fff7ec] to-white">
        <SectionEyebrow>About</SectionEyebrow>
        <h2 className="mt-3 text-3xl font-black text-stone-900">What TradeScope focuses on</h2>
        <div className="mt-6 space-y-4 text-sm leading-7 text-stone-600">
          <AboutRow
            icon={<Sparkles size={16} />}
            title="Fast chart reading"
            body="Upload screenshots from crypto, forex, or stock platforms and get structured insight in a cleaner format."
          />
          <AboutRow
            icon={<Gauge size={16} />}
            title="Visual-first result"
            body="The analysis opens in a full-screen readout built to feel clear instead of text-heavy."
          />
          <AboutRow
            icon={<Info size={16} />}
            title="Simple navigation"
            body="A collapsible sidebar keeps Dashboard, Analyze, Plans, Profile, and About one tap away."
          />
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Design direction</SectionEyebrow>
        <h3 className="mt-3 text-2xl font-black text-stone-900">How the product helps</h3>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          The experience is built around one short loop: upload, read, decide.
        </p>
        <div className="mt-6 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
          <div className="mb-4 text-sm font-semibold text-stone-700">What the AI returns</div>
          <BarsChart
            items={[
              { label: 'Entry timing', value: 88 },
              { label: 'Exit timing', value: 91 },
              { label: 'Risk clarity', value: 84 },
            ]}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MiniMetric title="Step 1" value="Upload chart" />
          <MiniMetric title="Step 2" value="Get trader view" />
          <MiniMetric title="Step 3" value="Act faster" />
        </div>
      </Card>
    </div>
  );
}

function ResultOverlay({
  analysis,
  previewUrl,
  savedAt,
  onClose,
}: {
  analysis: TradeAnalysis;
  previewUrl: string | null;
  savedAt: string | null;
  onClose: () => void;
}) {
  const confidence = Math.max(0, Math.min(100, analysis.confidenceScore));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(252,247,240,0.92)] backdrop-blur-md">
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-4 md:px-8 md:py-8">
        <div className="rounded-[2rem] border border-orange-100 bg-white shadow-[0_32px_120px_rgba(180,118,42,0.18)]">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[2rem] border-b border-stone-200 bg-white/92 px-5 py-4 md:px-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Analysis result</div>
              <div className="mt-1 text-lg font-bold text-stone-900">Full-screen trade readout</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300"
              aria-label="Close analysis"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-8 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[1fr_1.04fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-stone-50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Uploaded chart" className="h-[320px] w-full object-cover md:h-[460px]" />
                ) : (
                  <div className="flex h-[320px] items-center justify-center text-stone-400 md:h-[460px]">
                    Uploaded chart preview
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SignalCard title="Price direction" value={explainSentiment(analysis.marketSentiment)} tone={analysis.marketSentiment} />
                <SignalCard title="Risk level" value={explainRisk(analysis.riskLevel)} tone={analysis.riskLevel} />
                <SignalCard title="Confidence" value={`${confidence}%`} tone="confidence" />
              </div>

              <Card className="p-5">
                <div className="mb-4 text-sm font-semibold text-stone-700">Scoreboard</div>
                <BarsChart
                  items={[
                    { label: 'Confidence', value: confidence },
                    {
                      label: 'Momentum',
                      value: confidence > 50 ? Math.min(98, confidence + 4) : confidence + 16,
                    },
                    {
                      label: 'Risk control',
                      value: analysis.riskLevel === 'low' ? 84 : analysis.riskLevel === 'medium' ? 62 : 38,
                    },
                  ]}
                />
                <div className="mt-4 text-xs text-stone-500">{savedAt ? `Saved ${formatDate(savedAt)}` : 'Fresh analysis'}</div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <SectionEyebrow>Trader AI</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-black text-stone-900">The key trading calls</h2>
                <div className="mt-6 grid gap-4">
                  <InsightPanel title="When to BUY" body={analysis.whenToBuy} emphasis highlight />
                  <InsightPanel title="When to SELL" body={analysis.whenToSell} emphasis highlight />
                  <InsightPanel title="Risk note" body={explainRisk(analysis.riskLevel)} highlight />
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4 text-sm font-semibold text-stone-700">Entry and exit map</div>
                <TradeLane analysis={analysis} />
              </Card>

              <Card className="p-6">
                <div className="mb-4 text-sm font-semibold text-stone-700">Signals detected</div>
                <div className="flex flex-wrap gap-2">
                  {[...analysis.keySignals, ...analysis.detectedIndicators].slice(0, 6).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-stone-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradeLane({ analysis }: { analysis: TradeAnalysis }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-stone-200 bg-[#fffaf5] p-5">
      <div className="absolute left-6 right-6 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-stone-200 via-orange-300 to-stone-200" />
      <div className="relative grid gap-4 md:grid-cols-3">
        <LaneNode title="Market state" body={analysis.marketSentiment} />
        <LaneNode title="Buy trigger" body={analysis.whenToBuy} highlighted />
        <LaneNode title="Sell trigger" body={analysis.whenToSell} />
      </div>
    </div>
  );
}

function LaneNode({
  title,
  body,
  highlighted = false,
}: {
  title: string;
  body: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative rounded-[1.4rem] border p-4 shadow-sm',
        highlighted ? 'border-orange-300 bg-white' : 'border-stone-200 bg-white/80',
      )}
    >
      <div className="mb-3 h-3 w-3 rounded-full bg-orange-400" />
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{title}</div>
      <div className="mt-3 text-sm leading-6 text-stone-700">{body}</div>
    </div>
  );
}

function InsightPanel({
  title,
  body,
  emphasis = false,
  highlight = false,
}: {
  title: string;
  body: string;
  emphasis?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[1.5rem] border p-5',
        emphasis ? 'border-orange-200 bg-orange-50' : 'border-stone-200 bg-stone-50',
      )}
    >
      <div className="text-sm font-semibold text-stone-900">{title}</div>
      <p className="mt-3 break-words text-sm leading-7 text-stone-600">
        {highlight ? <HighlightedText text={body} /> : body}
      </p>
    </div>
  );
}

function BarsChart({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-stone-700">{item.label}</span>
            <span className="font-semibold text-stone-500">{item.value}%</span>
          </div>
          <div className="h-3 rounded-full bg-stone-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-300"
              style={{ width: `${Math.max(8, Math.min(100, item.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AboutRow({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1.5rem] border border-stone-200 bg-white p-4">
      <div className="rounded-2xl bg-orange-50 p-3 text-orange-500">{icon}</div>
      <div>
        <div className="font-semibold text-stone-900">{title}</div>
        <div className="mt-1 text-sm leading-6 text-stone-600">{body}</div>
      </div>
    </div>
  );
}

function ProcessStep({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'h-3 w-3 rounded-full transition',
          active ? 'bg-orange-500 shadow-[0_0_0_6px_rgba(249,115,22,0.16)]' : 'bg-stone-300',
        )}
      />
      <div className={cn('text-sm', active ? 'text-stone-900' : 'text-stone-500')}>{label}</div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  description,
  buttonLabel,
  onClick,
  featured = false,
  compact = false,
  promo,
  accent,
}: {
  title: string;
  price: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  featured?: boolean;
  compact?: boolean;
  promo?: string;
  accent?: string;
}) {
  const palette =
    accent === 'pro'
      ? 'border-sky-200 bg-gradient-to-br from-sky-50 to-white'
      : accent === 'trader'
        ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50'
        : accent === 'money_printer'
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'
          : accent === 'pack_500'
            ? 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white'
            : accent === 'pack_150'
              ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-white'
              : featured
                ? 'border-orange-300 bg-orange-50'
                : 'border-stone-200 bg-white';

  return (
    <div className={cn('rounded-[1.75rem] border p-5 shadow-[0_16px_40px_rgba(120,95,68,0.08)]', palette)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {promo ? (
            <div className="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {promo}
            </div>
          ) : null}
          <div className="break-words text-lg font-black text-stone-900">{title}</div>
          <div className="mt-2 text-base font-semibold text-stone-700">{price}</div>
          <div className="mt-2 break-words text-sm leading-6 text-stone-600">{description}</div>
        </div>
        {featured ? (
          <span className="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-600">
            Current
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
          compact
            ? 'border border-stone-200 bg-stone-900 text-white hover:bg-stone-800'
            : 'border border-orange-200 bg-stone-900 text-white hover:bg-stone-800',
        )}
      >
        {buttonLabel}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function SignalCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: string;
}) {
  const palette =
    tone === 'bullish' || tone === 'low'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'bearish' || tone === 'high'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : tone === 'confidence'
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div className={cn('rounded-[1.5rem] border p-4', palette)}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{title}</div>
      <div className="mt-2 text-2xl font-black capitalize">{value}</div>
    </div>
  );
}

function RetentionCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
      <div className="text-base font-bold text-stone-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-stone-600">{body}</div>
    </div>
  );
}

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
      <div className="text-sm font-bold text-stone-900">{question}</div>
      <div className="mt-2 text-sm leading-6 text-stone-600">{answer}</div>
    </div>
  );
}

function RatingCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4">
      <div className="flex items-center gap-1 text-amber-500">
        <Star size={14} fill="currentColor" />
        <Star size={14} fill="currentColor" />
        <Star size={14} fill="currentColor" />
        <Star size={14} fill="currentColor" />
        <Star size={14} fill="currentColor" className="opacity-70" />
      </div>
      <div className="mt-3 text-sm font-bold text-stone-900">{title}</div>
      <div className="mt-1 text-sm font-semibold text-stone-600">{value}</div>
    </div>
  );
}

function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\b(?:above|below|breakout|breakdown|wait|buy|sell|stop|target|support|resistance)\b|\d[\d,.\-]*)/gi);

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = /^(?:above|below|breakout|breakdown|wait|buy|sell|stop|target|support|resistance)$/i.test(part) || /\d/.test(part);
        if (!part) return null;
        return isHighlight ? (
          <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-1 text-stone-900">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_18px_60px_rgba(120,95,68,0.08)] md:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">{children}</div>;
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{title}</div>
      <div className="mt-2 text-xl font-black capitalize text-stone-900">{value}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-orange-100 bg-white/85 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{label}</div>
      <div className="mt-2 text-2xl font-black capitalize text-stone-900">{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] bg-stone-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{label}</div>
      <div className={cn('mt-2 break-words text-sm font-semibold text-stone-800', multiline && 'leading-6')}>
        {value}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] bg-stone-50 px-4 py-3">
      <div className="text-sm text-stone-500">{label}</div>
          <div className="max-w-[55%] break-words text-right text-sm font-semibold capitalize text-stone-800">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-6 text-stone-600">
      {text}
    </div>
  );
}

function StatTile({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: 'orange' | 'blue' | 'green';
}) {
  const palette =
    accent === 'orange'
      ? 'border-orange-200 bg-orange-50'
      : accent === 'blue'
        ? 'border-sky-200 bg-sky-50'
        : 'border-emerald-200 bg-emerald-50';

  return (
    <div className={cn('rounded-[1.5rem] border p-5', palette)}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{title}</div>
      <div className="mt-2 text-2xl font-black capitalize text-stone-900">{value}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
    >
      {children}
    </button>
  );
}
