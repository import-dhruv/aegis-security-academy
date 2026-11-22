'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BookOpenText, CheckCircle2, ClipboardCheck, FileQuestion,
  GitBranch, ListChecks, ShieldCheck, Sparkles, Target,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { Chapter, Question } from '@/lib/types';
import { Badge, EmptyState, PageHeader, Panel, ProgressBar, SearchInput, StatCard } from '@/components/ui';
import { MASTERY_SCORE, useProgress } from '@/components/providers';
import { cn } from '@/lib/utils';

type Domain = 'Foundational' | 'Web' | 'Network' | 'Advanced' | 'Cloud' | 'AI';
const DOMAINS: Domain[] = ['Foundational', 'Web', 'Network', 'Advanced', 'Cloud', 'AI'];

/** Chapter tags → domain, used only for an approximate per-domain best score. */
function tagDomain(tag: string): Domain | null {
  const t = tag.toLowerCase();
  if (/\b(llm|prompt|ai\b|machine learning|neural|embedding|rag\b|model|gpt)/.test(t)) return 'AI';
  if (/\b(aws|azure|gcp|iam|s3\b|bucket|kubernetes|docker|container|metadata|cloud|serverless)/.test(t)) return 'Cloud';
  if (/\b(exploit|buffer|heap|stack|shellcode|reverse|malware|binary|fuzz|rop\b|race|memory)/.test(t)) return 'Advanced';
  if (/\b(sql|xss|csrf|ssrf|http|browser|cookie|dom\b|owasp|api|jwt|session|web|injection|oauth)/.test(t)) return 'Web';
  if (/\b(tcp|udp|ip\b|dns|tls|ssl|port|packet|router|subnet|network|wifi|arp\b|proxy)/.test(t)) return 'Network';
  if (/\b(crypto|cryptography|hash|encryption|cipher|risk|ethics|cia|fundamental|compliance|identity)/.test(t)) return 'Foundational';
  return null;
}

function statusFor(score?: number): { label: string; tone: 'default' | 'mint' | 'amber' } {
  if (score === undefined) return { label: 'Not started', tone: 'default' };
  if (score >= MASTERY_SCORE) return { label: 'Mastered', tone: 'mint' };
  return { label: 'In progress', tone: 'amber' };
}

const toneClass: Record<Domain, string> = {
  Foundational: 'text-mint-300 border-mint-500/25 bg-mint-500/5',
  Web: 'text-cyanx-300 border-cyanx-500/25 bg-cyanx-500/5',
  Network: 'text-sky-300 border-sky-500/25 bg-sky-500/5',
  Advanced: 'text-rose-300 border-rose-500/25 bg-rose-500/5',
  Cloud: 'text-amber-300 border-amber-500/25 bg-amber-500/5',
  AI: 'text-violet-300 border-violet-500/25 bg-violet-500/5',
};

