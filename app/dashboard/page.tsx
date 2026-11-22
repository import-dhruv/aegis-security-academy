'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  FlaskConical,
  GraduationCap,
  Layers3,
  Lock,
  NotebookPen,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useAllData } from '@/lib/data';
import { useProgress, MASTERY_SCORE } from '@/components/providers';
import { Badge, DifficultyBadge, EmptyState, Panel, ProgressBar, StatCard } from '@/components/ui';
import { Icon } from '@/components/icon';
import { cn, formatMinutes, levelName, pct } from '@/lib/utils';

const DAILY_TASKS = [
  { key: 'read', label: 'Read one chapter', href: '/schools', icon: <BookOpenText className="h-4 w-4" /> },
  { key: 'cards', label: 'Answer 10 flashcards', href: '/flashcards', icon: <Layers3 className="h-4 w-4" /> },
  { key: 'lab', label: 'Do one lab', href: '/labs', icon: <FlaskConical className="h-4 w-4" /> },
  { key: 'note', label: 'Write one note', href: '/notes', icon: <NotebookPen className="h-4 w-4" /> },
] as const;

export default function DashboardPage() {
  const { chapters, schools, levels } = useAllData();
  const { state, ready, stats, isMastered, addStudyMinutes } = useProgress();

  // Local daily checklist (kept in the browser, keyed by calendar day).
  const [daily, setDaily] = useState<Record<string, boolean>>({});
  const [dailyReady, setDailyReady] = useState(false);
  const [showLogged, setShowLogged] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem('aegis-daily-goals');
      if (raw) {
        const saved = JSON.parse(raw) as { date: string; done: string[] };
        if (saved.date === today && Array.isArray(saved.done)) {
          setDaily(Object.fromEntries(saved.done.map((k) => [k, true])));
        }
      }
    } catch {
      /* storage unavailable — checklist stays session-only */
    }
    setDailyReady(true);
  }, []);

  useEffect(() => {
    if (!dailyReady) return;
    try {
      localStorage.setItem(
        'aegis-daily-goals',
        JSON.stringify({ date: new Date().toISOString().slice(0, 10), done: Object.keys(daily).filter((k) => daily[k]) }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [daily, dailyReady]);

  useEffect(() => {
    if (!showLogged) return;
    const t = setTimeout(() => setShowLogged(false), 2200);
    return () => clearTimeout(t);
  }, [showLogged]);

  if (!ready || chapters.loading || schools.loading || levels.loading) {
    return (
      <div className="space-y-5 py-6">
        <div className="h-48 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />)}
        </div>
        <p className="pt-2 text-center text-xs text-muted">Loading your learning dashboard…</p>
      </div>
    );
  }

  if (chapters.error || schools.error || levels.error) {
    return (
      <Panel className="p-8">
        <EmptyState
          title="Could not load your dashboard"
          description="The local chapter data could not be read. Refresh the page to try again — your progress is stored separately and has not been lost."
          action={<Link href="/dashboard" className="btn-primary">Reload dashboard</Link>}
        />
      </Panel>
    );
  }

  const chapterList = [...(chapters.data ?? [])].sort((a, b) => a.id - b.id);
  const recommended = chapterList.filter((c) => !isMastered(c.id)).slice(0, 3);
  const next = recommended[0];

  const weeklyLabels = [
    { label: 'Chapters read', value: Math.min(5, stats.completed), target: 5, tone: 'mint' as const },
    { label: 'Labs completed', value: Math.min(3, state.labCompletions.length), target: 3, tone: 'cyan' as const },
    {
      label: 'Flashcard reviews',
      value: Math.min(50, Object.values(state.flashcardReviews).reduce((sum, r) => sum + r.reps, 0)),
      target: 50,
      tone: 'mint' as const,
    },
  ];

  const activeSchools = [...(schools.data ?? [])]
    .sort((a, b) => b.chapterIds.length - a.chapterIds.length)
    .slice(0, 4);

  const levelRows = (levels.data ?? []).length
    ? [...(levels.data ?? [])].sort((a, b) => a.level - b.level)
    : Array.from({ length: 10 }, (_, i) => ({ level: i + 1, name: levelName(i + 1), description: '', chapterIds: [] as number[] }));

  const avgForTag = (tag: string) => {
    const values = chapterList
      .filter((c) => c.tags.includes(tag))
      .map((c) => state.quizScores[c.id])
      .filter((v): v is number => v !== undefined);
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  };

  return (
    <div className="animate-fade-up space-y-6 pb-10">
      {/* ---------------- Hero ---------------- */}
      <Panel className="grid-bg relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-mint-500/[0.07] blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <div className="label text-mint-400">Welcome back, {state.name || 'Researcher'}</div>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-50 md:text-4xl">
              Your path to mastery, one chapter at a time.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
              You are currently operating as a <span className="font-medium text-mint-300">{levelName(stats.level)}</span>.
              {next
                ? ` Your next recommended chapter is ${next.title} — pick up where you left off and keep the streak alive.`
                : ' Every chapter has been mastered. Explore research, labs and case studies to keep sharpening your edge.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {next ? (
                <Link href={`/learn/${next.slug}`} className="btn-primary">
                  Continue learning <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/analytics" className="btn-primary">
                  Review your progress <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <span className="chip"><Flame className="h-3.5 w-3.5 text-amber-300" /> {state.streak} day streak</span>
              <span className="chip"><Target className="h-3.5 w-3.5 text-mint-400" /> {stats.overallPct}% overall mastery</span>
            </div>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="label">Current level</div>
                <div className="mt-1.5 text-lg font-semibold text-slate-100">L{stats.level} · {levelName(stats.level)}</div>
              </div>
              <div className="rounded-lg border border-mint-500/20 bg-mint-500/10 p-2 text-mint-400"><Sparkles className="h-5 w-5" /></div>
            </div>
            <div className="mt-5 mb-2 flex items-center justify-between text-xs text-muted">
              <span>Level progress</span>
              <span className="font-mono text-mint-400">{stats.levelPct}%</span>
            </div>
            <ProgressBar value={stats.levelPct} />
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Reach 60% of this level&apos;s chapters at a {MASTERY_SCORE}% quiz score to advance.
            </p>
          </div>
        </div>
      </Panel>

      {/* ---------------- Stat cards ---------------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Overall mastery" value={`${stats.overallPct}%`} sub={`${stats.mastered} of ${stats.totalChapters} chapters`} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Chapters mastered" value={stats.mastered} sub={`${stats.completed} marked as read`} icon={<CheckCircle2 className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Study time" value={formatMinutes(state.studyMinutes)} sub={`${(state.studyMinutes / 60).toFixed(1)} hours logged`} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Labs completed" value={state.labCompletions.length} sub="Hands-on exercises" icon={<FlaskConical className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Challenges solved" value={state.challengeSolves.length} sub="CTF flag captures" icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Quizzes taken" value={stats.quizzesTaken} sub="Mastery assessments" icon={<BookOpenText className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Average score" value={`${stats.quizAverage}%`} sub="Best score per chapter" icon={<Target className="h-4 w-4" />} />
        <StatCard label="Due flashcards" value={stats.dueCards} sub="Scheduled for review" icon={<Layers3 className="h-4 w-4" />} tone={stats.dueCards ? 'cyan' : 'slate'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* ---------------- Continue learning ---------------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">Continue learning</h2>
                <p className="mt-1 text-xs text-muted">The next unmastered chapters in the curriculum order.</p>
              </div>
              <Link href="/schools" className="link whitespace-nowrap text-xs">All chapters <ChevronRight className="inline h-3.5 w-3.5" /></Link>
            </div>
            {recommended.length === 0 ? (
              <EmptyState
                title="Everything is mastered"
                description="You have demonstrated mastery across the full chapter library. Continue with labs, CTF challenges or research papers."
                action={<Link href="/labs" className="btn-ghost">Explore labs</Link>}
              />
            ) : (
              <div className="space-y-2.5">
                {recommended.map((c) => (
                  <Link key={c.id} href={`/learn/${c.slug}`} className="panel panel-hover flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-mint-500/25 bg-mint-500/10 font-mono text-xs font-semibold text-mint-300">
                      {String(c.number).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-100">{c.title}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <DifficultyBadge value={c.difficulty} />
                        <span className="text-[11px] text-muted">Level {c.level}</span>
                        <span className="text-[11px] text-muted">·</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted"><Clock className="h-3 w-3" /> {formatMinutes(c.minutes)}</span>
                        {state.quizScores[c.id] !== undefined && <Badge tone="cyan">Best {state.quizScores[c.id]}%</Badge>}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-mint-400" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {/* ---------------- Active schools ---------------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">Active schools</h2>
                <p className="mt-1 text-xs text-muted">The four largest schools, by mastery of their chapters.</p>
              </div>
              <Link href="/schools" className="link whitespace-nowrap text-xs">All schools <ChevronRight className="inline h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeSchools.map((s) => {
                const total = s.chapterIds.length;
                const done = s.chapterIds.filter((id) => isMastered(id)).length;
                const value = pct(done, total);
                const iconName = (s.icon || 'graduation-cap')
                  .split('-')
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join('');
                return (
                  <Link key={s.id} href={`/schools#${s.id}`} className="panel panel-hover block p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-cyanx-500/20 bg-cyanx-500/10 p-2 text-cyanx-300">
                        <Icon name={iconName} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-100">{s.name}</div>
                        <div className="mt-0.5 text-[11px] text-muted">{done} of {total} chapters mastered</div>
                      </div>
                      <span className="font-mono text-xs text-mint-400">{value}%</span>
                    </div>
                    <ProgressBar value={value} className="mt-4" tone={value >= 60 ? 'mint' : 'cyan'} />
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {/* ---------------- Daily goals ---------------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="section-title">Daily goals</h2>
              <span className="chip">{DAILY_TASKS.filter((t) => daily[t.key]).length} / {DAILY_TASKS.length}</span>
            </div>
            <p className="mb-4 text-xs text-muted">Small, repeatable sessions compound faster than cramming.</p>
            <div className="space-y-2">
              {DAILY_TASKS.map((task) => {
                const checked = Boolean(daily[task.key]);
                return (
                  <div key={task.key} className="flex items-center gap-3 rounded-lg border border-ink-800 bg-ink-900/50 px-3 py-2.5">
                    <button
                      type="button"
                      aria-label={`Toggle ${task.label}`}
                      aria-pressed={checked}
                      onClick={() => setDaily((d) => ({ ...d, [task.key]: !d[task.key] }))}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition',
                        checked ? 'border-mint-500 bg-mint-500 text-ink-950' : 'border-ink-600 bg-ink-850 text-transparent hover:border-mint-500/60',
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <span className={cn('min-w-0 flex-1 text-[13px]', checked ? 'text-muted line-through' : 'text-slate-200')}>{task.label}</span>
                    <Link href={task.href} className="shrink-0 text-muted transition hover:text-mint-400" aria-label={`Open ${task.label}`}>
                      {task.icon}
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-800 pt-4">
              <button type="button" className="btn-primary" onClick={() => { addStudyMinutes(15); setShowLogged(true); }}>
                <Clock className="h-4 w-4" /> Log 15 min study
              </button>
              {showLogged && <span className="text-xs text-mint-400">+15 minutes added to your total.</span>}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">Your checklist is saved locally per day. Study minutes are added to your lifetime total.</p>
          </Panel>

          {/* ---------------- Weekly goals ---------------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="section-title">Weekly goals</h2>
              <span className="label">Targets</span>
            </div>
            <p className="mb-5 text-xs text-muted">A steady rhythm: 5 chapters, 3 labs and 50 flashcard reviews.</p>
            <div className="space-y-5">
              {weeklyLabels.map((g) => (
                <div key={g.label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{g.label}</span>
                    <span className="font-mono text-muted">{g.value} / {g.target}</span>
                  </div>
                  <ProgressBar value={pct(g.value, g.target)} tone={g.tone} />
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-ink-800 pt-3 text-[11px] leading-relaxed text-muted">
              These bars use lifetime totals as a proxy: local progress keeps no per-week history, so they show pace toward the target rather than a literal week-by-week log.
            </p>
          </Panel>

          {/* ---------------- Weak areas ---------------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="section-title">Weak areas</h2>
              <span className="label">Review queue</span>
            </div>
            <p className="mb-4 text-xs text-muted">Domains with the lowest average quiz scores (at least two assessed chapters).</p>
            {stats.weakAreas.length === 0 ? (
              <EmptyState
                title="No weak areas identified yet"
                description="Take mastery quizzes in a few chapters and AEGIS will surface the domains that deserve your next revision session."
                action={<Link href="/assessments" className="btn-ghost">Browse assessments</Link>}
              />
            ) : (
              <div className="space-y-2">
                {stats.weakAreas.map((area) => {
                  const linked = chapterList.find((c) => c.tags.includes(area) && !isMastered(c.id)) ?? chapterList.find((c) => c.tags.includes(area));
                  const avg = avgForTag(area);
                  return (
                    <div key={area} className="rounded-lg border border-ink-800 bg-ink-900/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="amber">#{area}</Badge>
                        {avg !== null && <span className="font-mono text-xs text-amber-300">avg {avg}%</span>}
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-muted">
                        {linked ? (
                          <>Revisit <Link href={`/learn/${linked.slug}`} className="link">{linked.title}</Link> and drill its flashcards.</>
                        ) : (
                          <>Review your notes for this domain and retake its quizzes.</>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ---------------- Skill tree / level ladder ---------------- */}
      <Panel className="p-5 md:p-8">
        <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">Skill tree · level ladder</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              Ten tiers from first principles to independent research. A level unlocks once you reach 60% mastery within the previous tier; a chapter counts as mastered at a {MASTERY_SCORE}% quiz score.
            </p>
          </div>
          <Badge tone="mint"><GraduationCap className="h-3 w-3" /> Level {stats.level} · {levelName(stats.level)}</Badge>
        </div>

        <div className="relative">
          <div className="absolute bottom-6 left-[19px] top-6 w-px bg-ink-700" aria-hidden />
          {levelRows.map((l) => {
            const b = stats.levelBreakdown.find((x) => x.level === l.level);
            const total = b?.total ?? l.chapterIds.length;
            const mastered = b?.mastered ?? l.chapterIds.filter((id) => isMastered(id)).length;
            const value = total ? pct(mastered, total) : 0;
            const locked = l.level > stats.level;
            const current = l.level === stats.level;
            const complete = total > 0 && value >= 100;
            const title = l.level === 10 ? 'Elite Security Researcher' : l.name;
            return (
              <div key={l.level} className="relative flex gap-4 pb-4 last:pb-0">
                <div
                  className={cn(
                    'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition',
                    locked && 'border-ink-700 bg-ink-900 text-ink-600',
                    !locked && !current && !complete && 'border-cyanx-500/40 bg-cyanx-500/10 text-cyanx-300',
                    current && 'border-mint-500 bg-mint-500/15 text-mint-300 ring-4 ring-mint-500/10',
                    complete && !current && 'border-mint-500/50 bg-mint-500/10 text-mint-300',
                  )}
                >
                  {locked ? <Lock className="h-3.5 w-3.5" /> : l.level}
                </div>
                <div className={cn('min-w-0 flex-1 rounded-xl border p-4', current ? 'border-mint-500/30 bg-mint-500/[0.045]' : 'border-ink-800 bg-ink-900/40', locked && 'opacity-55')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">L{l.level} · {title}</span>
                      {current && <Badge tone="mint">Current</Badge>}
                      {complete && <Badge tone="cyan">Complete</Badge>}
                    </div>
                    <span className="font-mono text-[11px] text-muted">{mastered}/{total} chapters · {value}%</span>
                  </div>
                  {l.description && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{l.description}</p>}
                  <ProgressBar value={value} className="mt-3" tone={complete || current ? 'mint' : 'cyan'} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
