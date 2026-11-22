'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { useData } from '@/lib/data';
import type { School, Chapter } from '@/lib/types';
import { Badge, PageHeader, Panel, ProgressBar, SearchInput } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useProgress } from '@/components/providers';
import { pct } from '@/lib/utils';

const CORE_COUNT = 19;

export default function SchoolsPage() {
  const { data: schools } = useData<School[]>('schools.json');
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { isMastered } = useProgress();
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () => (schools ?? []).filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase())),
    [schools, q],
  );
  const core = filtered.slice(0, CORE_COUNT);
  const support = filtered.slice(CORE_COUNT);

  const renderSchool = (s: School, i: number) => {
    const mastered = s.chapterIds.filter(isMastered).length;
    return (
      <Link key={s.id} href={`/schools/${s.id}`} className="panel panel-hover group flex flex-col p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg border border-ink-700 bg-ink-900 p-2.5 text-mint-400"><Icon name={s.icon} className="h-5 w-5" /></div>
          <span className="font-mono text-[11px] text-ink-600">{String(i + 1).padStart(2, '0')}</span>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-slate-100 group-hover:text-mint-300">{s.name}</h3>
        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{s.description}</p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted">
            <span>{s.chapterIds.length} chapters</span>
            <span className="font-mono text-mint-400">{mastered}/{s.chapterIds.length}</span>
          </div>
          <ProgressBar value={pct(mastered, s.chapterIds.length)} />
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-mint-400 opacity-0 transition group-hover:opacity-100">
          Open school <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Curriculum"
        title="Cybersecurity Schools"
        description="Eighteen core schools build depth in a defined order; six supporting tracks provide labs, projects, roadmap, study material, research and assessment infrastructure. Each chapter is mapped to one or more schools."
        actions={<Badge tone="mint"><BookOpen className="h-3 w-3" /> {chapters?.length ?? 36} chapters</Badge>}
      />

      <SearchInput value={q} onChange={setQ} placeholder="Search schools…" className="mb-8 max-w-md" />

      {core.length > 0 && (
        <section className="mb-12">
          <div className="label mb-4 text-mint-400">Core schools · 01–18</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{core.map(renderSchool)}</div>
        </section>
      )}
      {support.length > 0 && (
        <section>
          <div className="label mb-4 text-cyanx-300">Supporting tracks</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{support.map((s, i) => renderSchool(s, i + CORE_COUNT))}</div>
        </section>
      )}
      {filtered.length === 0 && (
        <Panel className="p-12 text-center text-sm text-muted">No schools match “{q}”. Try a broader term.</Panel>
      )}

      <div className="mt-12 rounded-xl border border-ink-700 bg-ink-900/60 p-6">
        <h3 className="text-sm font-semibold text-slate-100">How progression works</h3>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">Reading a chapter marks it as visited. Mastery requires a demonstrated score of at least 80% on its assessment. Levels unlock when 60% or more of the chapters at the preceding level are mastered <em>and</em> you have completed enough labs or CTF challenges for that tier. This prevents “click-to-complete” progress and keeps the prerequisite chain meaningful.</p>
      </div>
    </div>
  );
}
