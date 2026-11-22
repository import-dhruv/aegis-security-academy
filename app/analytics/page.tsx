'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Info, Search } from 'lucide-react';
import { useData } from '@/lib/data';
import { useProgress, MASTERY_SCORE } from '@/components/providers';
import { Badge, EmptyState, Panel, PageHeader, ProgressBar, SearchInput } from '@/components/ui';
import { cn, formatMinutes, levelName, pct } from '@/lib/utils';
import type { Chapter, School } from '@/lib/types';

const RING_RADIUS = 62;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function difficultyGroup(value: string) {
  const s = value.toLowerCase();
  if (s.includes('beginner') || s === 'easy') return 'Beginner';
  if (s.includes('intermediate') || s.includes('medium')) return 'Intermediate';
  if (s.includes('advanced') || s.includes('hard')) return 'Advanced';
  if (s.includes('expert') || s.includes('critical')) return 'Expert';
  return 'Other';
}

// Deterministic pseudo-random in [0,1] from a date string — no live randomness,
// so the heatmap is stable between renders and never implies logged sessions.
function dateHash(d: Date) {
  const key = d.toISOString().slice(0, 10);
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export default function AnalyticsPage() {
  const { data: chapters, loading: chaptersLoading, error: chaptersError } = useData<Chapter[]>('chapters.json');
  const { data: schools, loading: schoolsLoading } = useData<School[]>('schools.json');
  const { state, ready, stats, isMastered } = useProgress();
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!ready || chaptersLoading || schoolsLoading) {
    return (
      <div className="space-y-5 py-6">
        <div className="h-24 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-72 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />)}
        </div>
        <p className="pt-2 text-center text-xs text-muted">Crunching your local learning data…</p>
      </div>
    );
  }

  if (chaptersError || !chapters) {
    return (
      <Panel className="p-8">
        <EmptyState
          title="Analytics unavailable"
          description="Chapter data could not be loaded. Your progress is safe in this browser — reload the page to try again."
          action={<Link href="/dashboard" className="btn-ghost">Back to dashboard</Link>}
        />
      </Panel>
    );
  }

  const chapterList = [...chapters].sort((a, b) => a.id - b.id);
  const schoolList = [...(schools ?? [])].sort((a, b) => b.chapterIds.length - a.chapterIds.length);

  // Best score per chapter, in curriculum order — the quiz "trend".
  const scoreSeries = chapterList
    .filter((c) => state.quizScores[c.id] !== undefined)
    .map((c) => ({ id: c.id, number: c.number, title: c.title, score: state.quizScores[c.id] }));

  // Mastery distribution by school (top 8 by size).
  const schoolRows = schoolList.slice(0, 8).map((s) => {
    const total = s.chapterIds.length;
    const mastered = s.chapterIds.filter((id) => isMastered(id)).length;
    const read = s.chapterIds.filter((id) => state.completed[id] && !isMastered(id)).length;
    return { ...s, total, mastered, read, value: pct(mastered, total) };
  });

  // Planned reading time grouped by difficulty and by level.
  const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Other'];
  const difficultyRows = difficultyOrder
    .map((name) => {
      const list = chapterList.filter((c) => difficultyGroup(c.difficulty) === name);
      return {
        name,
        total: list.reduce((sum, c) => sum + c.minutes, 0),
        mastered: list.filter((c) => isMastered(c.id)).reduce((sum, c) => sum + c.minutes, 0),
        count: list.length,
      };
    })
    .filter((r) => r.count > 0);
  const maxDifficultyMinutes = Math.max(1, ...difficultyRows.map((r) => r.total));
  const levelRows = chapterList.reduce<Record<number, { total: number; mastered: number }>>((acc, c) => {
    const slot = (acc[c.level] ??= { total: 0, mastered: 0 });
    slot.total += c.minutes;
    if (isMastered(c.id)) slot.mastered += c.minutes;
    return acc;
  }, {});
  const maxLevelMinutes = Math.max(1, ...Object.values(levelRows).map((r) => r.total));

  // Domain averages (same definition as the progress provider: ≥2 scored chapters).
  const domainScores: Record<string, { sum: number; n: number }> = {};
  chapterList.forEach((c) => {
    const score = state.quizScores[c.id];
    if (score === undefined) return;
    c.tags.forEach((tag) => {
      const slot = (domainScores[tag] ??= { sum: 0, n: 0 });
      slot.sum += score;
      slot.n += 1;
    });
  });
  const domains = Object.entries(domainScores)
    .filter(([, v]) => v.n >= 2)
    .map(([name, v]) => ({ name, avg: Math.round(v.sum / v.n), n: v.n }))
    .sort((a, b) => b.avg - a.avg);
  const strong = domains.slice(0, 4);
  const weak = domains.slice(-4).reverse();

  // Completion funnel — "visited" is a local proxy, never a page-view log.
  const visited = chapterList.filter((c) => state.completed[c.id] || state.quizScores[c.id] !== undefined).length;
  const funnel = [
    { label: 'Visited', value: visited, note: 'marked read or quizzed', tone: 'cyan' as const },
    { label: 'Read', value: stats.completed, note: 'marked as read', tone: 'cyan' as const },
    { label: 'Mastered', value: stats.mastered, note: `≥ ${MASTERY_SCORE}% quiz score`, tone: 'mint' as const },
  ];

  // Deterministic 12-week activity estimate, anchored to lastActive + streak.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = state.lastActive ? new Date(`${state.lastActive}T00:00:00`) : null;
  const gapDays = lastActive ? Math.max(0, Math.round((today.getTime() - lastActive.getTime()) / 86400000)) : 999;
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const age = 83 - i;
    const day = new Date(today);
    day.setDate(today.getDate() - age);
    const h = dateHash(day);
    let level = 0;
    if (lastActive) {
      const beforeLast = age - gapDays;
      if (beforeLast >= 0 && beforeLast < state.streak) {
        level = h > 0.25 ? 4 : 3;
      } else if (gapDays <= 2 && age < gapDays) {
        level = h > 0.6 ? 2 : 1;
      } else {
        const weight = Math.max(0, 1 - age / 120);
        level = h < 0.2 * weight ? 1 : h < 0.34 * weight ? 2 : 0;
      }
    }
    return { key: day.toISOString().slice(0, 10), level, age, day };
  });

  const filtered = chapterList.filter((c) =>
    `${c.title} ${c.number} ${c.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="animate-fade-up pb-10">
      <PageHeader
        eyebrow="Insights"
        title="Learning analytics"
        description="Every chart below is computed from the progress stored in this browser. Numbers describe your local study record — not a server-side profile — and update the moment you study."
        actions={<Badge tone="mint"><Info className="h-3 w-3" /> Local data only</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ---------- Overall donut + school mastery ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Mastery at a glance</h2>
          <p className="mt-1 text-xs text-muted">Overall mastery means at least {MASTERY_SCORE}% on a chapter&apos;s mastery quiz.</p>
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative h-40 w-40 shrink-0">
              <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90" role="img" aria-label={`${stats.overallPct}% of chapters mastered`}>
                <circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="#24323c" strokeWidth="14" />
                <circle
                  cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="#4fe0a6" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(stats.overallPct / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-semibold text-slate-50">{stats.overallPct}%</span>
                <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted">mastered</span>
              </div>
            </div>
            <div className="w-full flex-1 space-y-2.5">
              <div className="flex items-center justify-between border-b border-ink-800 pb-2 text-xs">
                <span className="text-muted">Chapters mastered</span>
                <span className="font-mono text-slate-200">{stats.mastered} / {stats.totalChapters}</span>
              </div>
              <div className="flex items-center justify-between border-b border-ink-800 pb-2 text-xs">
                <span className="text-muted">Marked as read</span>
                <span className="font-mono text-slate-200">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between border-b border-ink-800 pb-2 text-xs">
                <span className="text-muted">Current level</span>
                <span className="text-slate-200">L{stats.level} · {levelName(stats.level)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Level progress</span>
                <span className="font-mono text-mint-400">{stats.levelPct}%</span>
              </div>
              <ProgressBar value={stats.levelPct} className="mt-2" />
            </div>
          </div>
        </Panel>

        {/* ---------- Mastery by school ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Mastery by school</h2>
          <p className="mt-1 text-xs text-muted">Top eight schools by chapter count. Green = mastered, cyan = read but not yet mastered.</p>
          <div className="mt-6 space-y-3.5">
            {schoolRows.map((s) => (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-slate-300">{s.name}</span>
                  <span className="shrink-0 font-mono text-muted">{s.mastered}/{s.total}</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full bg-mint-500 transition-all duration-500" style={{ width: `${pct(s.mastered, s.total)}%` }} />
                  <div className="h-full bg-cyanx-400/80 transition-all duration-500" style={{ width: `${pct(s.read, s.total)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-ink-800 pt-3 text-[11px] leading-relaxed text-muted">
            School totals overlap — a chapter can belong to more than one school — so these bars should not be summed into a single percentage.
          </p>
        </Panel>

        {/* ---------- Quiz score trend ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Quiz score trend</h2>
          <p className="mt-1 text-xs text-muted">Best quiz score for each assessed chapter, ordered by chapter number.</p>
          {scoreSeries.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No quiz scores yet"
                description="Take a mastery quiz at the end of any chapter and a bar will appear here, showing how your recall improves across the curriculum."
                action={<Link href="/schools" className="btn-ghost">Browse chapters</Link>}
              />
            </div>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto pb-2">
                <div className="flex h-48 min-w-max items-end gap-1.5">
                  {scoreSeries.map((s) => (
                    <div key={s.id} className="flex h-full w-3.5 flex-col justify-end" title={`Chapter ${s.number}: ${s.score}% — ${s.title}`}>
                      <div
                        className={cn(
                          'w-full rounded-t transition-all duration-500',
                          s.score >= MASTERY_SCORE ? 'bg-mint-500' : s.score >= 50 ? 'bg-cyanx-400' : 'bg-amber-400/80',
                        )}
                        style={{ height: `${Math.max(3, s.score)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex border-t border-ink-800 pt-2">
                  {scoreSeries.map((s) => (
                    <div key={s.id} className="w-3.5 shrink-0 text-center font-mono text-[8px] text-muted">{s.number}</div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-mint-500" /> ≥ {MASTERY_SCORE}% mastered</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-cyanx-400" /> 50–79%</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-400/80" /> &lt; 50%</span>
              </div>
            </>
          )}
        </Panel>

        {/* ---------- Time distribution ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Time distribution</h2>
          <p className="mt-1 text-xs text-muted">Planned reading time from chapter metadata; the green portion is material you have mastered.</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="label mb-3">By difficulty</div>
              <div className="space-y-3">
                {difficultyRows.map((r) => (
                  <div key={r.name}>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-slate-300">{r.name} <span className="text-muted">({r.count})</span></span>
                      <span className="font-mono text-muted">{formatMinutes(r.total)}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-700">
                      <div className="absolute inset-y-0 left-0 bg-cyanx-400/70" style={{ width: `${(r.total / maxDifficultyMinutes) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-mint-500" style={{ width: `${(r.mastered / maxDifficultyMinutes) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-3">By level</div>
              <div className="space-y-2">
                {Object.entries(levelRows)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([level, r]) => (
                    <div key={level}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-slate-300" title={levelName(Number(level))}>L{level}</span>
                        <span className="font-mono text-muted">{formatMinutes(r.total)}</span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                        <div className="absolute inset-y-0 left-0 bg-cyanx-400/70" style={{ width: `${(r.total / maxLevelMinutes) * 100}%` }} />
                        <div className="absolute inset-y-0 left-0 bg-mint-500" style={{ width: `${(r.mastered / maxLevelMinutes) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <p className="mt-5 border-t border-ink-800 pt-3 text-[11px] leading-relaxed text-muted">
            This is curriculum volume, not tracked study time. Your actual logged study time is <span className="text-slate-300">{formatMinutes(state.studyMinutes)}</span>.
          </p>
        </Panel>

        {/* ---------- Domain strength ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Domain strength</h2>
          <p className="mt-1 text-xs text-muted">A radar-style comparison using average best quiz scores from the dashboard&apos;s tagged domains.</p>
          {domains.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="Not enough domain data"
                description="Quiz at least two chapters sharing a tag and your strongest and weakest domains will appear here as horizontal bars."
                action={<Link href="/assessments" className="btn-ghost">Go to assessments</Link>}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-7 sm:grid-cols-2">
              <div>
                <div className="label mb-3 text-mint-400">Strongest domains</div>
                <div className="space-y-3">
                  {strong.map((d) => (
                    <div key={d.name}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="truncate text-slate-300">#{d.name}</span>
                        <span className="font-mono text-mint-400">{d.avg}%</span>
                      </div>
                      <ProgressBar value={d.avg} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="label mb-3 text-amber-300">Needs attention</div>
                <div className="space-y-3">
                  {weak.map((d) => (
                    <div key={d.name}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="truncate text-slate-300">#{d.name}</span>
                        <span className="font-mono text-amber-300">{d.avg}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                        <div className="h-full rounded-full bg-amber-400/80" style={{ width: `${d.avg}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <p className="mt-5 border-t border-ink-800 pt-3 text-[11px] leading-relaxed text-muted">
            Only domains with two or more assessed chapters are ranked. These averages are a revision aid, not a formal competency score.
          </p>
        </Panel>

        {/* ---------- Activity heatmap ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Activity · last 12 weeks</h2>
          <p className="mt-1 text-xs text-muted">A visual estimate reconstructed from your streak and last-active date — not a log of individual sessions.</p>
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex gap-2">
              <div className="grid shrink-0 grid-rows-7 gap-1 pt-0 text-[8px] text-muted">
                <span /><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span />
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {(mounted ? heatmap : Array.from({ length: 84 }, (_, i) => ({ key: i, level: 0, age: 0, day: new Date(0) }))).map((cell) => (
                  <div
                    key={cell.key}
                    title={`${cell.key} · ${cell.level === 0 ? 'no estimated activity' : `estimated level ${cell.level}/4`}`}
                    className={cn(
                      'h-3 w-3 rounded-[3px]',
                      cell.level === 0 && 'bg-ink-800',
                      cell.level === 1 && 'bg-mint-500/25',
                      cell.level === 2 && 'bg-mint-500/50',
                      cell.level === 3 && 'bg-mint-500/80',
                      cell.level === 4 && 'bg-mint-400',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span key={l} className={cn('h-2.5 w-2.5 rounded-[2px]', l === 0 ? 'bg-ink-800' : l === 1 ? 'bg-mint-500/25' : l === 2 ? 'bg-mint-500/50' : l === 3 ? 'bg-mint-500/80' : 'bg-mint-400')} />
              ))}
              More
            </div>
            <span className="text-[11px] text-muted">Current streak: <span className="font-mono text-amber-300">{state.streak} days</span></span>
          </div>
          <p className="mt-5 border-t border-ink-800 pt-3 text-[11px] leading-relaxed text-muted">
            Because local storage records only a day count and last-active date, the cells are a deterministic estimate shaped by those values. Treat them as motivation, not evidence of exact study sessions.
          </p>
        </Panel>

        {/* ---------- Completion funnel ---------- */}
        <Panel className="p-5 md:p-6">
          <h2 className="section-title">Completion funnel</h2>
          <p className="mt-1 text-xs text-muted">How many of the {stats.totalChapters} chapters reached each milestone.</p>
          <div className="mt-8 space-y-5">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink-600 font-mono text-[10px] text-muted">{i + 1}</span>
                    {f.label}
                    <span className="font-normal text-muted">· {f.note}</span>
                  </span>
                  <span className="font-mono text-slate-300">{f.value} <span className="text-muted">({pct(f.value, stats.totalChapters)}%)</span></span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded-lg bg-ink-800/70">
                  <div
                    className={cn('h-full rounded-lg transition-all duration-500', f.tone === 'mint' ? 'bg-mint-500/80' : 'bg-cyanx-400/70')}
                    style={{ width: `${pct(f.value, stats.totalChapters)}%` }}
                  />
                </div>
                {i < funnel.length - 1 && <div className="ml-2.5 mt-2 h-3 w-px border-l border-dashed border-ink-600" />}
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-ink-800 pt-3 text-[11px] leading-relaxed text-muted">
            &ldquo;Visited&rdquo; is a proxy: chapters you marked read or took a quiz on. Local mode does not record page views, so a visited chapter is not necessarily fully read.
          </p>
        </Panel>
      </div>

      {/* ---------- Per-chapter table ---------- */}
      <Panel className="mt-6 p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Chapter status</h2>
            <p className="mt-1 text-xs text-muted">One row per chapter, ordered by curriculum position.</p>
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Filter chapters…" className="w-full md:w-64" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No chapters match" description="Try a chapter number, title or tag." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-left">
                  <th className="w-12 py-2.5 pr-3 font-mono text-[11px] font-semibold text-muted">#</th>
                  <th className="py-2.5 pr-3 text-[11px] font-semibold text-muted">Chapter</th>
                  <th className="py-2.5 pr-3 text-[11px] font-semibold text-muted">Level</th>
                  <th className="py-2.5 pr-3 text-[11px] font-semibold text-muted">Difficulty</th>
                  <th className="py-2.5 pr-3 text-[11px] font-semibold text-muted">Best score</th>
                  <th className="py-2.5 pr-3 text-[11px] font-semibold text-muted">Status</th>
                  <th className="py-2.5 text-right text-[11px] font-semibold text-muted">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const mastered = isMastered(c.id);
                  const score = state.quizScores[c.id];
                  const status = mastered ? 'Mastered' : state.completed[c.id] ? 'Read' : score !== undefined ? 'Assessed' : 'Not started';
                  const tone = mastered ? 'mint' : status === 'Read' ? 'cyan' : status === 'Assessed' ? 'amber' : 'default';
                  return (
                    <tr key={c.id} className="border-b border-ink-800/80 transition hover:bg-ink-800/30">
                      <td className="py-3 pr-3 font-mono text-xs text-muted">{String(c.number).padStart(2, '0')}</td>
                      <td className="py-3 pr-3">
                        <Link href={`/learn/${c.slug}`} className="font-medium text-slate-200 transition hover:text-mint-300">{c.title}</Link>
                        <div className="mt-0.5 truncate text-[11px] text-muted">{c.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}</div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted" title={levelName(c.level)}>L{c.level}</td>
                      <td className="py-3 pr-3 text-xs text-muted">{c.difficulty}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-300">{score === undefined ? '—' : `${score}%`}</td>
                      <td className="py-3 pr-3"><Badge tone={tone}>{status === 'Mastered' && <CheckCircle2 className="h-3 w-3" />}{status}</Badge></td>
                      <td className="py-3 text-right"><Link href={`/learn/${c.slug}`} className="inline-flex items-center gap-1 text-xs text-mint-400 hover:text-mint-300">Open <ArrowRight className="h-3 w-3" /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted"><Search className="h-3 w-3" /> Showing {filtered.length} of {chapterList.length} chapters. Statuses reflect local progress only.</p>
      </Panel>
    </div>
  );
}
