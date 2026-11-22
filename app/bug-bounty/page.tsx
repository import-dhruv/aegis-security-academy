'use client';

import Link from 'next/link';
import { ArrowRight, Award, BookOpen, CheckCircle2, FileCheck2, Globe2, Radar, Scale, Search, Target, Workflow } from 'lucide-react';
import { useData } from '@/lib/data';
import type { Chapter, Tool, Report } from '@/lib/types';
import { Badge, PageHeader, Panel, ProgressBar, SeverityBadge } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { pct } from '@/lib/utils';

const workflow = [
  { n: 1, title: 'Select a program', text: 'Choose a legitimate public program or VDP. Read the platform and program rules before touching an asset.', chapter: 11 },
  { n: 2, title: 'Analyse scope', text: 'List in-scope assets, out-of-scope exclusions, reward tiers and prohibitions. Write down the boundary.', chapter: 13 },
  { n: 3, title: 'Map the attack surface', text: 'Passive-first discovery: DNS, certificates, subdomains, technologies, endpoints and parameters.', chapter: 14 },
  { n: 4, title: 'Test methodically', text: 'Start with the highest-value trust boundaries: authentication, authorization, business logic and input handling.', chapter: 15 },
  { n: 5, title: 'Validate safely', text: 'Use owned accounts and synthetic data. Demonstrate impact without accessing real user data or disrupting service.', chapter: 15 },
  { n: 6, title: 'Write the report', text: 'Precise endpoint, steps, harmless PoC, demonstrated impact, CWE/CVSS reasoning and a clear remediation.', chapter: 25 },
  { n: 7, title: 'Handle triage', text: 'Respond to feedback professionally. Accept duplicates and informatives as part of the process, not as failure.', chapter: 25 },
];

const platforms = [
  { name: 'HackerOne', focus: 'Large marketplace with broad program variety', note: 'Check each program’s own scope and policy; platform rules also apply.', url: 'https://www.hackerone.com/' },
  { name: 'Bugcrowd', focus: 'Crowdsourced programs and VDPs', note: 'Prioritization and triage vary by program.', url: 'https://www.bugcrowd.com/' },
  { name: 'Intigriti', focus: 'European-focused bug bounty platform', note: 'Check program-specific disclosure and reward terms.', url: 'https://www.intigriti.com/' },
  { name: 'YesWeHack', focus: 'European bug bounty and VDP platform', note: 'Program rules govern authorized testing.', url: 'https://www.yeswehack.com/' },
  { name: 'Immunefi', focus: 'Web3 and smart-contract security', note: 'On-chain assets have additional chain-specific rules.', url: 'https://immunefi.com/' },
];

