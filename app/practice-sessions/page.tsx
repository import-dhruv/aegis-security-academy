'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock, Dumbbell, Filter, Search, ShieldCheck, Target } from 'lucide-react';
import { useData } from '@/lib/data';
import type { PracticeSession } from '@/lib/types';
import { Badge, PageHeader, Panel, SearchInput } from '@/components/ui';

export default function PracticeSessionsPage() {
  const { data: sessions, loading } = useData<PracticeSession[]>('practice-sessions.json');
  const [q, setQ] = useState('');
  const [track, setTrack] = useState('All');

  const tracks = useMemo(() => {
    const counts = new Map<string, number>();
    (sessions ?? []).forEach((s) => counts.set(s.track, (counts.get(s.track) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name]) => name);
  }, [sessions]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (sessions ?? []).filter((s) => {
      if (track !== 'All' && s.track !== track) return false;
      if (!needle) return true;
      return `${s.title} ${s.track} ${s.goal} ${s.content}`.toLowerCase().includes(needle);
    });
  }, [sessions, q, track]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice · guided lab sessions"
        title="Guided Practice Sessions"
        description="Multi-hour, evidence-driven lab sessions for advanced Web Security, Applied AI Security and AI-Powered Bug Bounty. Each session gives you setup commands, numbered work steps, checkpoints, troubleshooting, deliverables and a self-assessment rubric."
        actions={<Link href="/labs" className="btn-ghost"><Dumbbell className="h-4 w-4" /> All practice labs</Link>}
      />

      <Panel className="mb-6 border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-[13px] leading-relaxed text-amber-100/90">
            Every session runs in an isolated lab or against fictional scenarios you control. Never apply these techniques to third-party systems or real user data.
          </p>
        </div>
      </Panel>

      {loading || !sessions ? (
        <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-40 animate-pulse rounded-xl border border-ink-800 bg-ink-900/40" />)}</div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Panel className="p-4"><div className="label">Sessions</div><div className="stat-num mt-2">{sessions.length}</div><div className="mt-1 text-[11px] text-muted">guided lab exercises</div></Panel>
            <Panel className="p-4"><div className="label">Lab hours</div><div className="stat-num mt-2">{sessions.reduce((s, x) => s + x.hours, 0)}</div><div className="mt-1 text-[11px] text-muted">of hands-on work</div></Panel>
            <Panel className="p-4"><div className="label">Tracks</div><div className="stat-num mt-2">{tracks.length}</div><div className="mt-1 text-[11px] text-muted">disciplines covered</div></Panel>
            <Panel className="p-4"><div className="label">With checkpoints</div><div className="stat-num mt-2">{sessions.length}</div><div className="mt-1 text-[11px] text-muted">verifiable outcomes</div></Panel>
          </div>

          <div className="panel mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <SearchInput value={q} onChange={setQ} placeholder="Search sessions…" className="lg:max-w-sm" />
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted" />
              <select className="input max-w-xs" value={track} onChange={(e) => setTrack(e.target.value)} aria-label="Filter by track">
                <option value="All">All tracks</option>
                {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <span className="ml-auto text-xs text-muted">{filtered.length} session{filtered.length === 1 ? '' : 's'}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((s) => (
              <Link key={s.id} href={`/practice-sessions/${s.id}`} className="panel panel-hover group flex flex-col p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-mint-500/70">SESSION {String(s.number).padStart(2, '0')}</span>
                  <span className="text-[11px] text-muted"><Clock className="mr-1 inline h-3 w-3" />{s.hours} hours</span>
                </div>
                <h3 className="text-lg font-semibold leading-snug text-slate-100 group-hover:text-mint-200">{s.title}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="cyan">{s.track}</Badge>
                  <Badge>{s.level}</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">{s.goal}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.objectives.slice(0, 3).map((o) => <span key={o} className="chip">#{o.slice(0, 42)}</span>)}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-ink-800 pt-4 text-[11px] text-muted">
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {s.deliverables.length} deliverables</span>
                  <ArrowRight className="h-4 w-4 text-mint-400 opacity-0 transition group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
