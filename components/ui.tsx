'use client';

import Link from 'next/link';
import { ArrowUpRight, Check, Copy, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn, difficultyColor, severityColor } from '@/lib/utils';

export function Panel({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn('panel', hover && 'panel-hover', className)}>{children}</div>;
}

export function Badge({ children, tone = 'default', className }: { children: React.ReactNode; tone?: 'default' | 'mint' | 'cyan' | 'rose' | 'amber'; className?: string }) {
  const tones = {
    default: 'border-ink-600 bg-ink-800 text-slate-300',
    mint: 'border-mint-500/30 bg-mint-500/10 text-mint-300',
    cyan: 'border-cyanx-500/30 bg-cyanx-500/10 text-cyanx-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', tones[tone], className)}>{children}</span>;
}

export function DifficultyBadge({ value }: { value: string }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', difficultyColor(value))}>{value}</span>;
}

export function SeverityBadge({ value }: { value: string }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', severityColor(value))}>{value}</span>;
}

export function ProgressBar({ value, className, tone = 'mint' }: { value: number; className?: string; tone?: 'mint' | 'cyan' }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-700', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', tone === 'mint' ? 'bg-mint-500' : 'bg-cyanx-400')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-ink-800 pb-7 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <div className="label mb-2 text-mint-400">{eyebrow}</div>}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, sub, icon, tone = 'mint' }: { label: string; value: string | number; sub?: string; icon?: React.ReactNode; tone?: 'mint' | 'cyan' | 'slate' }) {
  const tones = { mint: 'text-mint-400 bg-mint-500/10 border-mint-500/20', cyan: 'text-cyanx-300 bg-cyanx-500/10 border-cyanx-500/20', slate: 'text-slate-300 bg-ink-800 border-ink-700' };
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="label">{label}</div>
        {icon && <div className={cn('rounded-lg border p-2', tones[tone])}>{icon}</div>}
      </div>
      <div className="stat-num mt-3">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Panel>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-16 text-center">
      <ShieldCheck className="mb-4 h-8 w-8 text-ink-600" />
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      className="btn-icon"
      title={copied ? 'Copied' : 'Copy'}
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
      }}
    >
      {copied ? <Check className="h-4 w-4 text-mint-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const external = href.startsWith('http');
  if (!external) return <Link href={href} className={cn('link', className)}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('link inline-flex items-center gap-1', className)}>
      {children} <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

export function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-ink-800 py-2.5 last:border-0">
      <div className="text-xs font-medium text-muted">{k}</div>
      <div className="text-sm leading-relaxed text-slate-300">{v}</div>
    </div>
  );
}
