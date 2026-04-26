'use client';

import {
  ArrowRight,
  BadgeDollarSign,
  CircleHelp,
  CreditCard,
  ExternalLink,
  ImageUp,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  PackageSearch,
  Plus,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { CREDIT_PACKS, IMAGE_ANALYSIS_COST, TEXT_ANALYSIS_COST } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import type {
  AnalysisRecord,
  DashboardData,
  ResellAnalysis,
  ResellChatRecord,
  UserProfile,
} from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

type ActiveTab = 'dashboard' | 'resell' | 'plans' | 'profile' | 'about';
type PendingAttachment = { file: File; name: string };

const tabs: { id: ActiveTab; label: string; icon: ReactNode; hint: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, hint: 'Overview and latest signals' },
  { id: 'resell', label: 'Resell', icon: <PackageSearch size={18} />, hint: 'Tools and resell chat' },
  { id: 'plans', label: 'Plans', icon: <CreditCard size={18} />, hint: 'Top up credits anytime' },
  { id: 'profile', label: 'Profile', icon: <UserRound size={18} />, hint: 'Account details and progress' },
  { id: 'about', label: 'About', icon: <Info size={18} />, hint: 'How the product helps' },
];

const greetings = [
  'Welcome back',
  'Good to see you again',
  'Glad you are back',
  'Ready for the next winner?',
  'Back in the lab',
  'Let us find the next product',
];

export function DashboardShell() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [notice, setNotice] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)] ?? 'Welcome back');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success') {
      setNotice('Credits were added successfully. You can start scanning new products now.');
      setActiveTab('plans');
      params.delete('checkout');
      window.history.replaceState({}, '', `${window.location.pathname}`);
    } else if (checkout === 'canceled') {
      setNotice('Checkout was canceled.');
      setActiveTab('plans');
      params.delete('checkout');
      window.history.replaceState({}, '', `${window.location.pathname}`);
    }
  }, []);

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
      const [{ data: profile, error: profileError }, { data: analyses }, { data: resellChats }] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
        supabase.from('resell_chats').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(24),
      ]);

      if (profileError) throw profileError;

      setDashboard({
        profile: profile as UserProfile,
        subscription: null,
        analyses: (analyses as AnalysisRecord[]) ?? [],
        resellChats: (resellChats as ResellChatRecord[]) ?? [],
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(productId: string) {
    setBusy(true);
    setNotice(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId, mode: 'payment' },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Missing Stripe checkout URL.');
      window.location.href = data.url as string;
    } catch (error) {
      setBusy(false);
      setNotice(error instanceof Error ? error.message : 'Could not open checkout.');
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-[var(--text-2)]">
        <div className="float-orb absolute -left-14 top-24 h-48 w-48 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="float-orb-delayed absolute right-[-5rem] top-20 h-72 w-72 rounded-full bg-[var(--sky-soft)] blur-3xl" />
        <div className="surface-strong flex items-center gap-3 rounded-[1.8rem] px-6 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
          <LoaderCircle className="animate-spin text-[var(--accent)]" size={26} />
          <span className="text-sm font-semibold">Loading your resell dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const latestAnalysis = dashboard.analyses[0]?.result ?? null;

  return (
    <main className="relative min-h-screen overflow-x-clip px-3 pb-8 pt-3 sm:px-4 md:px-6 md:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid-fade absolute inset-x-0 top-0 h-[36rem] opacity-70" />
        <div className="float-orb absolute -left-16 top-24 h-52 w-52 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="float-orb-delayed absolute right-[-5rem] top-32 h-72 w-72 rounded-full bg-[var(--sky-soft)] blur-3xl" />
        <div className="float-orb absolute bottom-12 left-1/3 h-44 w-44 rounded-full bg-[rgba(250,204,21,0.12)] blur-3xl" />
      </div>

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close mobile menu overlay"
          className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.36)] backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <div className="relative mx-auto flex w-full max-w-[1600px] gap-4 lg:gap-5">
        <Sidebar
          activeTab={activeTab}
          mobileOpen={mobileMenuOpen}
          profile={dashboard.profile}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          setMobileOpen={setMobileMenuOpen}
          onSignOut={() => void handleSignOut()}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="min-w-0 flex-1"
        >
          <TopBar
            activeTabLabel={activeTabMeta.label}
            activeTabHint={activeTabMeta.hint}
            busy={busy}
            credits={dashboard.profile.credits}
            email={dashboard.profile.email}
            greeting={greeting}
            onRefresh={() => void loadDashboard()}
            onToggleSidebar={() => setMobileMenuOpen(true)}
          />

          {notice ? (
            <div className="surface-strong mb-4 rounded-[1.6rem] px-5 py-4 text-sm leading-7 text-[var(--text-2)] shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
              {notice}
            </div>
          ) : null}

          {activeTab === 'dashboard' ? (
            <DashboardTab profile={dashboard.profile} analyses={dashboard.analyses} latestAnalysis={latestAnalysis} />
          ) : null}

          {activeTab === 'resell' ? (
            <ResellTab
              profile={dashboard.profile}
              chats={dashboard.resellChats ?? []}
              onDashboardRefresh={() => void loadDashboard()}
            />
          ) : null}

          {activeTab === 'plans' ? <PlansTab busy={busy} onCheckout={(id) => void handleCheckout(id)} /> : null}

          {activeTab === 'profile' ? <ProfileTab profile={dashboard.profile} analyses={dashboard.analyses} /> : null}

          {activeTab === 'about' ? <AboutTab /> : null}
        </motion.div>
      </div>
    </main>
  );
}

