'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Bookmark, Check, ChevronRight, Circle, ClipboardCheck, Code2,
  Filter, FolderGit2, Github, Layers3, ListFilter, ShieldCheck, Target,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { Project } from '@/lib/types';
import { useProgress } from '@/components/providers';
import { Badge, EmptyState, KV, PageHeader, Panel, ProgressBar, SearchInput, StatCard } from '@/components/ui';
import { cn, pct } from '@/lib/utils';

const checklistItems = [
  { id: 'readme', label: 'README with purpose, scope, and usage' },
  { id: 'license', label: 'Clear open-source license' },
  { id: 'authorized', label: 'Authorized-use & legal note' },
  { id: 'screenshots', label: 'Screenshots or sample output' },
  { id: 'tests', label: 'Tests and how to run them' },
  { id: 'writeup', label: 'Technical write-up of findings' },
];

const refFor = (id: string) => `project:${id}`;

function ProjectsView() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: projects, loading, error } = useData<Project[]>('projects.json');
  const progress = useProgress();
  const [search, setSearch] = useState('');
  const [stack, setStack] = useState('all');
  const [sort, setSort] = useState('default');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aegis-portfolio-checklist');
      if (raw) setChecklist(JSON.parse(raw) as Record<string, boolean>);
    } catch { /* ignore corrupted local checklist */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('aegis-portfolio-checklist', JSON.stringify(checklist)); } catch { /* storage unavailable */ }
  }, [checklist]);

  const list = projects ?? [];
  const stacks = useMemo(() => Array.from(new Set(list.map((p) => p.stack))).sort(), [list]);
  const selectedId = params.get('p');
  const selected = list.find((p) => p.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = list.filter((p) => {
      if (stack !== 'all' && p.stack !== stack) return false;
      if (q && ![p.name, p.problem, p.stack, p.prereq, p.objectives].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'stack') result.sort((a, b) => a.stack.localeCompare(b.stack) || a.name.localeCompare(b.name));
    return result;
  }, [list, stack, search, sort]);

  const bookmarked = list.filter((p) => progress.state.bookmarks.includes(refFor(p.id)));
  const checklistDone = checklistItems.filter((i) => checklist[i.id]).length;

  if (selected) {
    const fields: { label: string; value: string; icon: React.ReactNode }[] = [
      { label: 'Problem', value: selected.problem, icon: <Target className="h-4 w-4" /> },
      { label: 'Objectives', value: selected.objectives, icon: <Check className="h-4 w-4" /> },
      { label: 'Prerequisites', value: selected.prereq, icon: <Layers3 className="h-4 w-4" /> },
      { label: 'Architecture', value: selected.arch, icon: <Code2 className="h-4 w-4" /> },
      { label: 'Stack', value: selected.stack, icon: <Code2 className="h-4 w-4" /> },
      { label: 'Implementation stages', value: selected.stages, icon: <ListFilter className="h-4 w-4" /> },
      { label: 'Testing methodology', value: selected.testing, icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: 'Security considerations', value: selected.security, icon: <ShieldCheck className="h-4 w-4" /> },
      { label: 'Expected outcome', value: selected.outcome, icon: <FolderGit2 className="h-4 w-4" /> },
      { label: 'GitHub portfolio guidelines', value: selected.github, icon: <Github className="h-4 w-4" /> },
    ];
    const isBookmarked = progress.state.bookmarks.includes(refFor(selected.id));

    return (
      <div className="animate-fade-up">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/projects" className="btn-ghost"><ArrowLeft className="h-4 w-4" /> All projects</Link>
          <button className={cn('btn', isBookmarked ? 'bg-mint-500 text-ink-950' : 'btn-ghost')} onClick={() => progress.toggleBookmark(refFor(selected.id))}>
            <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} /> {isBookmarked ? 'In portfolio' : 'Add to portfolio'}
          </button>
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge tone="mint">Project {selected.id.replace('project-', '')}</Badge>
              <Badge tone="cyan">{selected.stack}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">{selected.name}</h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">{selected.problem}</p>

            <div className="mt-8 space-y-3">
              {fields.map((f) => (
                <Panel key={f.label} className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-mint-300">{f.icon}{f.label}</div>
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-slate-300">{f.value}</p>
                </Panel>
              ))}
            </div>

            <Panel className="mt-6 border-amber-500/20 bg-amber-500/[0.04] p-5 text-[13px] leading-relaxed text-amber-100/80">
              <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200"><ShieldCheck className="h-4 w-4" /> Authorized use only</div>
              Build and test this project against your own lab, a local container, or a target with explicit written
              permission. Never use the tooling you write here against third-party systems. Redact any real
              identifiers or credentials before publishing your repository.
            </Panel>
          </article>

          <aside>
            <div className="sticky top-24 space-y-4">
              <Panel className="p-5">
                <div className="label mb-3">Portfolio checklist</div>
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-[13px] leading-snug text-slate-300 hover:text-slate-100">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-mint-500"
                        checked={Boolean(checklist[item.id])}
                        onChange={() => setChecklist((c) => ({ ...c, [item.id]: !c[item.id] }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 border-t border-ink-800 pt-3 text-xs text-muted">{checklistDone} of {checklistItems.length} checks complete</div>
                <ProgressBar className="mt-2" value={pct(checklistDone, checklistItems.length)} />
              </Panel>

              <Panel className="p-5">
                <div className="label mb-3">Portfolio progress</div>
                <div className="stat-num">{bookmarked.length}<span className="ml-2 text-xs font-normal text-muted">/ {list.length} projects</span></div>
                <ProgressBar className="mt-3" value={pct(bookmarked.length, list.length)} tone="cyan" />
                <div className="mt-3 text-xs text-muted">Bookmarked projects</div>
                <div className="mt-2 space-y-1">
                  {bookmarked.slice(0, 6).map((p) => (
                    <Link key={p.id} href={`/projects?p=${p.id}`} className="flex items-center gap-1.5 text-[12px] text-slate-300 hover:text-mint-300">
                      <ChevronRight className="h-3 w-3 text-mint-500" /> {p.name}
                    </Link>
                  ))}
                  {bookmarked.length === 0 && <div className="text-[12px] text-muted">Bookmark projects to build your portfolio shortlist.</div>}
                </div>
              </Panel>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Research / Portfolio Track"
        title="Projects &amp; Portfolio"
        description="Thirty build-it-yourself projects that turn theory into evidence. Each one is designed for a local lab or a target you own, and each ends with a publishable, safety-conscious repository."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={list.length} sub="Complete build briefs" icon={<FolderGit2 className="h-4 w-4" />} />
        <StatCard label="Portfolio shortlist" value={bookmarked.length} sub="Bookmarked projects" icon={<Bookmark className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Repo checklist" value={`${checklistDone}/${checklistItems.length}`} sub="Ready-to-publish checks" icon={<ClipboardCheck className="h-4 w-4" />} tone="slate" />
      </div>

      <Panel className="mb-6 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"><Filter className="h-4 w-4 text-mint-400" /> Filter &amp; sort</div>
        <div className="grid gap-3 md:grid-cols-[1.6fr_1.3fr_1fr]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" />
          <select className="input" value={stack} onChange={(e) => setStack(e.target.value)} aria-label="Filter by stack">
            <option value="all">All stacks</option>
            {stacks.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects">
            <option value="default">Default order</option>
            <option value="name">Name A–Z</option>
            <option value="stack">Stack A–Z</option>
          </select>
        </div>
        <div className="mt-3 text-xs text-muted">{filtered.length} of {list.length} projects shown</div>
      </Panel>

      {error ? (
        <EmptyState title="Could not load projects" description={error} />
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-40 animate-pulse rounded-xl bg-ink-800/60" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No projects match" description="Try a different search term or stack filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/projects?p=${p.id}`} className="panel panel-hover flex h-full flex-col p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge tone="mint">Project {p.id.replace('project-', '')}</Badge>
                {progress.state.bookmarks.includes(refFor(p.id)) && <Badge tone="cyan"><Bookmark className="h-3 w-3 fill-current" /> Saved</Badge>}
              </div>
              <h3 className="text-[15px] font-semibold leading-snug text-slate-100">{p.name}</h3>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">{p.problem}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{p.stack.split(',').map((s) => <span key={s.trim()} className="chip">{s.trim()}</span>)}</div>
              <div className="mt-3 text-xs text-muted"><span className="font-medium text-slate-400">Prereq:</span> {p.prereq}</div>
              <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-mint-400">Open full brief <ChevronRight className="h-3 w-3" /></div>
            </Link>
          ))}
        </div>
      )}

      <Panel className="mt-10 p-5">
        <div className="label mb-2 text-mint-400">Publishing standard</div>
        <h2 className="section-title">Every repository must be safe to share</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Include a README that explains the problem and how to run the project locally, a license, and an explicit
          authorized-use note. Add screenshots or sample output, automated tests where practical, and a short
          write-up of what you learned. Never commit live credentials, real customer data, or payloads aimed at
          systems you do not own.
        </p>
      </Panel>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse py-20 text-center text-muted">Loading projects…</div>}>
      <ProjectsView />
    </Suspense>
  );
}
