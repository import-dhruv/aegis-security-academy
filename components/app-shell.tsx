'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flame, Menu, Search, ShieldAlert, Sparkles, X } from 'lucide-react';
import { ethicsNav, navGroups } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon';
import { CommandPalette } from '@/components/command-palette';
import { useProgress } from '@/components/providers';
import { ProgressBar } from '@/components/ui';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { stats, state } = useProgress();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-ink-800 px-5">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-mint-500/30 bg-mint-500/10">
            <ShieldAlert className="h-5 w-5 text-mint-400" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-50">AEGIS<span className="text-mint-400">.</span></div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Security Academy</div>
          </div>
        </Link>
      </div>

      <div className="border-b border-ink-800 px-5 py-4">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="label">Level {stats.level} · Progress</span>
          <span className="font-mono text-mint-400">{stats.overallPct}%</span>
        </div>
        <ProgressBar value={stats.overallPct} />
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
          <span>{stats.mastered}/{stats.totalChapters} chapters mastered</span>
          <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> {state.streak}d</span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="label px-3 pb-2">{group.title}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors',
                      active ? 'bg-mint-500/10 font-medium text-mint-300' : 'text-muted hover:bg-ink-800/70 hover:text-slate-200',
                    )}
                  >
                    <Icon name={item.icon} className={cn('h-4 w-4 shrink-0', active ? 'text-mint-400' : 'text-ink-600 group-hover:text-slate-400')} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <div className="label px-3 pb-2">Mandatory</div>
          <Link
            href={ethicsNav.href}
            onClick={onNavigate}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors',
              pathname === ethicsNav.href ? 'bg-amber-500/10 text-amber-300' : 'text-muted hover:bg-ink-800/70 hover:text-slate-200')}
          >
            <Icon name={ethicsNav.icon} className="h-4 w-4 shrink-0 text-amber-500/80" />
            {ethicsNav.label}
          </Link>
        </div>
      </nav>

      <div className="border-t border-ink-800 p-3">
        <Link href="/tutor" onClick={onNavigate} className="flex items-center gap-3 rounded-lg border border-cyanx-500/20 bg-cyanx-500/[0.06] px-3 py-2.5 text-[13px] text-cyanx-300 transition hover:bg-cyanx-500/10">
          <Sparkles className="h-4 w-4" /> AI Tutor <span className="ml-auto font-mono text-[10px] text-muted">3 modes</span>
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { state } = useProgress();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-ink-800 bg-ink-900 lg:block">
          <SidebarContent />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-ink-700 bg-ink-900">
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 btn-icon" aria-label="Close menu"><X className="h-4 w-4" /></button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1 lg:pl-[264px]">
          <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-800 bg-ink-950/85 px-4 backdrop-blur-xl sm:px-7">
            <button className="btn-icon lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 max-w-md flex-1 items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-900 px-3 text-left text-[13px] text-muted transition hover:border-ink-600 hover:text-slate-300"
            >
              <Search className="h-4 w-4" />
              <span className="hidden truncate sm:inline">Search the entire academy…</span>
              <span className="ml-auto hidden rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</span>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/ethics" className="hidden items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-amber-300 sm:flex">
                <ShieldAlert className="h-3.5 w-3.5" /> Authorized use only
              </Link>
              <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-mint-500/30 bg-mint-500/10 text-xs font-semibold text-mint-300" title={state.name}>
                {state.name.slice(0, 1).toUpperCase()}
              </Link>
            </div>
          </div>

          <div className="border-b border-amber-500/15 bg-amber-500/[0.04] px-4 py-1.5 text-center text-[11px] text-amber-300/90 sm:px-7">
            <ShieldAlert className="mr-1.5 inline h-3 w-3" />
            Educational material only. Test only systems you own or have explicit written authorization to test.
            <Link href="/ethics" className="ml-1.5 underline underline-offset-2">Read the rules</Link>
          </div>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">{children}</main>

          <footer className="border-t border-ink-800 px-4 py-8 text-center text-xs text-muted sm:px-7">
            <p>AEGIS Security Academy · Built on first principles · For authorized learning only.</p>
            <p className="mt-1.5">Content sourced from an original 36-chapter encyclopedia with citations to OWASP, NIST, MITRE, RFCs and vendor documentation.</p>
          </footer>
        </div>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
