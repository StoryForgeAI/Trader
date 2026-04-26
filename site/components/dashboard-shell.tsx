'use client';

import {
  BadgeDollarSign,
  CreditCard,
  ExternalLink,
  ImageUp,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  PackageSearch,
  SearchCheck,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/theme-toggle';
import { CREDIT_PACKS, IMAGE_ANALYSIS_COST, TEXT_ANALYSIS_COST } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import type { AnalysisRecord, DashboardData, ResellAnalysis, UserProfile } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

type ActiveTab = 'dashboard' | 'resell' | 'plans' | 'profile' | 'about';

const tabs: { id: ActiveTab; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'resell', label: 'Resell', icon: <PackageSearch size={18} /> },
  { id: 'plans', label: 'Plans', icon: <CreditCard size={18} /> },
  { id: 'profile', label: 'Profile', icon: <UserRound size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

export function DashboardShell() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
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
      const [{ data: profile, error: profileError }, { data: analyses }] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
      ]);

      if (profileError) throw profileError;

      setDashboard({
        profile: profile as UserProfile,
        subscription: null,
        analyses: (analyses as AnalysisRecord[]) ?? [],
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
      <div className="flex min-h-screen items-center justify-center bg-[#f4fbff] text-slate-700">
        <LoaderCircle className="animate-spin text-sky-500" size={30} />
      </div>
    );
  }

  if (!dashboard) return null;

  const latestAnalysis = dashboard.analyses[0]?.result ?? null;

  return (
    <main className="min-h-screen bg-[#f4fbff] px-0 py-3 md:pr-6 md:py-6">
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
          mobileOpen={mobileMenuOpen}
          profile={dashboard.profile}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          setMobileOpen={setMobileMenuOpen}
          onSignOut={() => void handleSignOut()}
        />

        <div className="min-w-0 flex-1">
          <TopBar busy={busy} onRefresh={() => void loadDashboard()} onToggleSidebar={() => setMobileMenuOpen(true)} />

          {notice ? (
            <div className="mb-4 rounded-[1.5rem] border border-sky-100 bg-sky-50 px-5 py-4 text-sm text-slate-700">
              {notice}
            </div>
          ) : null}

          {activeTab === 'dashboard' ? (
            <DashboardTab profile={dashboard.profile} analyses={dashboard.analyses} latestAnalysis={latestAnalysis} />
          ) : null}

          {activeTab === 'resell' ? <ResellTab /> : null}

          {activeTab === 'plans' ? <PlansTab busy={busy} onCheckout={(id) => void handleCheckout(id)} /> : null}

          {activeTab === 'profile' ? <ProfileTab profile={dashboard.profile} analyses={dashboard.analyses} /> : null}

          {activeTab === 'about' ? <AboutTab /> : null}
        </div>
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
      <aside className="hidden shrink-0 flex-col rounded-[2rem] border border-sky-100 bg-white px-3 py-3 shadow-[0_24px_80px_rgba(117,149,176,0.12)] md:sticky md:top-6 md:flex md:h-[calc(100vh-3rem)] md:w-[280px]">
        <SidebarInner activeTab={activeTab} profile={profile} setActiveTab={setActiveTab} onSignOut={onSignOut} />
      </aside>
      {mobileOpen ? (
        <aside className="fixed inset-y-3 left-3 z-50 flex w-[288px] flex-col rounded-[2rem] border border-sky-100 bg-white px-3 py-3 shadow-[0_24px_80px_rgba(117,149,176,0.16)] md:hidden">
          <div className="mb-5 flex items-center justify-between gap-2 px-2">
            <BrandBlock email={profile.email} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
          </div>
          <SidebarInner activeTab={activeTab} profile={profile} setActiveTab={setActiveTab} onSignOut={onSignOut} hideBrand />
        </aside>
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
              'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition',
              activeTab === tab.id
                ? 'bg-sky-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.24)]'
                : 'text-slate-600 hover:bg-sky-50 hover:text-slate-900',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-3 px-2">
        <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Credits</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{profile.credits}</div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-900">Ready</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-300 text-white">
        <PackageSearch size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Scan Sell AI</div>
        <div className="break-all text-xs text-slate-500">{email}</div>
      </div>
    </div>
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
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.75rem] border border-sky-100 bg-white px-4 py-3 shadow-[0_20px_60px_rgba(117,149,176,0.10)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <span className={cn('h-2.5 w-2.5 rounded-full bg-emerald-500', busy && 'animate-pulse')} />
          {busy ? 'Working' : 'Ready'}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-sky-100"
        >
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
    <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
      <Card className="bg-gradient-to-br from-[#f5fbff] via-white to-[#ecf9ff]">
        <SectionEyebrow>Welcome back</SectionEyebrow>
        <h2 className="mt-3 text-3xl font-black text-slate-900">Your resale research hub is ready.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Start with an image when you need recognition. Use text when you already know the product name and want a cheaper estimate.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Credits" value={String(profile.credits)} />
          <MetricCard label="Image tool" value={`${IMAGE_ANALYSIS_COST} credits`} />
          <MetricCard label="Text tool" value={`${TEXT_ANALYSIS_COST} credits`} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard
            title="Image to Analysis"
            body="Best when you have a product photo or supplier image and need the AI to identify the item for you."
            href="/imagetoanalisis"
            cta="Open image tool"
            icon={<ImageUp size={18} />}
          />
          <InfoCard
            title="Text to Analysis"
            body="Best when you already know the product name and want to save credits while checking resale potential."
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
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-500">Product</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{latestAnalysis.productName}</div>
              <div className="mt-2 text-sm text-slate-600">{latestAnalysis.productSummary}</div>
            </div>
            <MiniBars
              items={[
                { label: 'Demand', value: latestAnalysis.demandScore },
                { label: 'Margin', value: latestAnalysis.marginScore },
                { label: 'Speed', value: latestAnalysis.resaleSpeedScore },
              ]}
            />
          </div>
        ) : (
          <EmptyState text="Run your first resale analysis to see a quick product summary here." />
        )}

        <div className="mt-5">
          <SectionEyebrow>Saved ideas</SectionEyebrow>
          <div className="mt-3 space-y-3">
            {analyses.length ? (
              analyses.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900">{item.result.productName}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.result.recommendedSellPrice}</div>
                  <div className="mt-2 text-xs text-slate-500">{formatDate(item.created_at)}</div>
                </div>
              ))
            ) : (
              <EmptyState text="Your saved product analyses will show up here." />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ResellTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ToolCard
        title="Image to Analysis"
        body="Upload a product image to identify the item, estimate its value, get a suggested resale price, and generate a short ad script."
        href="/imagetoanalisis"
        badge={`${IMAGE_ANALYSIS_COST} credits`}
        icon={<ImageUp size={20} />}
      />
      <ToolCard
        title="Text to Analysis"
        body="Type the product name or a short product description to get a lower-cost resale estimate without using image recognition."
        href="/texttoanalisis"
        badge={`${TEXT_ANALYSIS_COST} credits`}
        icon={<SearchCheck size={20} />}
      />
    </div>
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
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#f5fbff] to-white">
        <SectionEyebrow>Credits</SectionEyebrow>
        <h2 className="mt-3 text-3xl font-black text-slate-900">Simple one-time credit packs</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          No subscription. Buy credits once, use them whenever you want, and top up only when you need more resale research.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={cn(
              'rounded-[1.9rem] border p-5 shadow-[0_18px_44px_rgba(120,142,168,0.10)]',
              pack.id === 'pack_500'
                ? 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white'
                : pack.id === 'pack_150'
                  ? 'border-sky-200 bg-gradient-to-br from-sky-50 to-white'
                  : 'border-slate-200 bg-white',
            )}
          >
            {pack.badge ? (
              <div className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {pack.badge}
              </div>
            ) : null}
            <div className="text-2xl font-black text-slate-900">{pack.title}</div>
            <div className="mt-2 text-lg font-semibold text-slate-700">{pack.priceLabel}</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">{pack.description}</div>
            <button
              type="button"
              onClick={() => onCheckout(pack.id)}
              disabled={busy}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <SectionEyebrow>Profile</SectionEyebrow>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Account details</h2>
        <div className="mt-6 space-y-3">
          <InfoLine label="Email" value={profile.email} />
          <InfoLine label="Credits" value={String(profile.credits)} />
          <InfoLine label="Saved analyses" value={String(analyses.length)} />
          <InfoLine label="Member since" value={formatDate(profile.created_at)} />
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Progress</SectionEyebrow>
        <h3 className="mt-3 text-2xl font-black text-slate-900">How ready you are to research more products</h3>
        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
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
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="bg-gradient-to-br from-[#f5fbff] to-white">
        <SectionEyebrow>About</SectionEyebrow>
        <h2 className="mt-3 text-3xl font-black text-slate-900">What Scan Sell AI does</h2>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
          <AboutRow
            title="Identify product ideas"
            body="Use the image tool when you have a photo or screenshot and want the AI to identify the product."
          />
          <AboutRow
            title="Save credits with text"
            body="Use the text tool when you already know the product name and only need the resale estimate."
          />
          <AboutRow
            title="Sell faster"
            body="Get an estimated price, a stronger selling price, a quick ad script, and an AliExpress search link."
          />
        </div>
      </Card>

      <Card>
        <SectionEyebrow>Beginner-friendly</SectionEyebrow>
        <h3 className="mt-3 text-2xl font-black text-slate-900">Made for simple resale decisions</h3>
        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <BarsChart
            items={[
              { label: 'Product clarity', value: 91 },
              { label: 'Price guidance', value: 88 },
              { label: 'Ad script usefulness', value: 85 },
            ]}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Step 1" value="Pick tool" />
          <MetricCard label="Step 2" value="Get estimate" />
          <MetricCard label="Step 3" value="List product" />
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
    <div className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_20px_60px_rgba(117,149,176,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">{icon}</div>
        <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {badge}
        </div>
      </div>
      <div className="mt-5 text-2xl font-black text-slate-900">{title}</div>
      <div className="mt-3 text-sm leading-7 text-slate-600">{body}</div>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">{icon}</div>
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{body}</div>
      <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800">
        {cta}
        <ExternalLink size={14} />
      </Link>
    </div>
  );
}

function AboutRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{body}</div>
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

function MiniBars({ items }: { items: { label: string; value: number }[] }) {
  return <BarsChart items={items} />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
      {text}
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">{children}</div>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(120,142,168,0.08)] md:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 break-words text-2xl font-black capitalize text-slate-900">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] bg-slate-50 px-4 py-3">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="max-w-[55%] break-words text-right text-sm font-semibold capitalize text-slate-800">{value}</div>
    </div>
  );
}