export default function BugBountyPage() {
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { data: tools } = useData<Tool[]>('tools.json');
  const { data: reports } = useData<Report[]>('reports.json');
  const { isMastered, state } = useProgress();
  const bountyChapters = (chapters ?? []).filter((c) => c.schoolIds.includes('advanced-bug-bounty-hunting'));
  const mastered = bountyChapters.filter((c) => isMastered(c.id)).length;
  const reconTools = (tools ?? []).filter((t) => /recon|scan|intercept|web testing|fuzz/i.test(t.category)).slice(0, 10);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Professional practice"
        title="Bug Bounty Academy"
        description="A repeatable professional workflow from program selection to a triage-ready report — built on deep technical understanding, careful scope discipline and responsible conduct."
        actions={<Link href="/simulator" className="btn-primary"><Workflow className="h-4 w-4" /> Open workflow simulator</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5"><div className="label">Bounty track progress</div><div className="stat-num mt-2">{pct(mastered, bountyChapters.length)}%</div><ProgressBar className="mt-3" value={pct(mastered, bountyChapters.length)} /><div className="mt-2 text-xs text-muted">{mastered}/{bountyChapters.length} chapters mastered</div></Panel>
        <Panel className="p-5"><div className="label">Program types</div><div className="stat-num mt-2">5</div><div className="mt-3 text-xs text-muted">Public platforms and VDPs covered</div></Panel>
        <Panel className="p-5"><div className="label">Report templates</div><div className="stat-num mt-2">{reports?.length ?? 20}</div><div className="mt-3 text-xs text-muted">Synthetic training scenarios</div></Panel>
        <Panel className="p-5"><div className="label">Workflow stages</div><div className="stat-num mt-2">12</div><div className="mt-3 text-xs text-muted">Practised in the simulator</div></Panel>
      </div>

      <section className="mt-12">
        <div className="label mb-4 text-mint-400">The seven-stage field workflow</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {workflow.map((w) => (
            <Panel key={w.n} hover className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-2xl font-semibold text-mint-500/40">{String(w.n).padStart(2, '0')}</span>
                <Link href={`/learn/chapter-${String(w.chapter).padStart(2, '0')}`} className="text-[11px] text-cyanx-300 hover:underline">Chapter {w.chapter} →</Link>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{w.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{w.text}</p>
            </Panel>
          ))}
          <Link href="/simulator" className="panel panel-hover flex flex-col justify-center gap-2 border-mint-500/25 bg-mint-500/[0.04] p-5">
            <Workflow className="h-5 w-5 text-mint-400" />
            <div className="text-sm font-semibold text-mint-300">Practise all 12 stages</div>
            <p className="text-[13px] text-muted">Run a mock engagement with synthetic programs and a triage-scored report.</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-mint-400">Start simulation <ArrowRight className="h-3 w-3" /></span>
          </Link>
        </div>
      </section>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <Panel className="p-6">
          <div className="mb-4 flex items-center gap-2"><Globe2 className="h-5 w-5 text-mint-400" /><div className="section-title">Platforms & disclosure models</div></div>
          <div className="space-y-3">
            {platforms.map((p) => (
              <div key={p.name} className="rounded-lg border border-ink-700 bg-ink-900/60 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-100">{p.name}</span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-mint-400 hover:underline">Official site ↗</a>
                </div>
                <p className="mt-1 text-[13px] text-muted">{p.focus}</p>
                <p className="mt-1.5 text-[11px] text-muted/80">{p.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3.5 text-[12px] leading-relaxed text-amber-200/80">
            <Scale className="mr-1.5 inline h-3.5 w-3.5" /> Programs, policies and reward amounts change. Always read the current program page and rules of engagement. A public URL is not permission.
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-cyanx-300" /><div className="section-title">Bounty curriculum</div></div>
            <div className="space-y-2">
              {bountyChapters.map((c) => (
                <Link key={c.id} href={`/learn/${c.slug}`} className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900/60 px-3.5 py-2.5 text-xs transition hover:border-mint-500/30">
                  <span className="text-slate-300"><span className="mr-2 font-mono text-mint-500/70">{String(c.number).padStart(2, '0')}</span>{c.title}</span>
                  {isMastered(c.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-400" /> : <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />}
                </Link>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-2"><Radar className="h-5 w-5 text-mint-400" /><div className="section-title">Recon toolkit</div></div>
            <div className="flex flex-wrap gap-1.5">
              {reconTools.map((t) => <Link key={t.id} href={`/tools?tool=${t.id}`} className="chip hover:border-mint-500/40 hover:text-mint-300">{t.name}</Link>)}
            </div>
            <Link href="/tools" className="mt-4 inline-flex items-center gap-1.5 text-xs text-mint-400 hover:underline">Full 56-tool encyclopedia <ArrowRight className="h-3 w-3" /></Link>
          </Panel>
        </div>
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="label text-mint-400">Report craft</div>
            <h2 className="section-title mt-2">Learn from structured report examples</h2>
            <p className="mt-2 text-sm text-muted">These 20 case studies are synthetic training scenarios authored to teach report structure — not real disclosures.</p>
          </div>
          <Link href="/case-studies" className="btn-ghost">Open library <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(reports ?? []).slice(0, 6).map((r) => (
            <Link key={r.id} href={`/case-studies?case=${r.id}`} className="panel panel-hover p-4">
              <div className="flex items-start justify-between gap-3"><SeverityBadge value={r.severity} /><span className="font-mono text-[10px] text-muted">{r.cwe}</span></div>
              <h3 className="mt-3 text-[13px] font-semibold leading-snug text-slate-100">{r.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs text-muted">{r.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-4 rounded-xl border border-ink-700 bg-ink-900/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-mint-400" />
          <div>
            <div className="text-sm font-semibold text-slate-100">Report writing is a security skill</div>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">A finding that cannot be reproduced and understood by a triager has no value. Practice CVSS/CWE reasoning, minimal PoCs and impact framing in Chapter 25 and the simulator.</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/learn/chapter-25" className="btn-ghost"><FileCheck2 className="h-4 w-4" /> Chapter 25</Link>
          <Link href="/ethics" className="btn-ghost border-amber-500/25 text-amber-200"><Scale className="h-4 w-4" /> Rules</Link>
        </div>
      </div>
    </div>
  );
}