function Sidebar({
  activeTab,
  mobileOpen,
  profile,
  setActiveTab,
  setMobileOpen,
  onSignOut,
}: {
  activeTab: ActiveTab;
  mobileOpen: boolean;
  profile: UserProfile;
  setActiveTab: (tab: ActiveTab) => void;
  setMobileOpen: (value: boolean) => void;
  onSignOut: () => void;
}) {
  return (
    <>
      <aside className="glass panel-sheen hidden shrink-0 flex-col rounded-[2.2rem] px-3 py-3 shadow-[0_24px_90px_rgba(15,23,42,0.10)] md:sticky md:top-6 md:flex md:h-[calc(100vh-3rem)] md:w-[296px]">
        <SidebarInner activeTab={activeTab} profile={profile} setActiveTab={setActiveTab} onSignOut={onSignOut} />
      </aside>
      {mobileOpen ? (
        <motion.aside
          initial={{ opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.24 }}
          className="glass fixed inset-y-3 left-3 z-50 flex w-[min(90vw,304px)] flex-col rounded-[2.2rem] px-3 py-3 shadow-[0_24px_90px_rgba(15,23,42,0.18)] md:hidden"
        >
          <div className="mb-5 flex items-center justify-between gap-2 px-2">
            <BrandBlock email={profile.email} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[var(--surface-soft)] text-[var(--text-2)]"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
          </div>
          <SidebarInner activeTab={activeTab} profile={profile} setActiveTab={setActiveTab} onSignOut={onSignOut} hideBrand />
        </motion.aside>
      ) : null}
    </>
  );
}

function SidebarInner({
  activeTab,
  profile,
  setActiveTab,
  onSignOut,
  hideBrand = false,
}: {
  activeTab: ActiveTab;
  profile: UserProfile;
  setActiveTab: (tab: ActiveTab) => void;
  onSignOut: () => void;
  hideBrand?: boolean;
}) {
  return (
    <>
      {!hideBrand ? (
        <div className="mb-5 px-2">
          <BrandBlock email={profile.email} />
        </div>
      ) : null}

      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-[1.35rem] px-3 py-3 text-left text-sm font-semibold transition',
              activeTab === tab.id
                ? 'bg-[linear-gradient(135deg,var(--accent),#f59e0b)] text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)]'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-1)]',
            )}
          >
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', activeTab === tab.id ? 'bg-white/16' : 'bg-[var(--surface-soft)]')}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 px-2">
        <div className="surface-soft rounded-[1.6rem] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Credits</div>
          <div className="mt-2 font-display text-3xl font-semibold text-[var(--text-1)]">{profile.credits}</div>
          <div className="mt-2 text-sm text-[var(--text-2)]">Ready for a new scan, lookup, or AI resell question.</div>
        </div>

        <div className="surface-soft rounded-[1.5rem] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
            Workspace ready
          </div>
          <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">Everything here is focused on quick product research and faster listing decisions.</div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex w-full items-center justify-center gap-3 rounded-[1.3rem] border border-[color:var(--line)] bg-[var(--surface-strong)] px-3 py-3 text-sm font-semibold text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </>
  );
}

