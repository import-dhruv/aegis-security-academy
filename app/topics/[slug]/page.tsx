'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock, FlaskConical, Wrench } from 'lucide-react';
import { useData } from '@/lib/data';
import type { Chapter, School, Tool, Lab } from '@/lib/types';
import { Badge, DifficultyBadge, PageHeader, Panel, SearchInput, ProgressBar } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useProgress } from '@/components/providers';
import { topicConfig } from '@/lib/nav';
import { cn, formatMinutes, pct } from '@/lib/utils';

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { data: schools } = useData<School[]>('schools.json');
  const { data: tools } = useData<Tool[]>('tools.json');
  const { data: labs } = useData<Lab[]>('labs.json');
  const { isMastered } = useProgress();
  const [q, setQ] = useState('');
  const config = topicConfig[slug];

  const list = useMemo(() => {
    if (!config || !chapters) return [];
    return chapters.filter((c) => config.chapterIds.includes(c.id) && `${c.title} ${c.description}`.toLowerCase().includes(q.toLowerCase()));
  }, [config, chapters, q]);

  if (!config) {
    return <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Topic not found</h1><Link href="/schools" className="btn-primary mt-6">Browse schools</Link></div>;
  }

  const relatedSchools = (schools ?? []).filter((s) => config.schoolIds.includes(s.id));
  const relatedTools = (tools ?? []).filter((t) => config.schoolIds.some((sid) => t.category.toLowerCase().includes(sid.split('-')[0]))).slice(0, 8);
  const relatedLabs = (labs ?? []).filter((l) => l.skills.some((s) => config.title.toLowerCase().includes(s.toLowerCase().split(' ')[0]))).slice(0, 4);
  const mastered = list.filter((c) => isMastered(c.id)).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Topic hub"
        title={config.title}
        description={config.subtitle}
        actions={<Link href="/roadmap" className="btn-ghost">Where this fits <ArrowRight className="h-4 w-4" /></Link>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="label text-mint-400">{list.length} mapped chapters · {mastered} mastered</div>
            <SearchInput value={q} onChange={setQ} placeholder="Filter chapters…" className="w-full sm:w-64" />
          </div>
          <div className="space-y-3">
            {list.map((c) => (
              <Link key={c.id} href={`/learn/${c.slug}`} className="panel panel-hover flex items-start gap-4 p-5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs', isMastered(c.id) ? 'border-mint-500/40 bg-mint-500/10 text-mint-400' : 'border-ink-700 bg-ink-900 text-muted')}>{String(c.number).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-100">{c.title}</h3>
                    <DifficultyBadge value={c.difficulty} />
                    {isMastered(c.id) && <CheckCircle2 className="h-4 w-4 text-mint-400" />}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{c.tags.slice(0, 5).map((t) => <span key={t} className="chip">#{t}</span>)}</div>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <div className="text-[11px] text-muted"><Clock className="mr-1 inline h-3 w-3" />{formatMinutes(c.minutes)}</div>
                  <div className="mt-2 text-mint-400 opacity-0 transition group-hover:opacity-100"><ArrowRight className="h-4 w-4" /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-mint-400" /><div className="label">Topic progress</div></div>
            <div className="stat-num">{pct(mastered, list.length)}%</div>
            <ProgressBar className="mt-3" value={pct(mastered, list.length)} />
            <p className="mt-3 text-[11px] leading-relaxed text-muted">Demonstrated mastery (80%+ assessment) across the chapters mapped to this topic.</p>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2"><Icon name={relatedSchools[0]?.icon ?? 'GraduationCap'} className="h-4 w-4 text-cyanx-300" /><div className="label">Related schools</div></div>
            <div className="space-y-2">
              {relatedSchools.map((s) => (
                <Link key={s.id} href={`/schools/${s.id}`} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-xs text-slate-300 transition hover:border-mint-500/30 hover:text-mint-300">
                  {s.name} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </Panel>

          {relatedLabs.length > 0 && (
            <Panel className="p-5">
              <div className="mb-3 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-mint-400" /><div className="label">Practice labs</div></div>
              <div className="space-y-2">
                {relatedLabs.map((l) => (
                  <a key={l.id} href={l.url.startsWith('/') ? l.url : l.url} target={l.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-xs text-slate-300 transition hover:border-mint-500/30">
                    {l.title} <span className="mt-0.5 block text-[10px] text-muted">{l.provider} · {l.difficulty}</span>
                  </a>
                ))}
              </div>
              <Link href="/labs" className="mt-3 inline-block text-xs text-mint-400 hover:underline">All labs →</Link>
            </Panel>
          )}

          {relatedTools.length > 0 && (
            <Panel className="p-5">
              <div className="mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-cyanx-300" /><div className="label">Useful tools</div></div>
              <div className="flex flex-wrap gap-1.5">
                {relatedTools.map((t) => <Link key={t.id} href={`/tools?tool=${t.id}`} className="chip hover:border-mint-500/40 hover:text-mint-300">{t.name}</Link>)}
              </div>
              <Link href="/tools" className="mt-3 inline-block text-xs text-mint-400 hover:underline">Full encyclopedia →</Link>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