export default function AssessmentsPage() {
  const { data: questions } = useData<Question[]>('questions.json');
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const progress = useProgress();
  const [chapterQuery, setChapterQuery] = useState('');

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (questions ?? []).forEach((q) => { counts[q.domain] = (counts[q.domain] ?? 0) + 1; });
    return counts;
  }, [questions]);

  // Approximate: a chapter's quiz score is attributed to domains inferred from its tags.
  const domainBest = useMemo(() => {
    const best: Record<string, number> = {};
    (chapters ?? []).forEach((c) => {
      const score = progress.state.quizScores[c.id];
      if (score === undefined) return;
      const domains = new Set<Domain>();
      c.tags.forEach((tag) => { const d = tagDomain(tag); if (d) domains.add(d); });
      domains.forEach((d) => { best[d] = Math.max(best[d] ?? 0, score); });
    });
    return best;
  }, [chapters, progress.state.quizScores]);

  const filteredChapters = useMemo(() => {
    const q = chapterQuery.trim().toLowerCase();
    if (!q) return chapters ?? [];
    return (chapters ?? []).filter((c) => `${c.title} ${c.tags.join(' ')} ${c.part}`.toLowerCase().includes(q));
  }, [chapters, chapterQuery]);

  const cards = [
    {
      title: 'Master Question Bank',
      value: questions?.length ?? '1,000',
      sub: `${DOMAINS.length} domains · searchable & bookmarkable`,
      desc: 'Browse every question, reveal the reasoning, and run a self-graded quiz on any page.',
      href: '/assessments/bank',
      icon: BookOpenText,
      cta: 'Open bank',
    },
    {
      title: 'Chapter mastery quizzes',
      value: chapters?.length ?? '36',
      sub: `Demonstrate ${MASTERY_SCORE}% to master a chapter`,
      desc: 'Each chapter page has a short quiz drawn from the bank using its tags. Best score is kept.',
      href: '/schools',
      icon: ListChecks,
      cta: 'Browse chapters',
    },
    {
      title: 'Scenario assessments',
      value: '8',
      sub: 'Reasoning over recognition',
      desc: 'Scope, blind SQLi, session fixation, SSRF, triage, OAuth, prompt injection and race conditions.',
      href: '/assessments/scenarios',
      icon: FileQuestion,
      cta: 'Start scenarios',
    },
    {
      title: 'Flashcard reviews',
      value: progress.stats.dueCards,
      sub: `${progress.stats.quizzesTaken} quizzes taken`,
      desc: 'Keep recall fresh with spaced repetition before you attempt mastery quizzes.',
      href: '/flashcards',
      icon: Sparkles,
      cta: 'Review cards',
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice · Evaluation"
        title="Assessments"
        description="Measure what you actually know. Recognition, recall and scenario reasoning are three different skills — this hub covers all three."
        actions={<Link href="/flashcards" className="btn-ghost">Flashcards <ArrowRight className="h-4 w-4" /></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quizzes taken" value={progress.stats.quizzesTaken} sub="Distinct recorded scores" icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard label="Average score" value={`${progress.stats.quizAverage}%`} sub="Across all recorded quizzes" icon={<Target className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Chapters mastered" value={progress.stats.mastered} sub={`of ${progress.stats.totalChapters || 36} chapters`} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Cards due" value={progress.stats.dueCards} sub="Spaced repetition queue" icon={<Sparkles className="h-4 w-4" />} tone="cyan" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const IconCmp = c.icon;
          return (
            <Link key={c.title} href={c.href} className="panel panel-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="label">{c.title}</div>
                <div className="rounded-lg border border-mint-500/20 bg-mint-500/10 p-2 text-mint-300"><IconCmp className="h-4 w-4" /></div>
              </div>
              <div className="stat-num mt-3">{c.value}</div>
              <div className="mt-1 text-xs text-muted">{c.sub}</div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">{c.desc}</p>
              <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-mint-400">
                {c.cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Progression explainer */}
      <Panel className="mt-6 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="label mb-2">Progression rules</div>
            <h2 className="section-title">How progression works</h2>
          </div>
          <Badge tone="mint"><ShieldCheck className="h-3.5 w-3.5" /> {MASTERY_SCORE}% demonstration threshold</Badge>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><GitBranch className="h-4 w-4 text-mint-400" /> Demonstrate, don't collect</div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Reading a chapter does not unlock the next level. A chapter is <strong className="text-slate-200">mastered</strong> only when its quiz score reaches {MASTERY_SCORE}%. Your highest score is retained, so a retry never costs progress.
            </p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><ClipboardCheck className="h-4 w-4 text-cyanx-300" /> What counts as a score</div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Chapter quizzes use five tag-matched questions from the bank. Page quizzes in the bank and the eight scenario assessments also record a score (bank page quizzes map to the nearest chapter — shown where applicable).
            </p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Target className="h-4 w-4 text-amber-300" /> Levels & gaps</div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Levels advance when 60% of a level's chapters are mastered. Analytics highlights strong and weak areas from the tags of chapters you've scored, so you can target revision instead of re-reading everything.
            </p>
          </div>
        </div>
      </Panel>

      {/* Domains */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="label mb-1">Question distribution</div>
            <h2 className="section-title">Domains</h2>
          </div>
          <span className="text-xs text-muted">Best scores are approximate — inferred from chapter tags, not per-question answers.</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DOMAINS.map((d) => {
            const best = domainBest[d];
            return (
              <Panel key={d} className={cn('border p-5', toneClass[d])}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{d}</div>
                    <div className="mt-1 text-xs opacity-80">{domainCounts[d] ?? 0} questions in the bank</div>
                  </div>
                  <div className="font-mono text-xl">{domainCounts[d] ?? 0}</div>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="opacity-80">Best score (approx.)</span>
                  <span className="font-mono">{best === undefined ? '—' : `${best}%`}</span>
                </div>
                <ProgressBar value={best ?? 0} className="mt-2" tone={best !== undefined && best >= MASTERY_SCORE ? 'mint' : 'cyan'} />
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Chapters */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label mb-1">Chapter by chapter</div>
            <h2 className="section-title">Mastery status</h2>
          </div>
          <SearchInput value={chapterQuery} onChange={setChapterQuery} placeholder="Find a chapter…" className="w-full sm:w-64" />
        </div>
        {filteredChapters.length === 0 ? (
          <EmptyState title="No chapters match" description="Try a different title, tag or part name." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filteredChapters.map((c) => {
              const score = progress.state.quizScores[c.id];
              const status = statusFor(score);
              return (
                <Link key={c.id} href={`/learn/${c.slug}`} className="panel panel-hover flex items-center gap-3 p-3.5">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs',
                    status.tone === 'mint' ? 'border-mint-500/30 bg-mint-500/10 text-mint-300' : status.tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-ink-600 bg-ink-800 text-muted',
                  )}>
                    {String(c.number).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-200">{c.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={score ?? 0} className="max-w-[120px]" />
                      <span className="font-mono text-[11px] text-muted">{score === undefined ? '—' : `${score}%`}</span>
                    </div>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
