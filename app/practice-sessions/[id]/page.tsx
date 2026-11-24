'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Dumbbell, ListChecks, PackageCheck, ShieldCheck, Target, Wrench } from 'lucide-react';
import { useData } from '@/lib/data';
import type { PracticeSession } from '@/lib/types';
import { Badge, Panel } from '@/components/ui';
import { Markdown } from '@/components/markdown';

export default function PracticeSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: sessions, loading } = useData<PracticeSession[]>('practice-sessions.json');

  if (loading || !sessions) {
    return <div className="space-y-4 py-10">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-ink-800" style={{ width: `${90 - n * 8}%` }} />)}</div>;
  }

  const index = sessions.findIndex((s) => s.id === params.id);
  if (index < 0) {
    return <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Session not found</h1><Link href="/practice-sessions" className="btn-primary mt-6">Browse sessions</Link></div>;
  }

  const s = sessions[index];
  const prev = sessions[index - 1];
  const next = sessions[index + 1];

  return (
    <div className="animate-fade-up">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/practice-sessions" className="hover:text-mint-400">Practice sessions</Link>
        <span>/</span>
        <span className="text-slate-300">{s.track}</span>
        <span>/</span>
        <span className="font-mono text-slate-300">session {String(s.number).padStart(2, '0')}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="mint">Session {String(s.number).padStart(2, '0')}</Badge>
              <Badge tone="cyan">{s.track}</Badge>
              <Badge>{s.level}</Badge>
              <span className="chip"><Clock className="h-3 w-3" /> {s.hours} hours</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{s.title}</h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">{s.goal}</p>
          </div>

          <Panel className="p-6">
            <Markdown content={s.content} />
          </Panel>

          <div className="mt-10 grid gap-3 border-t border-ink-800 pt-7 sm:grid-cols-2">
            {prev ? (
              <Link href={`/practice-sessions/${prev.id}`} className="panel panel-hover flex items-center gap-3 p-4">
                <ArrowLeft className="h-4 w-4 text-mint-400" />
                <div><div className="label">Previous session</div><div className="text-sm font-medium text-slate-200">{prev.title}</div></div>
              </Link>
            ) : <div />}
            {next && (
              <Link href={`/practice-sessions/${next.id}`} className="panel panel-hover flex items-center justify-end gap-3 p-4 text-right">
                <div><div className="label">Next session</div><div className="text-sm font-medium text-slate-200">{next.title}</div></div>
                <ArrowRight className="h-4 w-4 text-mint-400" />
              </Link>
            )}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-mint-400" /><div className="label">Objectives</div></div>
              <ul className="space-y-2">{s.objectives.map((o) => <li key={o} className="flex gap-2 text-[12px] leading-relaxed text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />{o}</li>)}</ul>
            </Panel>
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-cyanx-300" /><div className="label">Environment</div></div>
              <div className="flex flex-wrap gap-1.5">{s.environment.map((e) => <span key={e} className="chip">{e}</span>)}</div>
            </Panel>
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><PackageCheck className="h-4 w-4 text-mint-400" /><div className="label">Deliverables</div></div>
              <ul className="space-y-2">{s.deliverables.map((d) => <li key={d} className="flex gap-2 text-[12px] leading-relaxed text-slate-300"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />{d}</li>)}</ul>
            </Panel>
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-300" /><div className="label">Lab only</div></div>
              <p className="text-[11px] leading-relaxed text-slate-300">Use only the isolated environment described in the session. Do not test third-party systems.</p>
            </Panel>
            <Link href="/practice-sessions" className="btn-ghost w-full justify-center"><ListChecks className="h-4 w-4" /> All sessions</Link>
            <Link href="/labs" className="btn-ghost w-full justify-center"><Dumbbell className="h-4 w-4" /> Lab catalogue</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
