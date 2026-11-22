'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, Check, CheckCircle2, Filter, GraduationCap, Info, Terminal, Wrench, X } from 'lucide-react';
import { useAllData } from '@/lib/data';
import type { Tool } from '@/lib/types';
import { Badge, CopyButton, DifficultyBadge, EmptyState, ExternalLink, PageHeader, Panel, SearchInput, StatCard } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { cn } from '@/lib/utils';

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <section className="border-b border-ink-800 py-4 last:border-0">
      <h3 className="label mb-2">{label}</h3>
      <p className={cn('whitespace-pre-wrap text-sm leading-relaxed text-slate-300', mono && 'font-mono text-[12.5px] leading-6 text-slate-200')}>{value}</p>
    </section>
  );
}

function CommandField({ label, value }: { label: string; value: string }) {
  return (
    <section className="border-b border-ink-800 py-4 last:border-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="label">{label}</h3>
        <CopyButton text={value} />
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-[12.5px] leading-6 text-mint-200">{value}</pre>
    </section>
  );
}

function ToolDrawer({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const { state, setToolMastery, toggleBookmark } = useProgress();
  const mastered = Boolean(state.toolMastery[tool.id]);
  const bookmarked = state.bookmarks.includes(`tool:${tool.id}`);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-ink-700 bg-ink-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink-700 bg-ink-900/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="label mb-2 flex items-center gap-2 text-mint-400"><Wrench className="h-3.5 w-3.5" /> Tool reference</div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">{tool.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="cyan">{tool.category}</Badge>
              <DifficultyBadge value={tool.level} />
            </div>
          </div>
          <button className="btn-icon shrink-0" onClick={onClose} aria-label="Close tool details"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 pb-10">
          <div className="flex flex-wrap gap-2 border-b border-ink-800 py-5">
            <button className={cn('btn text-xs', mastered ? 'border border-mint-500/40 bg-mint-500/10 text-mint-300' : 'btn-primary')} onClick={() => setToolMastery(tool.id, !mastered)}>
              {mastered ? <><CheckCircle2 className="h-4 w-4" /> Mastered</> : <><Check className="h-4 w-4" /> Mark as mastered</>}
            </button>
            <button className="btn-ghost text-xs" onClick={() => toggleBookmark(`tool:${tool.id}`)}>
              <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-mint-400 text-mint-400')} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>

          <div className="border-b border-ink-800 py-4">
            <h3 className="label mb-2">Operating systems</h3>
            <p className="text-sm text-slate-300">{tool.os}</p>
          </div>
          <Field label="Purpose" value={tool.purpose} />
          <Field label="Architecture / how it works" value={tool.arch} />
          <Field label="Installation" value={tool.install} mono />
          <CommandField label="Basic commands" value={tool.cmd} />
          <Field label="Advanced usage" value={tool.advanced} />
          <Field label="Output explained" value={tool.output} />
          <Field label="Example lab exercise" value={tool.example} />
          <Field label="Common mistakes" value={tool.mistakes} />
          <Field label="Limitations" value={tool.limits} />
          <Field label="Alternatives" value={tool.alt} />
          <div className="py-5">
            <h3 className="label mb-2">Documentation</h3>
            <ExternalLink href={tool.docs}>Open official documentation</ExternalLink>
            <p className="mt-2 break-all font-mono text-[11px] text-muted">{tool.docs}</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[12px] leading-relaxed text-amber-200/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Verify commands against the tool&apos;s current official documentation. Behaviour, flags and licensing change between releases.
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolsContent() {
  const { tools } = useAllData();
  const list = useMemo(() => tools.data ?? [], [tools.data]);
  const { state, toggleBookmark } = useProgress();
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get('tool');
  const selected = list.find((t) => t.id === selectedId) ?? null;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [notMastered, setNotMastered] = useState(false);

  const categories = useMemo(() => Array.from(new Set(list.map((t) => t.category))).sort(), [list]);
  const masteredCount = list.filter((t) => state.toolMastery[t.id]).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((t) => {
      if (q && ![t.name, t.purpose, t.cmd, t.alt].some((field) => field.toLowerCase().includes(q))) return false;
      if (category !== 'all' && t.category !== category) return false;
      if (level !== 'all' && !t.level.toLowerCase().includes(level.toLowerCase())) return false;
      if (notMastered && state.toolMastery[t.id]) return false;
      return true;
    });
  }, [list, query, category, level, notMastered, state.toolMastery]);

  const workflow = useMemo(() => ([
    { tier: 'Beginner', title: 'Build the fundamentals', text: 'Start with proxies and traffic viewers you can run in a lab. Learn what a request and response actually contain before touching an automated scanner.', match: 'beginner' },
    { tier: 'Intermediate', title: 'Deepen your workflow', text: 'Add focused vulnerability scanners, fuzzers and analysis utilities. Practise confirming findings by hand rather than trusting tool output.', match: 'intermediate' },
    { tier: 'Advanced', title: 'Research and specialise', text: 'Use reverse engineering, exploitation and cloud/mobile tooling to test hypotheses about how a system really behaves under adversarial input.', match: 'advanced' },
  ]).map((w) => ({ ...w, picks: list.filter((t) => t.level.toLowerCase().includes(w.match)).slice(0, 4) })), [list]);

  const open = (id: string) => router.replace(`/tools?tool=${encodeURIComponent(id)}`, { scroll: false });
  const close = () => router.replace('/tools', { scroll: false });

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Research · Toolbox"
        title="Tools Encyclopedia"
        description="A field guide to the tools used across the academy — what each one is for, how it works, the commands that matter, and the mistakes to avoid."
        actions={<Badge tone="mint"><Wrench className="h-3.5 w-3.5" /> {list.length || 56} tools · {categories.length || 9} categories</Badge>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tools in library" value={list.length || '—'} sub="Across every security domain" icon={<Wrench className="h-4 w-4" />} />
        <StatCard label="Categories" value={categories.length || '—'} sub="From recon to reverse engineering" tone="cyan" icon={<Filter className="h-4 w-4" />} />
        <StatCard label="Marked mastered" value={masteredCount} sub="Tracked on this device" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Still to learn" value={Math.max(0, list.length - masteredCount)} sub="Use the ‘not mastered’ filter" tone="cyan" icon={<GraduationCap className="h-4 w-4" />} />
      </div>

      <Panel className="mb-8 border-mint-500/20 bg-mint-500/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-mint-400" />
          <h2 className="section-title text-lg">Workflow guidance by skill level</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {workflow.map((w) => (
            <div key={w.tier} className="rounded-lg border border-ink-700 bg-ink-900/70 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{w.tier}</h3>
                <DifficultyBadge value={w.tier} />
              </div>
              <p className="text-[12.5px] leading-relaxed text-muted">{w.text}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.picks.map((t) => (
                  <Link key={t.id} href={`/tools?tool=${encodeURIComponent(t.id)}`} className="chip transition hover:border-mint-500/40 hover:text-mint-300">
                    {t.name} <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 border-t border-ink-800 pt-3 text-[12px] text-muted">
          <Info className="h-3.5 w-3.5 shrink-0 text-cyanx-400" />
          Verify commands against the tool&apos;s current official documentation.
        </p>
      </Panel>

      <Panel className="mb-6 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, purpose, commands, alternatives…" />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by skill level">
            <option value="all">All skill levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button className={cn('btn-ghost whitespace-nowrap text-xs', notMastered && 'border-mint-500/40 bg-mint-500/10 text-mint-300')} onClick={() => setNotMastered((v) => !v)}>
            {notMastered ? <Check className="h-4 w-4" /> : <Filter className="h-4 w-4" />} Not mastered
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>Showing <span className="font-mono text-mint-300">{filtered.length}</span> of {list.length} tools</span>
          {(query || category !== 'all' || level !== 'all' || notMastered) && (
            <button className="link text-xs" onClick={() => { setQuery(''); setCategory('all'); setLevel('all'); setNotMastered(false); }}>Clear filters</button>
          )}
        </div>
      </Panel>

      {tools.loading ? (
        <Panel className="p-10 text-center text-sm text-muted">Loading tools…</Panel>
      ) : tools.error ? (
        <Panel className="p-10 text-center text-sm text-rose-300">{tools.error}</Panel>
      ) : filtered.length === 0 ? (
        <EmptyState title="No tools match these filters" description="Try a broader search term or reset the filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tool) => {
            const mastered = Boolean(state.toolMastery[tool.id]);
            const bookmarked = state.bookmarks.includes(`tool:${tool.id}`);
            return (
              <div
                key={tool.id}
                role="button"
                tabIndex={0}
                onClick={() => open(tool.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(tool.id); } }}
                className="group cursor-pointer"
              >
              <Panel hover className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-snug text-slate-100 group-hover:text-mint-300">{tool.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="cyan">{tool.category}</Badge>
                      <DifficultyBadge value={tool.level} />
                    </div>
                  </div>
                  <button
                    className="btn-icon shrink-0"
                    title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(`tool:${tool.id}`); }}
                    aria-label="Bookmark tool"
                  >
                    <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-mint-400 text-mint-400')} />
                  </button>
                </div>
                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted">{tool.purpose}</p>
                <div className="mt-4 flex items-center gap-2 border-t border-ink-800 pt-3 text-[11px] text-muted">
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tool.os}</span>
                  {mastered && <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-mint-400" />}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <span onClick={(e) => e.stopPropagation()}><ExternalLink href={tool.docs}>Docs</ExternalLink></span>
                  <button className="link inline-flex items-center gap-1 text-xs" onClick={(e) => { e.stopPropagation(); open(tool.id); }}>
                    Full reference <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Panel>
              </div>
            );
          })}
        </div>
      )}

      {selected && <ToolDrawer tool={selected} onClose={close} />}
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted">Loading tools…</div>}>
      <ToolsContent />
    </Suspense>
  );
}
