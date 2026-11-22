'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Bookmark, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleX, ClipboardCheck, Info, RotateCcw, X,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { Chapter, Question } from '@/lib/types';
import { scoreAnswers } from '@/lib/quiz';
import { Badge, EmptyState, PageHeader, Panel, ProgressBar, SearchInput } from '@/components/ui';
import { MASTERY_SCORE, useProgress } from '@/components/providers';
import { cn } from '@/lib/utils';

type Domain = 'Foundational' | 'Web' | 'Network' | 'Advanced' | 'Cloud' | 'AI';
const DOMAINS: Domain[] = ['Foundational', 'Web', 'Network', 'Advanced', 'Cloud', 'AI'];
const PAGE_SIZE = 25;

/** Approximate tag → domain map for the score attribution note. */
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

function BankInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const { data: questions, loading } = useData<Question[]>('questions.json');
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const progress = useProgress();

  const [search, setSearch] = useState(initialQuery);
  const [domain, setDomain] = useState<Domain | 'All'>('All');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [quizMode, setQuizMode] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lastScore, setLastScore] = useState<{ score: number; correct: number; total: number } | null>(null);

  useEffect(() => { setSearch(initialQuery); }, [initialQuery]);

  const resetView = () => {
    setPage(0);
    setExpanded(new Set());
    setQuizMode(false);
    setAnswers({});
    setSubmitted(false);
    setLastScore(null);
  };
  useEffect(() => { resetView(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [domain, search]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (questions ?? []).filter((q) => {
      if (domain !== 'All' && q.domain !== domain) return false;
      if (!needle) return true;
      return `${q.question} ${q.answer} ${q.source ?? ''}`.toLowerCase().includes(needle);
    });
  }, [questions, domain, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filtered, safePage],
  );

  // Score attribution: first chapter whose tags match the filtered domain, else Chapter 1.
  const targetChapter = useMemo(() => {
    if (domain === 'All') return (chapters ?? []).find((c) => c.id === 1) ?? null;
    return (chapters ?? []).find((c) => c.tags.some((t) => tagDomain(t) === domain))
      ?? (chapters ?? []).find((c) => c.id === 1)
      ?? null;
  }, [chapters, domain]);
  const targetId = targetChapter?.id ?? 1;

  const toggleExpand = (id: number) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const startQuiz = () => {
    setQuizMode(true);
    setAnswers({});
    setSubmitted(false);
    setLastScore(null);
    setExpanded(new Set());
  };

  const submitQuiz = () => {
    const result = scoreAnswers(answers);
    setLastScore(result);
    setSubmitted(true);
    progress.setQuizScore(targetId, result.score);
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice · Question bank"
        title="Master Question Bank"
        description="1,000 questions across six domains. Search, bookmark and reveal the reasoning — or grade yourself on the current page."
        actions={<Link href="/assessments" className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Assessment hub</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-4"><div className="label">Indexed questions</div><div className="stat-num mt-2">{questions?.length.toLocaleString() ?? '—'}</div></Panel>
        <Panel className="p-4"><div className="label">Matching this filter</div><div className="stat-num mt-2">{filtered.length.toLocaleString()}</div></Panel>
        <Panel className="p-4"><div className="label">Bookmarked</div><div className="stat-num mt-2">{progress.state.bookmarks.filter((b) => b.startsWith('question:')).length}</div></Panel>
      </div>

      {/* Controls */}
      <Panel className="mt-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search questions and answers…" className="flex-1" />
          <button className="btn-primary shrink-0" onClick={quizMode ? () => { setQuizMode(false); setSubmitted(false); } : startQuiz} disabled={!pageItems.length}>
            {quizMode ? <><X className="h-4 w-4" /> Exit quiz mode</> : <><ClipboardCheck className="h-4 w-4" /> Quiz me on this page</>}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDomain('All')}
            className={cn('chip transition', domain === 'All' && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
          >
            All domains
          </button>
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={cn('chip transition', domain === d && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
            >
              {d} <span className="font-mono text-[10px] opacity-70">{questions?.filter((q) => q.domain === d).length ?? 0}</span>
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">Page {safePage + 1} of {totalPages}</span>
        </div>
      </Panel>

      {/* Score attribution note */}
      <div className="mt-4 flex flex-wrap items-start gap-2 rounded-lg border border-cyanx-500/20 bg-cyanx-500/5 px-4 py-3 text-xs leading-relaxed text-cyanx-100/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyanx-300" />
        <span>
          Page quizzes are self-graded and recorded as a chapter score:{' '}
          <strong className="text-cyanx-200">{targetChapter ? `Chapter ${targetChapter.number} — ${targetChapter.title}` : 'Chapter 1'}</strong>{' '}
          {domain === 'All' ? '(fallback, because no single domain is selected)' : `(the first chapter whose tags match “${domain}”)`}.{' '}
          This mapping is approximate — use the quiz on each chapter page for authoritative mastery at {MASTERY_SCORE}%.
        </span>
      </div>

      {/* Quiz summary */}
      {quizMode && submitted && lastScore && (
        <Panel className="mt-4 border-mint-500/30 bg-mint-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label">Page assessment complete</div>
              <div className="mt-1 text-2xl font-semibold text-slate-50">{lastScore.score}% <span className="text-sm font-normal text-muted">({lastScore.correct}/{lastScore.total})</span></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={startQuiz}><RotateCcw className="h-4 w-4" /> Retry this page</button>
              <button className="btn-ghost" onClick={() => { setQuizMode(false); setSubmitted(false); }}>Back to browsing</button>
            </div>
          </div>
          <ProgressBar value={lastScore.score} className="mt-4" />
          <p className="mt-3 text-xs text-muted">
            Recorded to Chapter {targetId}{lastScore.score >= MASTERY_SCORE ? ' — at or above the mastery threshold.' : ' — keep practising to reach the mastery threshold.'}
          </p>
        </Panel>
      )}

      {/* Questions */}
      <div className="mt-5 space-y-3">
        {loading && !pageItems.length ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((n) => <div key={n} className="h-24 animate-pulse rounded-xl border border-ink-800 bg-ink-900/50" />)}</div>
        ) : pageItems.length === 0 ? (
          <EmptyState
            title="No questions found"
            description="Try another keyword, clear the domain filter, or use the search bar above."
            action={<button className="btn-ghost" onClick={() => { setSearch(''); setDomain('All'); }}>Clear filters</button>}
          />
        ) : pageItems.map((q, i) => {
          const ref = `question:${q.id}`;
          const bookmarked = progress.state.bookmarks.includes(ref);
          const isExpanded = expanded.has(q.id);
          const choice = answers[q.id];
          return (
            <Panel key={q.id} className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-ink-500">#{(safePage * PAGE_SIZE) + i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="cyan">{q.domain}</Badge>
                    {q.source && <span className="text-[11px] text-muted">{q.source}</span>}
                    <span className="font-mono text-[11px] text-ink-500">ID {q.id}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-slate-100">{q.question}</p>

                  {quizMode ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted">Self-grade:</span>
                      <button
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
                        className={cn('btn-ghost', choice === true && 'border-mint-500/50 bg-mint-500/10 text-mint-300')}
                      >
                        <Check className="h-4 w-4" /> I knew this
                      </button>
                      <button
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
                        className={cn('btn-ghost', choice === false && 'border-rose-500/50 bg-rose-500/10 text-rose-300')}
                      >
                        <CircleX className="h-4 w-4" /> I missed this
                      </button>
                      <button className="btn-ghost ml-auto" onClick={() => toggleExpand(q.id)}>
                        <ChevronDown className={cn('h-4 w-4 transition', isExpanded && 'rotate-180')} /> Answer
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button className="btn-ghost" onClick={() => toggleExpand(q.id)} aria-expanded={isExpanded}>
                        <ChevronDown className={cn('h-4 w-4 transition', isExpanded && 'rotate-180')} />
                        {isExpanded ? 'Hide answer' : 'Reveal answer'}
                      </button>
                      <button
                        className="btn-icon"
                        title={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
                        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
                        onClick={() => progress.toggleBookmark(ref)}
                      >
                        <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-mint-400 text-mint-400')} />
                      </button>
                    </div>
                  )}

                  {(isExpanded || (quizMode && submitted)) && (
                    <div className="mt-4 rounded-lg border border-ink-700 bg-ink-900/50 p-4">
                      <div className="label mb-2">Answer & rationale</div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{q.answer}</p>
                      {q.source && <p className="mt-3 text-[11px] text-muted">Source: {q.source}</p>}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">
          Showing {filtered.length ? safePage * PAGE_SIZE + 1 : 0}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /> Previous</button>
          <span className="px-2 font-mono text-xs text-muted">{safePage + 1} / {totalPages}</span>
          <button className="btn-ghost" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {quizMode && !submitted && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          <button className="btn-primary shadow-lg" onClick={submitQuiz} disabled={!answeredCount || answeredCount < pageItems.length}>
            <CheckCircle2 className="h-4 w-4" /> Submit page quiz ({answeredCount}/{pageItems.length} graded)
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4 border-t border-ink-800 pt-6 text-xs">
        <Link href="/assessments" className="link inline-flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5" /> All assessments</Link>
        <Link href="/assessments/scenarios" className="link inline-flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5" /> Scenario assessments</Link>
        <Link href="/flashcards" className="link inline-flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5" /> Turn missed questions into flashcards</Link>
      </div>
    </div>
  );
}

export default function QuestionBankPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted">Loading question bank…</div>}>
      <BankInner />
    </Suspense>
  );
}