function BrandBlock({ email }: { email: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-400 to-sky-400 text-white shadow-[0_18px_40px_rgba(249,115,22,0.24)]">
        <PackageSearch size={20} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Scan Sell AI</div>
        <div className="break-all text-xs text-[var(--text-3)]">{email}</div>
      </div>
    </div>
  );
}

function TopBar({
  activeTabLabel,
  activeTabHint,
  busy,
  credits,
  email,
  greeting,
  onRefresh,
  onToggleSidebar,
}: {
  activeTabLabel: string;
  activeTabHint: string;
  busy: boolean;
  credits: number;
  email: string;
  greeting: string;
  onRefresh: () => void;
  onToggleSidebar: () => void;
}) {
  return (
    <div className="glass mb-4 flex flex-col gap-3 rounded-[1.9rem] px-4 py-4 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[var(--surface-soft)] text-[var(--text-2)] md:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{activeTabLabel}</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--text-1)] sm:text-3xl">
            <span className="block">{greeting}</span>
            <span className="mt-1 block break-all text-base font-medium tracking-normal text-[var(--text-2)] sm:text-lg">
              {email}
            </span>
          </div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{activeTabHint}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-[var(--success)]">
          <span className={cn('h-2.5 w-2.5 rounded-full bg-emerald-500', busy && 'animate-pulse')} />
          {busy ? 'Working' : 'Ready'}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-2)]">
          <BadgeDollarSign size={15} className="text-[var(--accent)]" />
          {credits} credits
        </div>
        <ThemeToggle />
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--text-1)] px-4 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-black/90"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
    </div>
  );
}

function DashboardTab({
  profile,
  analyses,
  latestAnalysis,
}: {
  profile: UserProfile;
  analyses: AnalysisRecord[];
  latestAnalysis: ResellAnalysis | null;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="panel-sheen overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.74))]">
          <SectionEyebrow>Welcome back</SectionEyebrow>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-1)] sm:text-4xl">
            Your resell research hub feels sharper now, and it moves faster with you.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-2)] sm:text-base">
            Jump into image recognition when you need discovery, switch to text when you already know the product, and keep your next decision close at hand.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard icon={<BadgeDollarSign size={18} />} label="Credits" value={String(profile.credits)} />
            <MetricCard icon={<ImageUp size={18} />} label="Image tool" value={`${IMAGE_ANALYSIS_COST} credits`} />
            <MetricCard icon={<SearchCheck size={18} />} label="Text tool" value={`${TEXT_ANALYSIS_COST} credits`} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard
              title="Image to Analysis"
              body="Best when you have a supplier image, screenshot, or product photo and want the AI to identify what you are looking at."
              href="/imagetoanalisis"
              cta="Open image tool"
              icon={<ImageUp size={18} />}
            />
            <InfoCard
              title="Text to Analysis"
              body="Best when you already know the product name and want a lower-cost resell check without needing image recognition."
              href="/texttoanalisis"
              cta="Open text tool"
              icon={<SearchCheck size={18} />}
            />
          </div>
        </Card>

        <Card>
          <SectionEyebrow>Latest result</SectionEyebrow>
          {latestAnalysis ? (
            <div className="mt-4 space-y-4">
              <div className="surface-soft rounded-[1.6rem] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">Product</div>
                <div className="mt-3 font-display text-2xl font-semibold text-[var(--text-1)]">{latestAnalysis.productName}</div>
                <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{latestAnalysis.productSummary}</div>
              </div>
              <div className="surface-soft rounded-[1.6rem] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--text-1)]">Signal strength</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">Demand, margin, speed</div>
                </div>
                <MiniBars
                  items={[
                    { label: 'Demand', value: latestAnalysis.demandScore },
                    { label: 'Margin', value: latestAnalysis.marginScore },
                    { label: 'Speed', value: latestAnalysis.resaleSpeedScore },
                  ]}
                />
              </div>
            </div>
          ) : (
            <EmptyState text="Run your first resell analysis to see a quick product summary and score snapshot here." />
          )}

          <div className="mt-5">
            <SectionEyebrow>Saved ideas</SectionEyebrow>
            <div className="mt-3 space-y-3">
              {analyses.length ? (
                analyses.slice(0, 4).map((item) => (
                  <div key={item.id} className="surface-soft rounded-[1.35rem] p-4">
                    <div className="font-semibold text-[var(--text-1)]">{item.result.productName}</div>
                    <div className="mt-1 text-sm text-[var(--text-2)]">{item.result.recommendedSellPrice}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{formatDate(item.created_at)}</div>
                  </div>
                ))
              ) : (
                <EmptyState text="Your saved product analyses will show up here once you start scanning ideas." />
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HighlightCard
          icon={<Zap size={18} />}
          title="Faster routing"
          body="The refreshed layout makes it easier to tell where to scan, where to chat, and where to top up."
        />
        <HighlightCard
          icon={<ShieldCheck size={18} />}
          title="Cleaner mobile flow"
          body="Cards stack with more breathing room, controls are easier to hit, and the sidebar behaves better on phones."
        />
        <HighlightCard
          icon={<TrendingUp size={18} />}
          title="Better focus"
          body="Latest results, recent ideas, and action buttons now read as one guided workflow instead of separate boxes."
        />
      </div>
    </div>
  );
}

