'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, CheckCircle2, ExternalLink as ExternalLinkIcon, Info, ShieldAlert, X } from 'lucide-react';
import { useAllData } from '@/lib/data';
import type { CVE } from '@/lib/types';
import { Badge, EmptyState, PageHeader, Panel, SearchInput, SeverityBadge, StatCard } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { cn } from '@/lib/utils';

const ACCURACY_NOTE = 'Verify current details against NVD and the vendor advisory.';

function CveField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-ink-800 py-4 last:border-0">
      <h3 className="label mb-2">{label}</h3>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

function CveDrawer({ cve, onClose }: { cve: CVE; onClose: () => void }) {
  const { state, toggleCVE } = useProgress();
  const reviewed = state.cvesReviewed.includes(cve.cve);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-ink-700 bg-ink-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink-700 bg-ink-900/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="label mb-2 flex items-center gap-2 text-rose-400"><ShieldAlert className="h-3.5 w-3.5" /> Vulnerability record</div>
            <h2 className="font-mono text-xl font-semibold tracking-tight text-slate-50">{cve.cve}</h2>
            <p className="mt-1 text-sm text-slate-300">{cve.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SeverityBadge value={cve.severity} />
              <Badge tone="amber">{cve.cvss}</Badge>
              <Badge>{cve.category}</Badge>
              <Badge tone="cyan">{cve.year}</Badge>
            </div>
          </div>
          <button className="btn-icon shrink-0" onClick={onClose} aria-label="Close vulnerability details"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 pb-10">
          <div className="flex flex-wrap gap-2 border-b border-ink-800 py-5">
            <button className={cn('btn text-xs', reviewed ? 'border border-mint-500/40 bg-mint-500/10 text-mint-300' : 'btn-primary')} onClick={() => toggleCVE(cve.cve)}>
              {reviewed ? <><CheckCircle2 className="h-4 w-4" /> Reviewed</> : <><Check className="h-4 w-4" /> Mark as reviewed</>}
            </button>
            <a className="btn-ghost text-xs" href={cve.nvd} target="_blank" rel="noopener noreferrer">
              authoritative NVD entry <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="flex items-start gap-2 border-b border-ink-800 py-4 text-[12px] leading-relaxed text-amber-200/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{ACCURACY_NOTE} Scores, affected versions and exploitability change as advisories are updated.</span>
          </div>

          <CveField label="Affected software"><span className="font-mono text-[13px] text-mint-200">{cve.software}</span></CveField>
          <CveField label="Root cause"><p>{cve.rootCause}</p></CveField>
          <CveField label="Technical explanation">
            <p>
              Study note derived from this record: <strong className="text-slate-100">{cve.name}</strong> affects {cve.software} and belongs to the
              {' '}{cve.category.toLowerCase()} class. The mechanism is the flaw described in the root cause above —
              the practical question is which attacker-controlled input reaches that mechanism and what trust boundary it crosses.
            </p>
            <p className="mt-2 text-muted">
              Work through the impact and mitigation below, then read the authoritative advisory before repeating any analysis.
            </p>
          </CveField>
          <CveField label="Impact"><p>{cve.impact}</p></CveField>
          <CveField label="Mitigation"><p>{cve.mitigation}</p></CveField>
          <CveField label="Disclosure timeline"><p>{cve.timeline}</p></CveField>
          <CveField label="Resources">
            <ul className="space-y-1.5">
              {cve.resources.map((r) => <li key={r} className="flex items-start gap-2"><BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyanx-400" /> {r}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted">Use these references as search leads and confirm each one at its authoritative publisher.</p>
          </CveField>

          <div className="pt-5">
            <h3 className="label mb-2">Authoritative reference</h3>
            <a href={cve.nvd} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-xs">
              Open {cve.cve} on NVD <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
            <p className="mt-2 break-all font-mono text-[11px] text-muted">{cve.nvd}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VulnerabilitiesContent() {
  const { cves } = useAllData();
  const list = useMemo(() => cves.data ?? [], [cves.data]);
  const { state } = useProgress();
  const router = useRouter();
  const params = useSearchParams();
  const selectedCve = params.get('cve');
  const selected = list.find((c) => c.cve.toLowerCase() === (selectedCve ?? '').toLowerCase()) ?? null;

  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [year, setYear] = useState('all');
  const [category, setCategory] = useState('all');
  const [hideReviewed, setHideReviewed] = useState(false);

  const severities = useMemo(() => Array.from(new Set(list.map((c) => c.severity))).sort(), [list]);
  const years = useMemo(() => Array.from(new Set(list.map((c) => c.year))).sort((a, b) => b - a), [list]);
  const categories = useMemo(() => Array.from(new Set(list.map((c) => c.category))).sort(), [list]);
  const criticalCount = list.filter((c) => c.severity.toLowerCase() === 'critical').length;
  const reviewedCount = list.filter((c) => state.cvesReviewed.includes(c.cve)).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (q && ![c.cve, c.name, c.software, c.category, c.rootCause, c.impact].some((f) => f.toLowerCase().includes(q))) return false;
      if (severity !== 'all' && c.severity !== severity) return false;
      if (year !== 'all' && c.year !== Number(year)) return false;
      if (category !== 'all' && c.category !== category) return false;
      if (hideReviewed && state.cvesReviewed.includes(c.cve)) return false;
      return true;
    });
  }, [list, query, severity, year, category, hideReviewed, state.cvesReviewed]);

  const open = (id: string) => router.replace(`/vulnerabilities?cve=${encodeURIComponent(id)}`, { scroll: false });
  const close = () => router.replace('/vulnerabilities', { scroll: false });

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Research · Real-world vulnerabilities"
        title="Vulnerability Database"
        description="Fifteen landmark, real-world CVEs studied for their root causes, exploitation impact and defensible mitigations. Every record links to its authoritative NVD entry."
        actions={<Badge tone="rose"><ShieldAlert className="h-3.5 w-3.5" /> {list.length || 15} real CVEs</Badge>}
      />

      <Panel className="mb-8 border-amber-500/25 bg-amber-500/[0.05] p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <h2 className="text-sm font-semibold text-amber-200">Accuracy note</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-100/85">{ACCURACY_NOTE} Treat every summary here as a study aid, not a substitute for the original advisory.</p>
          </div>
        </div>
      </Panel>

      <Panel className="mb-8 p-5">
        <h2 className="section-title text-lg">Landmark vulnerabilities</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted">
          A handful of disclosures changed how the industry builds and defends software. Log4Shell showed how a single logging dependency can become an internet-wide remote-code-execution path;
          Heartbleed, Shellshock and similar incidents exposed the cost of trusting input at trust boundaries; browser and deserialization flaws reshaped sandboxing and memory-safety practices.
          Studying these cases teaches you to trace a bug from root cause to impact to mitigation — the same chain you will use when writing a bug bounty report.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Catalogued CVEs" value={list.length || '—'} sub="Real, referenced disclosures" icon={<ShieldAlert className="h-4 w-4" />} />
          <StatCard label="Critical severity" value={criticalCount} sub="Highest-impact cases" tone="cyan" icon={<Info className="h-4 w-4" />} />
          <StatCard label="Years covered" value={years.length ? `${years[years.length - 1]}–${years[0]}` : '—'} sub="Historical to modern" icon={<BookOpen className="h-4 w-4" />} />
          <StatCard label="Reviewed by you" value={reviewedCount} sub="Tracked on this device" tone="cyan" icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>
      </Panel>

      <Panel className="mb-6 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_1fr_auto]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search CVE, name, software, category…" />
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Filter by severity">
            <option value="all">All severities</option>
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by year">
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className={cn('btn-ghost whitespace-nowrap text-xs', hideReviewed && 'border-mint-500/40 bg-mint-500/10 text-mint-300')} onClick={() => setHideReviewed((v) => !v)}>
            {hideReviewed ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />} Unreviewed
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>Showing <span className="font-mono text-mint-300">{filtered.length}</span> of {list.length} records</span>
          {(query || severity !== 'all' || year !== 'all' || category !== 'all' || hideReviewed) && (
            <button className="link text-xs" onClick={() => { setQuery(''); setSeverity('all'); setYear('all'); setCategory('all'); setHideReviewed(false); }}>Clear filters</button>
          )}
        </div>
      </Panel>

      {cves.loading ? (
        <Panel className="p-10 text-center text-sm text-muted">Loading vulnerability records…</Panel>
      ) : cves.error ? (
        <Panel className="p-10 text-center text-sm text-rose-300">{cves.error}</Panel>
      ) : filtered.length === 0 ? (
        <EmptyState title="No vulnerabilities match these filters" description="Try broadening the search or clearing the filters." />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-3 font-semibold">CVE</th>
                <th className="px-4 py-3 font-semibold">Name / software</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">CVSS</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const reviewed = state.cvesReviewed.includes(c.cve);
                return (
                  <tr
                    key={c.cve}
                    onClick={() => open(c.cve)}
                    className="cursor-pointer border-b border-ink-800 transition hover:bg-ink-800/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-mint-300">{c.cve}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{c.name}</div>
                      <div className="mt-0.5 max-w-[280px] truncate text-[11px] text-muted">{c.software}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{c.category}</td>
                    <td className="px-4 py-3"><SeverityBadge value={c.severity} /></td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-muted">{c.cvss}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{c.year}</td>
                    <td className="px-4 py-3">{reviewed ? <Badge tone="mint"><CheckCircle2 className="h-3 w-3" /> Reviewed</Badge> : <Badge>Unreviewed</Badge>}</td>
                    <td className="px-4 py-3 text-right"><ArrowRight className="h-4 w-4 text-ink-600" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}

      <p className="mt-5 text-xs text-muted">
        Every record links to <a className="link" href="https://nvd.nist.gov/" target="_blank" rel="noopener noreferrer">NVD <ExternalLinkIcon className="inline h-3 w-3" /></a> — {ACCURACY_NOTE}
      </p>

      {selected && <CveDrawer cve={selected} onClose={close} />}
    </div>
  );
}

export default function VulnerabilitiesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted">Loading vulnerability database…</div>}>
      <VulnerabilitiesContent />
    </Suspense>
  );
}
