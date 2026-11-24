'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Eye, Flag, Lightbulb, LockKeyhole, ShieldCheck, Trophy } from 'lucide-react';
import { useData } from '@/lib/data';
import type { CTFChallenge } from '@/lib/types';
import { Badge, DifficultyBadge, Panel } from '@/components/ui';
import { Markdown } from '@/components/markdown';

export default function CtfDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: challenges, loading } = useData<CTFChallenge[]>('ctf-challenges.json');
  const [revealed, setRevealed] = useState({ hints: false, flag: false, solution: false });

  if (loading || !challenges) {
    return <div className="space-y-4 py-10">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-ink-800" style={{ width: `${90 - n * 8}%` }} />)}</div>;
  }

  const index = challenges.findIndex((c) => c.id === params.id);
  if (index < 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">Challenge not found</h1>
        <Link href="/ctf-library" className="btn-primary mt-6">Browse all challenges</Link>
      </div>
    );
  }

  const c = challenges[index];
  const prev = challenges[index - 1];
  const next = challenges[index + 1];

  return (
    <div className="animate-fade-up">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/ctf-library" className="hover:text-mint-400">CTF library</Link>
        <span>/</span>
        <span className="text-slate-300">{c.category}</span>
        <span>/</span>
        <span className="font-mono text-slate-300">#{String(c.number).padStart(4, '0')}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="mint">Challenge #{String(c.number).padStart(4, '0')}</Badge>
              <Badge tone="cyan">{c.category}</Badge>
              <DifficultyBadge value={c.difficulty} />
              <span className="chip"><Trophy className="h-3 w-3" /> {c.points} pts</span>
              <span className="chip"><Clock className="h-3 w-3" /> {c.minutes} min</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{c.title}</h1>
          </div>

          <Panel className="p-6">
            <div className="label mb-4">Challenge brief</div>
            <Markdown content={c.prompt} />
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-ink-800 pt-4">
              {c.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
            </div>
          </Panel>

          <div className="mt-5 space-y-4">
            <Panel className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-mint-400" /><div className="label">Hints ({c.hints.length})</div></div>
                <button className="btn-ghost" onClick={() => setRevealed((r) => ({ ...r, hints: !r.hints }))}>
                  <Eye className="h-3.5 w-3.5" /> {revealed.hints ? 'Hide hints' : 'Reveal hints'}
                </button>
              </div>
              {revealed.hints ? (
                <ol className="space-y-2">
                  {c.hints.map((h, i) => <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-slate-300"><span className="font-mono text-mint-500/70">{String(i + 1).padStart(2, '0')}</span>{h}</li>)}
                </ol>
              ) : (
                <p className="text-[13px] text-muted">Try the challenge first — hints are hidden until you ask for them.</p>
              )}
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-amber-300" /><div className="label">Flag</div></div>
                <button className="btn-ghost" onClick={() => setRevealed((r) => ({ ...r, flag: !r.flag }))}>
                  <Eye className="h-3.5 w-3.5" /> {revealed.flag ? 'Hide flag' : 'Reveal flag'}
                </button>
              </div>
              {revealed.flag ? (
                <code className="block break-all rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 font-mono text-[13px] text-amber-200">{c.flag}</code>
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-muted"><LockKeyhole className="h-4 w-4" /> Hidden — submit your answer before revealing.</div>
              )}
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-cyanx-300" /><div className="label">Full solution</div></div>
                <button className="btn-ghost" onClick={() => setRevealed((r) => ({ ...r, solution: !r.solution }))}>
                  <Eye className="h-3.5 w-3.5" /> {revealed.solution ? 'Hide solution' : 'Reveal solution'}
                </button>
              </div>
              {revealed.solution ? (
                <>
                  <Markdown content={c.solution} />
                  <div className="mt-5 rounded-lg border border-mint-500/20 bg-mint-500/[0.04] p-4">
                    <div className="label mb-1">What to remember</div>
                    <p className="text-[13px] leading-relaxed text-slate-300">{c.lesson}</p>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-muted">The full step-by-step write-up and takeaway are hidden until you reveal them.</p>
              )}
            </Panel>
          </div>

          <div className="mt-10 grid gap-3 border-t border-ink-800 pt-7 sm:grid-cols-2">
            {prev ? (
              <Link href={`/ctf-library/${prev.id}`} className="panel panel-hover flex items-center gap-3 p-4">
                <ArrowLeft className="h-4 w-4 text-mint-400" />
                <div><div className="label">Previous challenge</div><div className="text-sm font-medium text-slate-200">{prev.title}</div></div>
              </Link>
            ) : <div />}
            {next && (
              <Link href={`/ctf-library/${next.id}`} className="panel panel-hover flex items-center justify-end gap-3 p-4 text-right">
                <div><div className="label">Next challenge</div><div className="text-sm font-medium text-slate-200">{next.title}</div></div>
                <ArrowRight className="h-4 w-4 text-mint-400" />
              </Link>
            )}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Panel className="p-4">
              <div className="label mb-3">Challenge info</div>
              <dl className="space-y-3 text-[12px]">
                <div><dt className="text-muted">Category</dt><dd className="text-slate-200">{c.category}</dd></div>
                <div><dt className="text-muted">Difficulty</dt><dd className="text-slate-200">{c.difficulty}</dd></div>
                <div><dt className="text-muted">Points</dt><dd className="text-slate-200">{c.points}</dd></div>
                <div><dt className="text-muted">Estimated time</dt><dd className="text-slate-200">{c.minutes} minutes</dd></div>
                <div><dt className="text-muted">Tags</dt><dd className="text-slate-200">{c.tags.join(', ')}</dd></div>
              </dl>
            </Panel>
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-300" /><div className="label">Lab only</div></div>
              <p className="text-[11px] leading-relaxed text-slate-300">All tasks are designed for local labs or fictional scenarios. Do not apply these techniques to third-party systems.</p>
            </Panel>
            <Link href="/ctf-library" className="btn-ghost w-full justify-center"><Trophy className="h-4 w-4" /> All 1,000 challenges</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
