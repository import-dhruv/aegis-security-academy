'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink, FileText, Quote, ShieldCheck, ThumbsUp, UserRound } from 'lucide-react';
import { useData } from '@/lib/data';
import type { RealCase } from '@/lib/types';
import { Badge, Panel } from '@/components/ui';
import { Markdown } from '@/components/markdown';

export default function RealCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: cases, loading } = useData<RealCase[]>('case-studies-real.json');

  if (loading || !cases) {
    return <div className="space-y-4 py-10">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-ink-800" style={{ width: `${90 - n * 8}%` }} />)}</div>;
  }

  const index = cases.findIndex((c) => c.id === params.id);
  if (index < 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">Case study not found</h1>
        <Link href="/real-cases" className="btn-primary mt-6">Browse all cases</Link>
      </div>
    );
  }

  const item = cases[index];
  const prev = cases[index - 1];
  const next = cases[index + 1];

  return (
    <div className="animate-fade-up">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/real-cases" className="hover:text-mint-400">Real case studies</Link>
        <span>/</span>
        <span className="font-mono text-slate-300">report #{item.reportId}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <div className="mb-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="mint">Real public disclosure</Badge>
              <Badge tone="cyan">{item.program}</Badge>
              <Badge>{item.weakness}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{item.title}</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Originally reported to <span className="text-slate-300">{item.program}</span> and publicly disclosed on {item.disclosedAt || 'a public disclosure date'}. The write-up below is the researcher&apos;s original account.
            </p>
          </div>

          <Panel className="mb-6 border-cyanx-500/20 bg-cyanx-500/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-cyanx-300" />
              <div>
                <div className="label mb-1">Original researcher write-up</div>
                <p className="text-[12px] leading-relaxed text-slate-300">
                  This is a real, publicly disclosed report. Formatting has been cleaned only; redactions in the public record appear as <code>[redacted]</code>. Study how the researcher reasoned about the target — and only test systems you own or are explicitly authorized to assess.
                </p>
              </div>
            </div>
          </Panel>

          <Markdown content={item.detail} />

          <div className="mt-12 grid gap-3 border-t border-ink-800 pt-7 sm:grid-cols-2">
            {prev ? (
              <Link href={`/real-cases/${prev.id}`} className="panel panel-hover flex items-center gap-3 p-4">
                <ArrowLeft className="h-4 w-4 text-mint-400" />
                <div><div className="label">Previous case</div><div className="text-sm font-medium text-slate-200">{prev.title}</div></div>
              </Link>
            ) : <div />}
            {next && (
              <Link href={`/real-cases/${next.id}`} className="panel panel-hover flex items-center justify-end gap-3 p-4 text-right">
                <div><div className="label">Next case</div><div className="text-sm font-medium text-slate-200">{next.title}</div></div>
                <ArrowRight className="h-4 w-4 text-mint-400" />
              </Link>
            )}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Panel className="p-4">
              <div className="label mb-3">Case metadata</div>
              <dl className="space-y-3 text-[12px]">
                <div><dt className="text-muted">Report ID</dt><dd className="font-mono text-slate-200">#{item.reportId}</dd></div>
                <div><dt className="text-muted">Program</dt><dd className="text-slate-200">{item.program}</dd></div>
                <div><dt className="text-muted">Weakness class</dt><dd className="text-slate-200">{item.weakness}</dd></div>
                {item.reporter && <div><dt className="text-muted">Reporter</dt><dd className="font-mono text-slate-200">{item.reporter}</dd></div>}
                <div><dt className="text-muted">Reported</dt><dd className="text-slate-200">{item.createdAt || '—'}</dd></div>
                <div><dt className="text-muted">Disclosed</dt><dd className="text-slate-200">{item.disclosedAt || '—'}</dd></div>
                <div><dt className="text-muted">Write-up length</dt><dd className="text-slate-200">{item.words.toLocaleString()} words</dd></div>
              </dl>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-mint-400" /><div className="label">Community signal</div></div>
              <div className="stat-num">{item.votes}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Upvotes on the public disclosure — a rough signal of how instructive peers found it.</p>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-300" /><div className="label">Authorized use only</div></div>
              <p className="text-[11px] leading-relaxed text-slate-300">Read for learning. Never reproduce these tests against systems you do not own or have written authorization to assess.</p>
            </Panel>

            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full justify-center">
              <ExternalLink className="h-4 w-4" /> View original disclosure
            </a>
            <Link href="/real-cases" className="btn-ghost w-full justify-center"><FileText className="h-4 w-4" /> All 500 cases</Link>
            <div className="flex items-center gap-2 px-1 text-[10px] text-muted"><UserRound className="h-3 w-3" /> {item.source}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
