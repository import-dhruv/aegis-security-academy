'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock, Filter, Flag, Search, ShieldCheck, Trophy } from 'lucide-react';
import { useData } from '@/lib/data';
import type { CTFChallenge } from '@/lib/types';
import { Badge, DifficultyBadge, PageHeader, Panel, SearchInput } from '@/components/ui';

const PAGE_SIZE = 24;

export default function CtfLibraryPage() {
  const { data: challenges, loading } = useData<CTFChallenge[]>('ctf-challenges.json');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    (challenges ?? []).forEach((c) => counts.set(c.category, (counts.get(c.category) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name]) => name);
  }, [challenges]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (challenges ?? []).filter((c) => {
      if (category !== 'All' && c.category !== category) return false;
      if (difficulty !== 'All' && c.difficulty !== difficulty) return false;
      if (!needle) return true;
      return `${c.title} ${c.category} ${c.prompt} ${c.tags.join(' ')}`.toLowerCase().includes(needle);
    });
  }, [challenges, q, category, difficulty]);

  const shown = filtered.slice(0, visible);
  const totalPoints = (challenges ?? []).reduce((s, c) => s + c.points, 0);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice · 1,000 original challenges"
        title="CTF Challenge Library"
        description="A thousand progressive capture-the-flag challenges across web, crypto, forensics, pwn, reverse engineering, networking, OSINT, mobile, cloud and AI security. Every challenge includes hints, a verified flag and a full solution."
        actions={<Link href="/ctf" className="btn-ghost"><Trophy className="h-4 w-4" /> Guided CTF intro</Link>}
      />

      <Panel className="mb-6 border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-[13px] leading-relaxed text-amber-100/90">
            Every challenge is designed for an isolated local lab or the provided fictional scenario. Never point these techniques at systems you do not own or have explicit written authorization to test.
          </p>
        </div>
      </Panel>

      {loading || !challenges ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-36 animate-pulse rounded-xl border border-ink-800 bg-ink-900/40" />)}</div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Panel className="p-4"><div className="label">Challenges</div><div className="stat-num mt-2">{challenges.length}</div><div className="mt-1 text-[11px] text-muted">original training tasks</div></Panel>
            <Panel className="p-4"><div className="label">Categories</div><div className="stat-num mt-2">{categories.length}</div><div className="mt-1 text-[11px] text-muted">across the security canon</div></Panel>
            <Panel className="p-4"><div className="label">Total points</div><div className="stat-num mt-2">{totalPoints.toLocaleString()}</div><div className="mt-1 text-[11px] text-muted">if you solve them all</div></Panel>
            <Panel className="p-4"><div className="label">With full solutions</div><div className="stat-num mt-2">{challenges.length}</div><div className="mt-1 text-[11px] text-muted">hints + flag + write-up</div></Panel>
          </div>

          <div className="panel mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <SearchInput value={q} onChange={(v) => { setQ(v); setVisible(PAGE_SIZE); }} placeholder="Search challenges, categories, tags…" className="lg:max-w-sm" />
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 shrink-0 text-muted" />
              <select className="input max-w-[220px]" value={category} onChange={(e) => { setCategory(e.target.value); setVisible(PAGE_SIZE); }} aria-label="Filter by category">
                <option value="All">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input max-w-[160px]" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setVisible(PAGE_SIZE); }} aria-label="Filter by difficulty">
                <option value="All">All difficulties</option>
                {['Easy', 'Medium', 'Hard', 'Insane'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <span className="ml-auto text-xs text-muted">{filtered.length} challenge{filtered.length === 1 ? '' : 's'}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <Link key={c.id} href={`/ctf-library/${c.id}`} className="panel panel-hover group flex min-h-[176px] flex-col p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-mint-500/70">#{String(c.number).padStart(4, '0')}</span>
                  <span className="font-mono text-[10px] text-amber-300">{c.points} pts</span>
                </div>
                <h3 className="text-[14px] font-semibold leading-snug text-slate-100 group-hover:text-mint-200">{c.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="cyan">{c.category}</Badge>
                  <DifficultyBadge value={c.difficulty} />
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted">{c.prompt}</p>
                <div className="mt-auto flex items-center justify-between border-t border-ink-800 pt-3 text-[11px] text-muted">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.minutes}m</span>
                    <span className="flex items-center gap-1"><Flag className="h-3 w-3" />hint + solution</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-mint-400 opacity-0 transition group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-7 text-center">
              <button className="btn-primary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load 24 more challenges</button>
            </div>
          )}

          {filtered.length === 0 && (
            <Panel className="p-10 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-ink-600" /><h3 className="text-base font-semibold text-slate-200">No challenges match those filters</h3><p className="mt-2 text-sm text-muted">Try a different keyword, category or difficulty.</p></Panel>
          )}
        </>
      )}
    </div>
  );
}