function ResellTab({
  profile,
  chats,
  onDashboardRefresh,
}: {
  profile: UserProfile;
  chats: ResellChatRecord[];
  onDashboardRefresh: () => void;
}) {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.76))]">
        <SectionEyebrow>Resell workspace</SectionEyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-1)] sm:text-4xl">
          Tools and chat now feel like part of the same flow.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-2)] sm:text-base">
          Start with a scan when you need product clarity, then keep the momentum with focused AI chat for pricing, sourcing, or listing strategy.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ToolCard
          title="Image to Analysis"
          body="Upload a product image to identify the item, estimate its value, get a suggested resell price, and generate a short ad script."
          href="/imagetoanalisis"
          badge={`${IMAGE_ANALYSIS_COST} credits`}
          icon={<ImageUp size={20} />}
        />
        <ToolCard
          title="Text to Analysis"
          body="Type the product name or a short product description to get a lower-cost resell estimate without using image recognition."
          href="/texttoanalisis"
          badge={`${TEXT_ANALYSIS_COST} credits`}
          icon={<SearchCheck size={20} />}
        />
      </div>

      <ResellChatPanel profile={profile} chats={chats} onDashboardRefresh={onDashboardRefresh} />
    </div>
  );
}

function ResellChatPanel({
  profile,
  chats,
  onDashboardRefresh,
}: {
  profile: UserProfile;
  chats: ResellChatRecord[];
  onDashboardRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestAnswerRef = useRef<HTMLDivElement | null>(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ file: File; previewUrl: string; name: string } | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('Preparing your resell assistant...');
  const [shouldScrollToLatest, setShouldScrollToLatest] = useState(false);

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, [attachment]);

  useEffect(() => {
    if (!busy) {
      setLoadingStatus('Preparing your resell assistant...');
      return;
    }

    const labels = [
      'Reading your resell question...',
      'Checking pricing and margin angles...',
      'Thinking about supplier options...',
      'Building your answer...',
    ];

    setLoadingStatus(labels[0]);
    const timers = labels.slice(1).map((label, index) =>
      window.setTimeout(() => setLoadingStatus(label), (index + 1) * 1200),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [busy]);

  useEffect(() => {
    if (!shouldScrollToLatest || !chats.length) return;

    const timeout = window.setTimeout(() => {
      latestAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToLatest(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [chats, shouldScrollToLatest]);

  async function validateAndSetAttachment(file: File | null) {
    if (!file) return;

    const maxSizeBytes = 6 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setMessage('The image is too large. Maximum size is 6 MB.');
      return;
    }

    const dimensions = await readImageDimensions(file);
    if (dimensions.width > 3000 || dimensions.height > 3000) {
      setMessage('The image resolution is too high. Maximum resolution is 3000x3000.');
      return;
    }

    setPendingAttachment({
      file,
      name: file.name,
    });
  }

  function confirmAttachment() {
    if (!pendingAttachment) return;

    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    setAttachment({
      file: pendingAttachment.file,
      previewUrl: URL.createObjectURL(pendingAttachment.file),
      name: pendingAttachment.name,
    });
    setPendingAttachment(null);
    setMessage('Image attached. It will add 5 credits to this chat question.');
  }

  function cancelAttachment() {
    setPendingAttachment(null);
    setMessage('Image upload canceled.');
  }

  async function handleSubmit() {
    if (!question.trim()) {
      setMessage('Please type your resell question first.');
      return;
    }

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

      let attachmentPath: string | null = null;
      if (attachment?.file) {
        const safeName = attachment.file.name.replace(/\s+/g, '-');
        attachmentPath = `${user.id}/chat-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(attachmentPath, attachment.file, {
          upsert: false,
          contentType: attachment.file.type || 'image/png',
        });
        if (uploadError) throw uploadError;
      }

      const response = await fetch('/api/resell/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question: question.trim(),
          attachmentPath,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Chat request failed.');
      }

      setQuestion('');
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      setAttachment(null);
      setMessage(`Answer ready. ${data.totalCost} credits were used for this chat.`);
      setShouldScrollToLatest(true);
      onDashboardRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Chat request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="signal-card relative overflow-hidden">
      <SignalTraces />
      {pendingAttachment ? (
        <AttachmentConfirmModal
          fileName={pendingAttachment.name}
          onConfirm={confirmAttachment}
          onCancel={cancelAttachment}
        />
      ) : null}
      {busy ? <ResellChatLoadingOverlay status={loadingStatus} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionEyebrow>Resell chat</SectionEyebrow>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--text-1)] sm:text-3xl">
            Ask resell questions like a focused GPT.
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-2)] sm:text-base">
            This AI stays locked on reselling, pricing, product picks, listing strategy, and supplier guidance. Each question costs between 1 and 25 credits depending on difficulty. Image attachments add 5 credits.
          </p>
        </div>
        <div className="rounded-full border border-[color:var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-2)]">
          Current credits: {profile.credits}
        </div>
      </div>

      <div className="surface-soft mt-6 rounded-[1.8rem] p-4 shadow-[0_14px_35px_rgba(15,23,42,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] transition hover:translate-y-[-1px]"
            aria-label="Add image"
          >
            <Plus size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder="Example: Is this product good for reselling on TikTok Shop, and how would you price it?"
              className="w-full rounded-[1.5rem] border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-4 text-[var(--text-1)] outline-none transition placeholder:text-[var(--text-3)] focus:border-[var(--accent)]"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const pickedFile = event.target.files?.[0] ?? null;
                event.currentTarget.value = '';
                void validateAndSetAttachment(pickedFile);
              }}
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {attachment ? (
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-2)]">
                  <ImageUp size={14} className="text-[var(--accent)]" />
                  <span className="truncate">{attachment.name} (+5 credits)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-3)]">
                  Max 6 MB, max 3000x3000
                </div>
              )}

              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-2)]">
                <CircleHelp size={14} className="text-[var(--accent)]" />
                Dynamic cost: 1-25 credits
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-stretch sm:justify-end">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--text-1)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <MessageSquareText size={16} />}
            Ask AI
          </button>
        </div>
      </div>

      {message ? (
        <div className="surface-soft mt-4 rounded-[1.35rem] px-4 py-3 text-sm leading-7 text-[var(--text-2)]">
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {chats.length ? (
          chats.map((chat, index) => (
            <div
              key={chat.id}
              ref={index === 0 ? latestAnswerRef : null}
              className="surface-soft rounded-[1.7rem] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {formatDate(chat.created_at)}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-2)]">
                  {chat.total_cost} credits used
                </div>
              </div>
              <div className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">Your question</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-1)]">{chat.question}</div>
              </div>
              <div className="mt-3 rounded-[1.25rem] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">AI answer</div>
                <div className="mt-2 space-y-3 text-sm leading-7 text-[var(--text-1)]">
                  <FormattedChatAnswer answer={chat.answer} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="Your resell chat answers will appear here with the original question and the date." />
        )}
      </div>
    </Card>
  );
}

function ResellChatLoadingOverlay({ status }: { status: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,10,22,0.32)] backdrop-blur-md">
      <div className="surface-strong relative flex w-[min(92vw,430px)] flex-col items-center overflow-hidden rounded-[2.1rem] px-8 py-10 text-center shadow-[0_30px_110px_rgba(15,23,42,0.18)]">
        <div className="float-orb absolute -left-10 top-10 h-24 w-24 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="float-orb-delayed absolute -right-6 bottom-8 h-28 w-28 rounded-full bg-[var(--sky-soft)] blur-3xl" />

        <div className="relative mb-8 h-28 w-28">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.3, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-orange-400 border-r-amber-300"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.7, ease: 'linear' }}
            className="absolute inset-3 rounded-full border-[5px] border-transparent border-b-sky-500 border-l-cyan-300"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: 'linear' }}
            className="absolute inset-[26px] rounded-full border-[4px] border-transparent border-t-amber-400"
          />
          <div className="absolute inset-[34px] rounded-full bg-gradient-to-br from-orange-100 to-sky-50 shadow-inner" />
        </div>

        <div className="font-display text-xl font-semibold text-[var(--text-1)]">Resell AI is working</div>
        <div className="mt-3 text-sm font-medium text-[var(--text-2)]">{status}</div>
      </div>
    </div>
  );
}

function AttachmentConfirmModal({
  fileName,
  onConfirm,
  onCancel,
}: {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,10,22,0.34)] px-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
        className="surface-strong w-full max-w-md rounded-[2rem] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.20)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <ImageUp size={20} />
        </div>
        <div className="mt-4 font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--text-1)]">
          Upload this image?
        </div>
        <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">
          This attachment will add 5 credits to your next resell chat question.
        </div>
        <div className="surface-soft mt-4 rounded-[1.4rem] px-4 py-3 text-sm font-semibold text-[var(--text-1)]">
          {fileName}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[var(--text-1)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-black/90"
          >
            Yes, attach it
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[var(--surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormattedChatAnswer({ answer }: { answer: string }) {
  const lines = answer.split('\n').filter((line) => line.trim().length > 0);

  return (
    <>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('â€˘ ');
        const content = isBullet ? trimmed.slice(2).trim() : trimmed;

        return (
          <div
            key={`${index}-${trimmed}`}
            className={cn(
              'text-sm leading-7 text-[var(--text-1)]',
              isBullet && 'rounded-[1rem] border border-[color:var(--line)] bg-[var(--surface-soft)] px-3 py-2',
            )}
          >
            {isBullet ? <span className="mr-2 text-[var(--accent)]">â€˘</span> : null}
            <InlineBoldText text={content} />
          </div>
        );
      })}
    </>
  );
}

function InlineBoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span
              key={`${part}-${index}`}
              className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-bold text-[var(--text-1)]"
            >
              {part.slice(2, -2)}
            </span>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function PlansTab({
  busy,
  onCheckout,
}: {
  busy: boolean;
  onCheckout: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.76))]">
        <SectionEyebrow>Credits</SectionEyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-1)] sm:text-4xl">
          Simple one-time credit packs.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-2)] sm:text-base">
          No subscription. Buy credits once, use them whenever you want, and top up only when you need more resell research.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={cn(
              'signal-card surface-strong flex min-h-[240px] flex-col justify-between rounded-[1.9rem] p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)]',
              pack.id === 'pack_500'
                ? 'bg-[linear-gradient(180deg,rgba(251,146,60,0.12),rgba(255,255,255,0.90))]'
                : pack.id === 'pack_150'
                  ? 'bg-[linear-gradient(180deg,rgba(56,189,248,0.12),rgba(255,255,255,0.90))]'
                  : '',
            )}
          >
            <SignalTraces />
            <div>
              {pack.badge ? (
                <div className="mb-4 inline-flex rounded-full border border-[color:var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                  {pack.badge}
                </div>
              ) : null}
              <div className="font-display text-2xl font-semibold text-[var(--text-1)]">{pack.title}</div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-2)]">{pack.priceLabel}</div>
              <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{pack.description}</div>
            </div>
            <button
              type="button"
              onClick={() => onCheckout(pack.id)}
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--text-1)] px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Buy credits
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  analyses,
}: {
  profile: UserProfile;
  analyses: AnalysisRecord[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <SectionEyebrow>Profile</SectionEyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--text-1)]">
          Account details
        </h2>
        <div className="mt-6 space-y-3">
          <InfoLine label="Email" value={profile.email} />
          <InfoLine label="Credits" value={String(profile.credits)} />
          <InfoLine label="Saved analyses" value={String(analyses.length)} />
          <InfoLine label="Member since" value={formatDate(profile.created_at)} />
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Progress</SectionEyebrow>
        <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--text-1)]">
          How ready you are to research more products
        </h3>
        <div className="surface-soft mt-6 rounded-[1.8rem] p-5">
          <BarsChart
            items={[
              { label: 'Credits available', value: Math.min(100, profile.credits) },
              { label: 'Saved product ideas', value: Math.min(100, analyses.length * 12) },
              { label: 'Research momentum', value: Math.min(100, 30 + analyses.length * 8) },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.76))]">
        <SectionEyebrow>About</SectionEyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-1)] sm:text-4xl">
          What Scan Sell AI actually helps you do.
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--text-2)]">
          <AboutRow
            title="Identify product ideas"
            body="Use the image tool when you have a photo or screenshot and want the AI to identify the product."
          />
          <AboutRow
            title="Save credits with text"
            body="Use the text tool when you already know the product name and only need the resell estimate."
          />
          <AboutRow
            title="Sell faster"
            body="Get an estimated price, a stronger selling price, a quick ad script, and an AliExpress search link."
          />
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Beginner-friendly</SectionEyebrow>
        <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--text-1)]">
          Made for simple resell decisions
        </h3>
        <div className="surface-soft mt-6 rounded-[1.8rem] p-5">
          <BarsChart
            items={[
              { label: 'Product clarity', value: 91 },
              { label: 'Price guidance', value: 88 },
              { label: 'Ad script usefulness', value: 85 },
            ]}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard icon={<Sparkles size={18} />} label="Step 1" value="Pick tool" />
          <MetricCard icon={<TrendingUp size={18} />} label="Step 2" value="Get estimate" />
          <MetricCard icon={<ArrowRight size={18} />} label="Step 3" value="List product" />
        </div>
      </Card>
    </div>
  );
}

function ToolCard({
  title,
  body,
  href,
  badge,
  icon,
}: {
  title: string;
  body: string;
  href: string;
  badge: string;
  icon: ReactNode;
}) {
  return (
    <div className="signal-card surface-strong rounded-[1.7rem] p-4 shadow-[0_20px_64px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:p-6">
      <SignalTraces />
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">{icon}</div>
        <div className="rounded-full border border-[color:var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-2)]">
          {badge}
        </div>
      </div>
      <div className="mt-4 font-display text-lg font-semibold leading-tight text-[var(--text-1)] sm:mt-5 sm:text-2xl">{title}</div>
      <div className="mt-3 text-xs leading-6 text-[var(--text-2)] sm:text-sm sm:leading-7">{body}</div>
      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--text-1)] px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-black/90 sm:mt-5 sm:w-auto"
      >
        Open tool
      </Link>
    </div>
  );
}

function InfoCard({
  title,
  body,
  href,
  cta,
  icon,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: ReactNode;
}) {
  return (
    <div className="surface-soft rounded-[1.7rem] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">{icon}</div>
      <div className="font-display text-xl font-semibold text-[var(--text-1)]">{title}</div>
      <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{body}</div>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
      >
        {cta}
        <ExternalLink size={14} />
      </Link>
    </div>
  );
}

function AboutRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface-soft rounded-[1.5rem] p-4">
      <div className="font-semibold text-[var(--text-1)]">{title}</div>
      <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{body}</div>
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-strong rounded-[1.8rem] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-[var(--text-1)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{body}</p>
    </div>
  );
}

function SignalTraces() {
  return (
    <div className="signal-shell" aria-hidden="true">
      <div className="signal-outline" />
      <div className="signal-outline signal-delay-1" />
      <div className="signal-outline signal-delay-2" />
    </div>
  );
}

function BarsChart({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--text-2)]">{item.label}</span>
            <span className="font-semibold text-[var(--text-3)]">{item.value}%</span>
          </div>
          <div className="h-3 rounded-full bg-[rgba(148,163,184,0.18)]">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400"
              style={{ width: `${Math.max(8, Math.min(100, item.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniBars({ items }: { items: { label: string; value: number }[] }) {
  return <BarsChart items={items} />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="surface-soft rounded-[1.5rem] p-5 text-sm leading-7 text-[var(--text-2)]">
      {text}
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{children}</div>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'surface-strong rounded-[2.1rem] p-5 shadow-[0_22px_74px_rgba(15,23,42,0.08)] md:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-soft rounded-[1.5rem] px-5 py-4">
      <div className="flex items-center gap-2 text-[var(--accent-strong)]">{icon}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{label}</div>
      <div className="mt-2 break-words font-display text-2xl font-semibold text-[var(--text-1)]">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-soft flex items-center justify-between gap-4 rounded-[1.25rem] px-4 py-3">
      <div className="text-sm text-[var(--text-3)]">{label}</div>
      <div className="max-w-[58%] break-words text-right text-sm font-semibold text-[var(--text-1)]">{value}</div>
    </div>
  );
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const result = { width: image.width, height: image.height };
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image dimensions.'));
    };

    image.src = objectUrl;
  });
}
