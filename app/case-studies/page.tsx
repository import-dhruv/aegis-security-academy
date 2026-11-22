'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, FileSearch, Info, Lightbulb, ShieldAlert, X } from 'lucide-react';
import { useAllData } from '@/lib/data';
import type { Report } from '@/lib/types';
import { Badge, EmptyState, PageHeader, Panel, SearchInput, SeverityBadge, StatCard } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { cn } from '@/lib/utils';

function ReportField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <section className="border-b border-ink-800 py-4 last:border-0">
      <h3 className="label mb-2">{label}</h3>
      <p className={cn('whitespace-pre-wrap text-sm leading-relaxed text-slate-300', mono && 'font-mono text-[12.5px] leading-6 text-mint-200')}>{value}</p>
    </section>
  );
}

function ReportDrawer({ report, onClose }: { report: Report; onClose: () => void }) {
  const { state, toggleBookmark } = useProgress();
  const bookmarked = state.bookmarks.includes(`case:${report.id}`);

  const lessons = [
    { title: 'Name the vulnerability class', text: `${report.cls} maps to ${report.cwe}. Recognising the class tells you which check — authorisation, validation, encoding or session handling — to probe next.` },
    { title: 'Set up the precondition first', text: `A reliable report states what access is required: ${report.precond}` },
    { title: 'Reduce the discovery to reproducible steps', text: 'Turn observation into a numbered sequence another researcher can follow exactly; that is what the discovery steps above demonstrate.' },
    { title: 'Explain impact in terms of the asset', text: `For ${report.asset}: ${report.impact}` },
    { title: 'Propose a concrete fix', text: `Remediation should be actionable: ${report.remediation}` },
    { title: 'Read the triage note critically', text: `${report.triage} Good triage reasoning separates a valid, in-scope finding from noise.` },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-ink-700 bg-ink-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink-700 bg-ink-900/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="label mb-2 flex items-center gap-2 text-cyanx-300"><FileSearch className="h-3.5 w-3.5" /> Training case study</div>
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-slate-50">{report.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <SeverityBadge value={report.severity} />
              <Badge tone="amber">{report.cls}</Badge>
              <Badge>{report.cwe}</Badge>
            </div>
          </div>
          <button className="btn-icon shrink-0" onClick={onClose} aria-label="Close case study"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 pb-10">
          <div className="flex flex-wrap gap-2 border-b border-ink-800 py-5">
            <button className={cn('btn-ghost text-xs', bookmarked && 'border-mint-500/40 bg-mint-500/10 text-mint-300')} onClick={() => toggleBookmark(`case:${report.id}`)}>
              <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-mint-400 text-mint-400')} /> {bookmarked ? 'Bookmarked' : 'Bookmark this case'}
            </button>
            <Badge tone="cyan">Asset: {report.asset}</Badge>
            <Badge>{report.cvss}</Badge>
          </div>

          <div className="flex items-start gap-3 border-y border-amber-500/25 bg-amber-500/[0.05] px-3 py-3 text-[12px] leading-relaxed text-amber-200/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <strong className="block text-amber-200">{report.kind}</strong>
              {report.disclaimer}
            </div>
          </div>

          <ReportField label="Initial observation / summary" value={report.summary} />
          <ReportField label="Preconditions" value={report.precond} />
          <ReportField label="Discovery steps" value={report.steps} />
          <ReportField label="Proof of concept" value={report.poc} mono />
          <ReportField label="Impact" value={report.impact} />

          <section className="border-b border-ink-800 py-4">
            <h3 className="label mb-3">Report structure</h3>
            <ol className="space-y-2 text-sm text-slate-300">
              {[
                ['Title', report.title],
                ['Class / CWE', `${report.cls} · ${report.cwe}`],
                ['Summary', report.summary],
                ['Preconditions', report.precond],
                ['Steps to reproduce', report.steps],
                ['Proof of concept', report.poc],
                ['Impact', report.impact],
                ['Remediation', report.remediation],
                ['Triage note', report.triage],
              ].map(([k, v], i) => (
                <li key={k} className="flex gap-3 rounded-lg border border-ink-800 bg-ink-850/60 p-3">
                  <span className="font-mono text-[11px] text-mint-400">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{k}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-300">{v}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <ReportField label="Remediation" value={report.remediation} />
          <ReportField label="Triage note" value={report.triage} />

          <section className="py-5">
            <h3 className="label mb-3 flex items-center gap-2 text-mint-400"><Lightbulb className="h-3.5 w-3.5" /> Lessons for a beginner</h3>
            <ol className="space-y-2.5">
              {lessons.map((l, i) => (
                <li key={l.title} className="flex gap-3 rounded-lg border border-ink-800 bg-ink-850/60 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-mint-500/30 bg-mint-500/10 font-mono text-[11px] text-mint-300">{i + 1}</span>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-100">{l.title}</div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{l.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="rounded-lg border border-cyanx-500/20 bg-cyanx-500/[0.05] p-3 text-[12px] leading-relaxed text-cyanx-200/90">
            Want real, sourced research instead? Read the <Link href="/research" className="link">Research &amp; Academic Library</Link> and follow the original sources listed there.
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseStudiesContent() {
  const { reports } = useAllData();
  const list = useMemo(() => reports.data ?? [], [reports.data]);
  const { state, toggleBookmark } = useProgress();
  const router = useRouter();
  const params = useSearchParams();
  const caseId = params.get('case');
  const selected = list.find((r) => r.id === caseId) ?? null;

  const [query, setQuery] = useState('');
  const [cls, setCls] = useState('all');
  const [severity, setSeverity] = useState('all');

  const classes = useMemo(() => Array.from(new Set(list.map((r) => r.cls))).sort(), [list]);
  const severities = useMemo(() => Array.from(new Set(list.map((r) => r.severity))).sort(), [list]);
  const bookmarkedCount = list.filter((r) => state.bookmarks.includes(`case:${r.id}`)).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (q && ![r.title, r.cls, r.asset, r.cwe, r.summary].some((f) => f.toLowerCase().includes(q))) return false;
      if (cls !== 'all' && r.cls !== cls) return false;
      if (severity !== 'all' && r.severity !== severity) return false;
      return true;
    });
  }, [list, query, cls, severity]);

  const open = (id: string) => router.replace(`/case-studies?case=${encodeURIComponent(id)}`, { scroll: false });
  const close = () => router.replace('/case-studies', { scroll: false });

  return (
    <div className="animate-fade-up">
      <div className="mb-7 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-5 py-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-[13px] leading-relaxed text-amber-100/90">
            <strong className="text-amber-200">Synthetic training scenarios — these are authored examples for learning report structure, not real disclosures. For real research read the Research Papers section and the original sources there.</strong>
          </p>
        </div>
        <Link href="/research" className="link ml-7 mt-2 inline-flex items-center gap-1 text-xs">Browse the research library <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <PageHeader
        eyebrow="Practice · Report writing"
        title="Bug Bounty Case Study Library"
        description="Twenty worked examples that model how a finding is observed, reproduced, written up and triaged. Use them as templates for your own lab reports."
        actions={<Badge tone="amber"><FileSearch className="h-3.5 w-3.5" /> {list.length || 20} synthetic cases</Badge>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Training reports" value={list.length || '—'} sub="Authored learning scenarios" icon={<FileSearch className="h-4 w-4" />} />
        <StatCard label="Vulnerability classes" value={classes.length || '—'} sub="Across the OWASP canon" tone="cyan" icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="Bookmarked" value={bookmarkedCount} sub="Saved on this device" icon={<Bookmark className="h-4 w-4" />} />
        <StatCard label="Highest severity" value="Critical" sub="Synthetic examples only" tone="cyan" icon={<Info className="h-4 w-4" />} />
      </div>

      <Panel className="mb-6 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_1.4fr_1fr]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, class, CWE, asset…" />
          <select className="input" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Filter by class">
            <option value="all">All vulnerability classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Filter by severity">
            <option value="all">All severities</option>
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>Showing <span className="font-mono text-mint-300">{filtered.length}</span> of {list.length} training reports</span>
          {(query || cls !== 'all' || severity !== 'all') && (
            <button className="link text-xs" onClick={() => { setQuery(''); setCls('all'); setSeverity('all'); }}>Clear filters</button>
          )}
        </div>
      </Panel>

      {reports.loading ? (
        <Panel className="p-10 text-center text-sm text-muted">Loading case studies…</Panel>
      ) : reports.error ? (
        <Panel className="p-10 text-center text-sm text-rose-300">{reports.error}</Panel>
      ) : filtered.length === 0 ? (
        <EmptyState title="No case studies match these filters" description="Try another vulnerability class or clear the filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const bookmarked = state.bookmarks.includes(`case:${r.id}`);
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => open(r.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(r.id); } }}
                className="group cursor-pointer"
              >
                <Panel hover className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold leading-snug text-slate-100 group-hover:text-mint-300">{r.title}</h3>
                    <button
                      className="btn-icon shrink-0"
                      title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      aria-label="Bookmark case study"
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(`case:${r.id}`); }}
                    >
                      <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-mint-400 text-mint-400')} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <SeverityBadge value={r.severity} />
                    <Badge tone="cyan">{r.cls}</Badge>
                    <Badge>{r.cwe}</Badge>
                    <Badge tone="amber">Synthetic example</Badge>
                  </div>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted">{r.summary}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink-800 pt-3 text-[11px] text-muted">
                    <span className="truncate font-mono">{r.asset}</span>
                    <button className="link inline-flex shrink-0 items-center gap-1 text-xs" onClick={(e) => { e.stopPropagation(); open(r.id); }}>
                      Read case <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Panel>
              </div>
            );
          })}
        </div>
      )}

      {selected && <ReportDrawer report={selected} onClose={close} />}
    </div>
  );
}

export default function CaseStudiesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted">Loading case studies…</div>}>
      <CaseStudiesContent />
    </Suspense>
  );
}
