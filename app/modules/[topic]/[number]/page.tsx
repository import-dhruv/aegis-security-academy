'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Clock, GraduationCap, Lightbulb, ListChecks, Quote } from 'lucide-react';
import { useData } from '@/lib/data';
import type { Module } from '@/lib/types';
import { Badge, Panel, ProgressBar } from '@/components/ui';
import { Markdown } from '@/components/markdown';
import { cn } from '@/lib/utils';

const TOPIC_NAMES: Record<string, string> = {
  'bug-bounty': 'Bug Bounty Academy',
  'web-security': 'Web Security',
  networking: 'Networking',
  'linux-windows': 'Linux & Windows',
  'cloud-security': 'Cloud Security',
  'mobile-security': 'Mobile Security',
  'reverse-engineering': 'Reverse Engineering',
  'ai-security': 'AI Security',
  'field-guide': 'Practical Bug Bounty Field Guide',
  'web-security-advanced': 'Web Security — Advanced Volume II',
  'applied-ai-security': 'Applied AI Security',
  'ai-bug-bounty': 'AI-Powered Bug Bounty',
};

const hubHref = (topic: string) => (topic === 'field-guide' ? '/field-guide' : `/topics/${topic}`);

export default function ModulePage() {
  const params = useParams<{ topic: string; number: string }>();
  const topic = params.topic;
  const number = Number(params.number);
  const { data: modules, loading } = useData<Module[]>(`modules/${topic}.json`);

  if (loading || !modules) {
    return <div className="space-y-4 py-10">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-ink-800" style={{ width: `${90 - n * 8}%` }} />)}</div>;
  }

  const index = modules.findIndex((m) => m.number === number);
  if (index < 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">Module not found</h1>
        <Link href={hubHref(topic)} className="btn-primary mt-6">Back to topic</Link>
      </div>
    );
  }

  const mod = modules[index];
  const prev = modules[index - 1];
  const next = modules[index + 1];
  const topicName = TOPIC_NAMES[topic] ?? topic;

  return (
    <div className="animate-fade-up">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/dashboard" className="hover:text-mint-400">Academy</Link>
        <span>/</span>
        <Link href={hubHref(topic)} className="hover:text-mint-400">{topicName}</Link>
        <span>/</span>
        <span className="text-slate-300">Module {String(mod.number).padStart(2, '0')}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <div className="mb-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="mint">Module {String(mod.number).padStart(2, '0')} / 50</Badge>
              <Badge tone="cyan">{mod.level}</Badge>
              <span className="chip"><Clock className="h-3 w-3" /> {mod.minutes} min</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{mod.title}</h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">{mod.summary}</p>
          </div>

          <Markdown content={mod.content} />

          <div className="mt-12 grid gap-3 border-t border-ink-800 pt-7 sm:grid-cols-2">
            {prev ? (
              <Link href={`/modules/${topic}/${prev.number}`} className="panel panel-hover flex items-center gap-3 p-4">
                <ArrowLeft className="h-4 w-4 text-mint-400" />
                <div><div className="label">Previous module</div><div className="text-sm font-medium text-slate-200">{prev.title}</div></div>
              </Link>
            ) : <div />}
            {next && (
              <Link href={`/modules/${topic}/${next.number}`} className="panel panel-hover flex items-center justify-end gap-3 p-4 text-right">
                <div><div className="label">Next module</div><div className="text-sm font-medium text-slate-200">{next.title}</div></div>
                <ArrowRight className="h-4 w-4 text-mint-400" />
              </Link>
            )}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Panel className="p-4">
              <div className="label mb-3">Curriculum progress</div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>Module {mod.number} of {modules.length}</span>
                <span className="font-mono text-mint-400">{Math.round((mod.number / modules.length) * 100)}%</span>
              </div>
              <ProgressBar value={Math.round((mod.number / modules.length) * 100)} />
              <Link href={hubHref(topic)} className="btn-ghost mt-4 w-full justify-center"><BookOpen className="h-4 w-4" /> Full curriculum</Link>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4 text-mint-400" /><div className="label">Objectives</div></div>
              <ul className="space-y-2">
                {mod.objectives.map((o) => <li key={o} className="flex gap-2 text-[12px] leading-relaxed text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />{o}</li>)}
              </ul>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-cyanx-300" /><div className="label">You have mastered this when</div></div>
              <ul className="space-y-2">
                {mod.takeaways.map((t) => <li key={t} className="flex gap-2 text-[12px] leading-relaxed text-slate-300"><span className="mt-1 text-cyanx-300">✓</span>{t}</li>)}
              </ul>
            </Panel>

            {mod.practice && (
              <Panel className="p-4">
                <div className="mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-mint-400" /><div className="label">Lab practice</div></div>
                <p className="text-[12px] leading-relaxed text-slate-300">{mod.practice}</p>
              </Panel>
            )}

            {mod.sources.length > 0 && (
              <Panel className="p-4">
                <div className="mb-3 flex items-center gap-2"><Quote className="h-4 w-4 text-cyanx-300" /><div className="label">Practitioner sources</div></div>
                <div className="space-y-2">
                  {mod.sources.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className={cn('block text-[11px] leading-snug text-cyanx-300 hover:underline')}>
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
