'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Circle, Lock, ShieldCheck } from 'lucide-react';
import { useData } from '@/lib/data';
import type { School, Chapter } from '@/lib/types';
import { Badge, DifficultyBadge, PageHeader, Panel, ProgressBar } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useProgress, MASTERY_SCORE } from '@/components/providers';
import { cn, formatMinutes, levelName, pct } from '@/lib/utils';

export default function SchoolPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: schools } = useData<School[]>('schools.json');
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { isMastered, state, toggleComplete, stats } = useProgress();
  const school = schools?.find((s) => s.id === slug);

  if (!school) {
    return <div className="py-20 text-center"><h1 className="text-2xl font-semibold">School not found</h1><Link href="/schools" className="btn-primary mt-6">Browse schools</Link></div>;
  }

  const list = (chapters ?? []).filter((c) => school.chapterIds.includes(c.id));
  const mastered = list.filter((c) => isMastered(c.id)).length;
  const read = list.filter((c) => state.completed[c.id]).length;
  const next = list.find((c) => !isMastered(c.id));

  return (
    <div className="animate-fade-up">
      <Link href="/schools" className="mb-6 inline-flex items-center gap-2 text-xs text-muted hover:text-mint-400"><ArrowLeft className="h-3.5 w-3.5" /> All schools</Link>
      <PageHeader
        eyebrow="School"
        title={school.name}
        description={school.description}
        actions={next ? <Link href={`/learn/${next.slug}`} className="btn-primary">Continue: Ch {next.number} <ArrowRight className="h-4 w-4" /></Link> : <Badge tone="mint"><CheckCircle2 className="h-3 w-3" /> School mastered</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-5"><div className="label">Mastery</div><div className="stat-num mt-2">{pct(mastered, list.length)}%</div><ProgressBar className="mt-3" value={pct(mastered, list.length)} /><div className="mt-2 text-xs text-muted">{mastered} of {list.length} chapters at 80%+</div></Panel>
        <Panel className="p-5"><div className="label">Reading</div><div className="stat-num mt-2">{read}/{list.length}</div><ProgressBar className="mt-3" value={pct(read, list.length)} tone="cyan" /><div className="mt-2 text-xs text-muted">Chapters marked as read</div></Panel>
        <Panel className="p-5"><div className="label">Level span</div><div className="stat-num mt-2">{Math.min(...list.map((c) => c.level))}–{Math.max(...list.map((c) => c.level))}</div><div className="mt-3 text-xs text-muted">{levelName(Math.min(...list.map((c) => c.level)))} → {levelName(Math.max(...list.map((c) => c.level)))}</div></Panel>
      </div>

      <section className="mt-10">
        <div className="label mb-4 text-mint-400">Chapters in this school</div>
        <div className="space-y-3">
          {list.map((c) => {
            const done = isMastered(c.id);
            const score = state.quizScores[c.id];
            const prereqsMet = c.prerequisites.every((p) => isMastered(p));
            return (
              <Panel key={c.id} hover className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm', done ? 'border-mint-500/40 bg-mint-500/10 text-mint-400' : 'border-ink-700 bg-ink-900 text-muted')}>
                  {String(c.number).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/learn/${c.slug}`} className="text-[15px] font-semibold text-slate-100 hover:text-mint-300">{c.title}</Link>
                    <DifficultyBadge value={c.difficulty} />
                    {done && <Badge tone="mint"><CheckCircle2 className="h-3 w-3" /> Mastered</Badge>}
                    {!prereqsMet && <Badge><Lock className="h-3 w-3" /> Prerequisites pending</Badge>}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatMinutes(c.minutes)}</span>
                    <span>{c.words.toLocaleString()} words</span>
                    <span className="font-mono">{score === undefined ? 'Not assessed' : `Best ${score}%`}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button className="btn-icon" title={state.completed[c.id] ? 'Mark unread' : 'Mark read'} onClick={() => toggleComplete(c.id)}>
                    {state.completed[c.id] ? <CheckCircle2 className="h-4 w-4 text-mint-400" /> : <Circle className="h-4 w-4" />}
                  </button>
                  <Link href={`/learn/${c.slug}`} className="btn-ghost">Open <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <div className="mt-10 flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-900/60 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint-400" />
        <div>
          <div className="text-sm font-semibold text-slate-100">Prerequisite chain</div>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted">Earlier chapters introduce vocabulary used throughout the curriculum. If a topic feels opaque, go back one chapter before pushing forward. Advanced schools assume the foundations are genuinely understood, not merely opened.</p>
          <p className="mt-2 text-[11px] text-muted/80">Current level: {stats.level} · {MASTERY_SCORE}% mastery threshold</p>
        </div>
      </div>
    </div>
  );
}
