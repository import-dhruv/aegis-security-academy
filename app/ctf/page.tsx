'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Check, CheckCircle2, ChevronDown, ChevronUp, Circle, Eye, Filter, Keyboard,
  Lightbulb, Lock, RotateCcw, ShieldCheck, Trophy, X,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { Challenge } from '@/lib/types';
import { useProgress } from '@/components/providers';
import { Badge, DifficultyBadge, EmptyState, PageHeader, Panel, ProgressBar, SearchInput, StatCard } from '@/components/ui';
import { cn, pct } from '@/lib/utils';

function rankFor(points: number) {
  if (points >= 2000) return { title: 'Elite Researcher', tone: 'mint' as const };
  if (points >= 1400) return { title: 'Bug Bounty Hunter', tone: 'mint' as const };
  if (points >= 900) return { title: 'Security Practitioner', tone: 'cyan' as const };
  if (points >= 450) return { title: 'Web Security Analyst', tone: 'cyan' as const };
  if (points >= 100) return { title: 'Initiate', tone: 'default' as const };
  return { title: 'Unranked', tone: 'default' as const };
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4);
}

function matchStrength(user: string, model: string) {
  const modelWords = Array.from(new Set(normalize(model)));
  if (!modelWords.length) return 0;
  const hits = modelWords.filter((w) => normalize(user).includes(w)).length;
  return hits / modelWords.length;
}

