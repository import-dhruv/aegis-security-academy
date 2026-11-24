'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, Calendar, ExternalLink, FileSearch, Filter, Quote, Search, ShieldCheck, ThumbsUp } from 'lucide-react';
import { useData } from '@/lib/data';
import type { RealCase } from '@/lib/types';
import { Badge, PageHeader, Panel, SearchInput } from '@/components/ui';

const PAGE_SIZE = 24;

export default function RealCasesPage() {
  const { data: cases, loading } = useData<RealCase[]>('case-studies-real.json');
  const [q, setQ] = useState('');
  const [weakness, setWeakness] = useState('All');
  const [program, setProgram] = useState('All');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const weaknesses = useMemo(() => {
    const counts = new Map<string, number>();
    (cases ?? []).forEach((c) => counts.set(c.weakness, (counts.get(c.weakness) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([name]) => name);
  }, [cases]);

  const programs = useMemo(() => {
    const counts = new Map<string, number>();
    (cases ?? []).forEach((c) => counts.set(c.program, (counts.get(c.program) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name]) => name);
  }, [cases]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (cases ?? []).filter((c) => {
      if (weakness !== 'All' && c.weakness !== weakness) return false;
      if (program !== 'All' && c.program !== program) return false;
      if (!needle) return true;
      return `${c.title} ${c.program} ${c.weakness} ${c.detail}`.toLowerCase().includes(needle);
    });
  }, [cases, q, weakness, program]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Research library · 500 real disclosures"
        title="Real Bug Bounty Case Studies"
        description="Five hundred real, publicly disclosed HackerOne reports with the researcher's original write-up, structured metadata and a link to the source disclosure. No synthetic examples — these are actual findings."
        actions={<Link href="/case-studies" className="btn-ghost"><FileSearch className="h-4 w-4" /> Synthetic report examples</Link>}
      />

      <Panel className="mb-6 border-cyanx-500/20 bg-cyanx-500/[0.03] p-6">
        <div className="mb-3 flex items-center gap-2"><Quote className="h-4 w-4 text-cyanx-300" /><div className="label">Provenance & attribution</div></div>
        <p className="max-w-4xl text-[13px] leading-relaxed text-slate-300">
          Sourced from the public <a className="link" href="https://huggingface.co/datasets/Hacker0x01/hackerone_disclosed_reports" target="_blank" rel="noopener noreferrer">HackerOne Disclosed Reports dataset</a> released by HackerOne. Every case links to its original public disclosure. Write-ups are the researchers&apos; own words, lightly cleaned for formatting; redactions present in the public record are preserved as <code>[redacted]</code>. Study the reasoning and methodology — never test against these or any other systems without authorization.
        </p>
      </Panel>

      {loading || !cases ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-36 animate-pulse rounded-xl border border-ink-800 bg-ink-900/40" />)}</div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Panel className="p-4"><div className="label">Case studies</div><div className="stat-num mt-2">{cases.length}</div><div className="mt-1 text-[11px] text-muted">real public disclosures</div></Panel>
            <Panel className="p-4"><div className="label">Words of original write-ups</div><div className="stat-num mt-2">{Math.round(cases.reduce((s, c) => s + c.words, 0) / 1000)}k</div><div className="mt-1 text-[11px] text-muted">first-hand researcher detail</div></Panel>
            <Panel className="p-4"><div className="label">Programs</div><div className="stat-num mt-2">{programs.length}</div><div className="mt-1 text-[11px] text-muted">distinct bounty programs</div></Panel>
            <Panel className="p-4"><div className="label">Weakness classes</div><div className="stat-num mt-2">{weaknesses.length}+</div><div className="mt-1 text-[11px] text-muted">across the disclosure set</div></Panel>
          </div>

          <div className="panel mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <SearchInput value={q} onChange={(v) => { setQ(v); setVisible(PAGE_SIZE); }} placeholder="Search titles, programs, write-ups…" className="lg:max-w-sm" />
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 shrink-0 text-muted" />
              <select className="input max-w-xs" value={weakness} onChange={(e) => { setWeakness(e.target.value); setVisible(PAGE_SIZE); }} aria-label="Filter by weakness">
                <option value="All">All weakness classes</option>
                {weaknesses.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <select className="input max-w-xs" value={program} onChange={(e) => { setProgram(e.target.value); setVisible(PAGE_SIZE); }} aria-label="Filter by program">
                <option value="All">All programs</option>
                {programs.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <span className="ml-auto text-xs text-muted">{filtered.length} matching case{filtered.length === 1 ? '' : 's'}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <Link key={c.id} href={`/real-cases/${c.id}`} className="panel panel-hover group flex min-h-[168px] flex-col p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-muted">#{c.reportId}</span>
                  <span className="text-[10px] text-muted">{c.disclosedAt || '—'}</span>
                </div>
                <h3 className="text-[14px] font-semibold leading-snug text-slate-100 group-hover:text-mint-200">{c.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="cyan">{c.program}</Badge>
                  <Badge>{c.weakness}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted">{c.detail.slice(0, 220)}…</p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-800 pt-3 text-[11px] text-muted">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{c.votes}</span>
                    <span className="flex items-center gap-1"><BookOpenCheck className="h-3 w-3" />{c.words}w</span>
                    <span className="hidden items-center gap-1 sm:flex"><Calendar className="h-3 w-3" />{c.createdAt || '—'}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-mint-400 opacity-0 transition group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-7 text-center">
              <button className="btn-primary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load 24 more cases</button>
            </div>
          )}

          {filtered.length === 0 && (
            <Panel className="p-10 text-center"><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-ink-600" /><h3 className="text-base font-semibold text-slate-200">No cases match those filters</h3><p className="mt-2 text-sm text-muted">Try a different keyword, weakness class or program.</p></Panel>
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
            <ExternalLink className="h-3.5 w-3.5" /> Each case links to its original public HackerOne disclosure.
          </div>
        </>
      )}
    </div>
  );
}
