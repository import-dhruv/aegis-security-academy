'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Clock, ExternalLink, Layers3, Quote, Scale, Sparkles } from 'lucide-react';
import { useData } from '@/lib/data';
import type { Module } from '@/lib/types';
import { Badge, PageHeader, Panel } from '@/components/ui';

const sources = [
  { label: 'PortSwigger community — finding your first bug', url: 'https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community', note: 'Focus on one bug class, read RFCs, automate recon, hunt dusty corners.' },
  { label: 'HackerOne — Bug Bounty Reports: How Do They Work?', url: 'https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work', note: 'Reproduction steps, exploitability, impact — and knowing your program audience.' },
  { label: 'Snyk — 7 tips to become a successful bug bounty hunter', url: 'https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e', note: 'Start with a VDP, find your niche, stay consistent, automate boring tasks, take breaks.' },
  { label: 'NahamSec — Breaking Free from Duplicate Submissions', url: 'https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop', note: 'Become a product power user and a vulnerability expert — not a payload collector.' },
  { label: 'Intigriti — 7 Tips for bug bounty beginners', url: 'https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners', note: 'Consistency, target loyalty, controllable goals, submit promptly, match skills to targets.' },
  { label: 'Bugcrowd — The Three Principles of Bug Bounty Duplicates', url: 'https://www.bugcrowd.com/blog/the-three-principles-of-bug-bounty-duplicates/', note: 'Touch the code / pay the bug · similar ≠ same · many ≠ systemic.' },
  { label: 'HackerOne triage analyst — the view from the other side', url: 'https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage', note: 'How triage really works, CVSS rationale, textual links, update cadence and mediation.' },
  { label: 'OWASP Mobile Application Security Testing Guide', url: 'https://mas.owasp.org/MASTG/', note: 'The open standard for mobile security verification and testing.' },
];

export default function FieldGuidePage() {
  const { data: modules, loading } = useData<Module[]>('modules/field-guide.json');

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practical field guide · 50 modules"
        title="How to Actually Do Bug Bounty"
        description="An evidence-based, practitioner-sourced field guide to running a real bug bounty practice — from choosing a program and reading scope, through recon and manual testing, to reports, triage, duplicates and a sustainable career."
        actions={<Link href="/simulator" className="btn-primary"><Sparkles className="h-4 w-4" /> Practise the workflow</Link>}
      />

      <Panel className="mb-6 border-mint-500/20 bg-mint-500/[0.03] p-6">
        <div className="mb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-mint-400" /><div className="label">Authorized use only</div></div>
        <p className="max-w-4xl text-[13px] leading-relaxed text-slate-300">
          Every technique in this guide is taught for systems you own, isolated labs, or programs where you have explicit written authorization. Respect scope, minimize data access, never touch real user records, and follow each program&apos;s rules and disclosure policy.
        </p>
      </Panel>

      <Panel className="mb-8 p-6">
        <div className="mb-4 flex items-center gap-2"><Quote className="h-4 w-4 text-cyanx-300" /><div className="label">Built on practitioner advice from the web</div></div>
        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-ink-700 bg-ink-900/60 p-4 transition hover:border-mint-500/30">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-slate-100">{s.label}</h3>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{s.note}</p>
            </a>
          ))}
        </div>
      </Panel>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="label text-mint-400">50-module curriculum · zero to independent researcher</div>
        <Badge tone="cyan"><BookOpenCheck className="h-3 w-3" /> Cited throughout</Badge>
      </div>

      {loading || !modules ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-28 animate-pulse rounded-xl border border-ink-800 bg-ink-900/40" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link key={m.id} href={`/modules/field-guide/${m.number}`} className="panel panel-hover group flex flex-col p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-mint-500/70">MODULE {String(m.number).padStart(2, '0')}</span>
                <span className="text-[10px] text-muted"><Clock className="mr-1 inline h-3 w-3" />{m.minutes}m</span>
              </div>
              <h3 className="text-[13px] font-semibold leading-snug text-slate-100">{m.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted">{m.summary}</p>
              <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-3">
                <span className="text-[10px] text-muted">{m.level}</span>
                <ArrowRight className="h-3.5 w-3.5 text-mint-400 opacity-0 transition group-hover:opacity-100" />
              </div>
              {m.sources.length > 0 && <div className="mt-2 flex items-center gap-1 text-[10px] text-cyanx-300/70"><Layers3 className="h-3 w-3" /> {m.sources.length} practitioner source{m.sources.length > 1 ? 's' : ''}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