export default function CtfPage() {
  const { data: challenges, loading, error } = useData<Challenge[]>('ctf.json');
  const progress = useProgress();
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [solvedOnly, setSolvedOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hintCounts, setHintCounts] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, 'strong' | 'weak' | null>>({});

  const list = challenges ?? [];
  const categories = useMemo(() => Array.from(new Set(list.map((c) => c.category))).sort(), [list]);
  const difficulties = useMemo(() => Array.from(new Set(list.map((c) => c.difficulty))).sort(), [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (difficulty !== 'all' && c.difficulty !== difficulty) return false;
      if (solvedOnly && !progress.state.challengeSolves.includes(c.id)) return false;
      if (q && ![c.title, c.category, c.prompt, ...c.hints].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, category, difficulty, search, solvedOnly, progress.state.challengeSolves]);

  const maxPoints = list.reduce((sum, c) => sum + c.points, 0);
  const earned = list.filter((c) => progress.state.challengeSolves.includes(c.id)).reduce((sum, c) => sum + c.points, 0);
  const solvedCount = list.filter((c) => progress.state.challengeSolves.includes(c.id)).length;
  const rank = rankFor(earned);

  const revealSolution = (c: Challenge) => {
    if (!progress.state.challengeSolves.includes(c.id)) progress.toggleChallenge(c.id);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice / Challenge Arena"
        title="CTF Challenge Arena"
        description="Short, reasoning-focused challenges modeled on real bug-bounty decisions. Work through the prompt, take hints one at a time, then compare your answer with the model solution."
        actions={<Link href="/ethics" className="btn-ghost"><ShieldCheck className="h-4 w-4 text-mint-400" /> Rules &amp; ethics</Link>}
      />

      <Panel className="mb-6 border-amber-500/25 bg-amber-500/[0.04] p-4 text-[13px] leading-relaxed text-amber-200/80">
        <div className="mb-1 flex items-center gap-2 font-semibold text-amber-200"><Lock className="h-4 w-4" /> Local-only disclaimer</div>
        These puzzles are entirely self-contained and synthetic. No challenge asks you to scan, exploit, or contact a
        real system. Any technique you practise here must only be applied to local labs or systems you are explicitly
        authorized to test. Progress is stored in this browser only — nothing is submitted to a server or leaderboard.
      </Panel>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr]">
        <StatCard label="Points earned" value={earned} sub={`of ${maxPoints} available`} icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Challenges solved" value={`${solvedCount} / ${list.length}`} sub={list.length ? `${pct(solvedCount, list.length)}% complete` : undefined} icon={<CheckCircle2 className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Current rank" value={rank.title} sub="Based on earned points" icon={<Trophy className="h-4 w-4" />} />
        <Panel className="p-5">
          <div className="label">Rank progress</div>
          <div className="mt-1 flex items-baseline gap-2"><span className="stat-num">{earned}</span><span className="text-xs text-muted">pts</span></div>
          <ProgressBar className="mt-3" value={maxPoints ? (earned / maxPoints) * 100 : 0} />
          <div className="mt-2 text-[11px] text-muted">All {list.length} challenges: {maxPoints} pts</div>
        </Panel>
      </div>

      <Panel className="mb-6 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"><Filter className="h-4 w-4 text-mint-400" /> Filters</div>
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search challenges…" />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Filter by difficulty">
            <option value="all">All difficulties</option>
            {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className={cn('btn', solvedOnly ? 'bg-mint-500 text-ink-950' : 'btn-ghost')} onClick={() => setSolvedOnly((v) => !v)}>
            {solvedOnly ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />} Solved
          </button>
        </div>
      </Panel>

      {error ? (
        <EmptyState title="Could not load challenges" description={error} />
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-40 animate-pulse rounded-xl bg-ink-800/60" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No challenges match" description="Clear a filter, or solve a few challenges to populate the solved-only view." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((c) => {
            const solved = progress.state.challengeSolves.includes(c.id);
            const open = expanded === c.id;
            const hintsShown = Math.min(hintCounts[c.id] ?? 0, c.hints.length);
            const revealed = solved;
            return (
              <Panel key={c.id} className={cn('p-5', open && 'border-mint-500/30')} hover>
                <button className="flex w-full items-start gap-3 text-left" onClick={() => setExpanded(open ? null : c.id)}>
                  <div className={cn('mt-0.5 rounded-lg border p-2', solved ? 'border-mint-500/30 bg-mint-500/10 text-mint-400' : 'border-ink-700 bg-ink-800 text-muted')}>
                    {solved ? <CheckCircle2 className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-slate-100">{c.title}</h3>
                      {solved && <Badge tone="mint"><Check className="h-3 w-3" /> Solved</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="cyan">{c.category}</Badge>
                      <DifficultyBadge value={c.difficulty} />
                      <span className="chip">{c.points} pts</span>
                    </div>
                  </div>
                  {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted" />}
                </button>

                {open && (
                  <div className="mt-5 border-t border-ink-800 pt-5">
                    <div className="label mb-2">Challenge prompt</div>
                    <p className="text-[13px] leading-relaxed text-slate-300">{c.prompt}</p>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="label flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-amber-300" /> Progressive hints</div>
                        <button
                          className="link text-xs"
                          disabled={hintsShown >= c.hints.length}
                          onClick={() => setHintCounts((h) => ({ ...h, [c.id]: hintsShown + 1 }))}
                        >
                          {hintsShown >= c.hints.length ? 'All hints revealed' : `Reveal hint ${hintsShown + 1} of ${c.hints.length}`}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {c.hints.slice(0, hintsShown).map((h, i) => (
                          <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-[13px] leading-relaxed text-amber-100/80">
                            <span className="mr-2 font-mono text-[11px] text-amber-300/70">H{i + 1}</span>{h}
                          </div>
                        ))}
                        {hintsShown === 0 && <div className="text-xs text-muted">Hints are optional — try the prompt first.</div>}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="label mb-2 flex items-center gap-1.5"><Keyboard className="h-3.5 w-3.5 text-cyanx-300" /> Your answer</div>
                      <div className="flex gap-2">
                        <input
                          className="input"
                          value={answers[c.id] ?? ''}
                          placeholder="Type your answer, then press Enter…"
                          aria-label={`Answer for ${c.title}`}
                          onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (answers[c.id] ?? '').trim()) {
                              setChecks((s) => ({ ...s, [c.id]: matchStrength(answers[c.id] ?? '', c.answer) >= 0.4 ? 'strong' : 'weak' }));
                            }
                          }}
                        />
                        <button
                          className="btn-ghost shrink-0"
                          disabled={!(answers[c.id] ?? '').trim()}
                          onClick={() => setChecks((s) => ({ ...s, [c.id]: matchStrength(answers[c.id] ?? '', c.answer) >= 0.4 ? 'strong' : 'weak' }))}
                        >
                          Check
                        </button>
                      </div>
                      {checks[c.id] === 'strong' && <p className="mt-2 text-[13px] text-mint-300">Strong match — your answer covers the key ideas in the model solution.</p>}
                      {checks[c.id] === 'weak' && <p className="mt-2 text-[13px] text-amber-200/80">No clear match yet. Re-read the prompt, use another hint, or reveal the model answer below.</p>}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-800 pt-4">
                      <button className="btn-primary" onClick={() => revealSolution(c)}><Eye className="h-4 w-4" /> {revealed ? 'Solution revealed' : 'Reveal solution & mark solved'}</button>
                      <Link className="btn-ghost" href={`/learn/chapter-${String(c.lesson).padStart(2, '0')}`}>Related lesson {c.lesson} <ChevronDown className="h-4 w-4 -rotate-90" /></Link>
                      <button className="btn-icon" title="Reset this challenge" onClick={() => { setHintCounts((h) => ({ ...h, [c.id]: 0 })); setAnswers((a) => ({ ...a, [c.id]: '' })); setChecks((s) => ({ ...s, [c.id]: null })); }}>
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>

                    {revealed && (
                      <div className="mt-4 rounded-lg border border-mint-500/25 bg-mint-500/[0.05] p-4">
                        <div className="label mb-1 text-mint-400">Model answer</div>
                        <p className="text-[13px] leading-relaxed text-slate-200">{c.answer}</p>
                        {solved && <button className="link mt-3 text-xs" onClick={() => progress.toggleChallenge(c.id)}><X className="mr-1 inline h-3 w-3" />Undo solved state</button>}
                      </div>
                    )}
                    <p className="mt-3 text-[11px] leading-relaxed text-muted">Reminder: answers describe reasoning for labs and synthetic scenarios only — never apply them to systems you do not own.</p>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
