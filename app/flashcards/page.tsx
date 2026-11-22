'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, BookOpenText, Brain, CalendarClock, CheckCircle2, ChevronLeft,
  ChevronRight, Layers3, RotateCcw, Shuffle, Sparkles, Wrench,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { Chapter, GlossaryItem, Question, Tool } from '@/lib/types';
import { questionsForChapter } from '@/lib/quiz';
import { Badge, EmptyState, PageHeader, Panel, ProgressBar, StatCard } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { cn, pct } from '@/lib/utils';

type Domain = 'Foundational' | 'Web' | 'Network' | 'Advanced' | 'Cloud' | 'AI';
const DOMAINS: Domain[] = ['Foundational', 'Web', 'Network', 'Advanced', 'Cloud', 'AI'];

type DeckKey = 'bank' | 'glossary' | 'chapter' | 'tools' | 'due';
type Flashcard = {
  id: number;
  front: string;
  back: string;
  kind: 'Question' | 'Term' | 'Tool';
  domain: Domain;
  source?: string;
};

/** Keyword heuristic so glossary/tool cards can also be filtered by domain. */
function detectDomain(text: string): Domain | null {
  const t = text.toLowerCase();
  const rules: [Domain, RegExp][] = [
    ['AI', /\b(llm|prompt injection|prompt|artificial intelligence|\bai\b|machine learning|neural|embedding|\brag\b|\bgpt\b|transformer|agentic)/],
    ['Cloud', /\b(aws|azure|gcp|iam|s3\b|bucket|kubernetes|k8s|docker|container|metadata service|serverless|lambda|cloud)/],
    ['Advanced', /\b(exploit|buffer overflow|heap|use.after.free|shellcode|reverse engineering|malware|binary|fuzz|\brop\b|format string|race condition)/],
    ['Web', /\b(sql|xss|csrf|ssrf|http|browser|cookie|\bdom\b|owasp|api|jwt|session|web application|injection|oauth)/],
    ['Network', /\b(tcp|udp|\bip\b|dns|tls|ssl|port scan|packet|router|subnet|network|wifi|\barp\b|proxy)/],
  ];
  for (const [domain, re] of rules) if (re.test(t)) return domain;
  return null;
}
function domainOf(text: string): Domain {
  return detectDomain(text) ?? 'Foundational';
}

function formatDue(due: number): string {
  if (!due) return 'Not scheduled';
  const diff = Math.round((due - Date.now()) / 86400000);
  if (diff <= 0) return 'Due now';
  if (diff === 1) return 'Tomorrow';
  const d = new Date(due);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}
function formatInterval(days: number): string {
  if (!days) return '—';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1 month' : `${months} months`;
}

function DeckSkeleton() {
  return (
    <div className="space-y-4 py-10">
      <div className="h-5 w-40 animate-pulse rounded bg-ink-800" />
      <div className="h-56 animate-pulse rounded-xl border border-ink-800 bg-ink-900/50" />
      <p className="text-sm text-muted">Preparing your decks…</p>
    </div>
  );
}

function FlashcardsInner() {
  const searchParams = useSearchParams();
  const chapterParam = searchParams.get('chapter');

  const { data: questions, loading: loadingQuestions } = useData<Question[]>('questions.json');
  const { data: glossary } = useData<GlossaryItem[]>('glossary.json');
  const { data: tools } = useData<Tool[]>('tools.json');
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const progress = useProgress();

  const [deck, setDeck] = useState<DeckKey>('bank');
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({ reviewed: 0, again: 0, good: 0 });
  const [sessionEnded, setSessionEnded] = useState(false);
  const [studiedToday, setStudiedToday] = useState(0);

  // Restore the "studied today" counter from the same browser/day.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aegis-flashcards-daily');
      if (raw) {
        const saved = JSON.parse(raw) as { date?: string; count?: number };
        if (saved.date === new Date().toISOString().slice(0, 10)) setStudiedToday(saved.count ?? 0);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const questionCards = useMemo<Flashcard[]>(
    () => (questions ?? []).map((q) => ({
      id: q.id,
      front: q.question,
      back: q.answer,
      kind: 'Question' as const,
      domain: DOMAINS.includes(q.domain as Domain) ? (q.domain as Domain) : domainOf(q.question),
      source: q.source,
    })),
    [questions],
  );

  const glossaryCards = useMemo<Flashcard[]>(
    () => (glossary ?? []).map((g, i) => ({
      id: 200000 + i,
      front: `What does “${g.term}” mean?`,
      back: `${g.term}: ${g.definition}`,
      kind: 'Term' as const,
      domain: domainOf(`${g.term} — ${g.definition}`),
      source: 'Glossary',
    })),
    [glossary],
  );

  const toolCards = useMemo<Flashcard[]>(
    () => (tools ?? []).map((t, i) => ({
      id: 400000 + i,
      front: `What is ${t.name} used for?`,
      back: `${t.name} is a ${t.category.toLowerCase()} tool (${t.level}). ${t.purpose}\n\nTypical use: ${t.cmd}\n\nCommon mistake: ${t.mistakes}`,
      kind: 'Tool' as const,
      domain: domainOf(`${t.name} ${t.category} ${t.purpose}`),
      source: 'Tools Encyclopedia',
    })),
    [tools],
  );

  const chapter = useMemo(
    () => chapters?.find((c) => String(c.id) === chapterParam || c.slug === chapterParam) ?? null,
    [chapters, chapterParam],
  );

  const chapterCards = useMemo<Flashcard[]>(() => {
    if (!chapter || !questions) return [];
    return questionsForChapter(chapter, questions, 12).map((q) => ({
      id: q.id,
      front: q.question,
      back: q.answer,
      kind: 'Question' as const,
      domain: DOMAINS.includes(q.domain as Domain) ? (q.domain as Domain) : domainOf(q.question),
      source: `Chapter ${chapter.number}`,
    }));
  }, [chapter, questions]);

  // Start in the focused deck when a chapter is supplied.
  useEffect(() => {
    if (chapterParam) setDeck('chapter');
  }, [chapterParam]);

  const byId = useMemo(() => {
    const map = new Map<number, Flashcard>();
    [...questionCards, ...glossaryCards, ...toolCards].forEach((c) => map.set(c.id, c));
    return map;
  }, [questionCards, glossaryCards, toolCards]);

  const now = Date.now();
  const dueList = useMemo(
    () => Object.entries(progress.state.flashcardReviews)
      .filter(([, r]) => r.due <= now)
      .map(([id]) => byId.get(Number(id)))
      .filter((c): c is Flashcard => Boolean(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress.state.flashcardReviews, byId],
  );

  const decks: { key: DeckKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'bank', label: 'Master Question Bank', count: questionCards.length, icon: <BookOpenText className="h-4 w-4" /> },
    { key: 'glossary', label: 'Glossary', count: glossaryCards.length, icon: <Layers3 className="h-4 w-4" /> },
    ...(chapterCards.length ? [{ key: 'chapter' as DeckKey, label: `Chapter ${chapter?.number} · ${chapter?.title}`, count: chapterCards.length, icon: <Sparkles className="h-4 w-4" /> }] : []),
    { key: 'tools', label: 'Tool names', count: toolCards.length, icon: <Wrench className="h-4 w-4" /> },
    { key: 'due', label: 'Due only', count: dueList.length, icon: <CalendarClock className="h-4 w-4" /> },
  ];

  const deckCards = useMemo(() => {
    switch (deck) {
      case 'glossary': return glossaryCards;
      case 'chapter': return chapterCards;
      case 'tools': return toolCards;
      case 'due': return dueList;
      default: return questionCards;
    }
  }, [deck, glossaryCards, chapterCards, toolCards, dueList, questionCards]);

  const visibleCards = useMemo(
    () => (activeDomain ? deckCards.filter((c) => c.domain === activeDomain) : deckCards),
    [deckCards, activeDomain],
  );

  useEffect(() => {
    setIdx(0);
    setRevealed(false);
  }, [deck, activeDomain]);

  const safeIdx = Math.min(idx, Math.max(0, visibleCards.length - 1));
  const current = visibleCards[safeIdx] ?? null;
  const review = current ? progress.state.flashcardReviews[current.id] : undefined;

  const grade = useCallback((correct: boolean) => {
    if (!revealed || !current) return;
    progress.reviewCard(current.id, correct);
    const today = new Date().toISOString().slice(0, 10);
    const next = studiedToday + 1;
    setStudiedToday(next);
    try {
      localStorage.setItem('aegis-flashcards-daily', JSON.stringify({ date: today, count: next }));
    } catch {
      /* storage unavailable */
    }
    setSession((s) => ({
      reviewed: s.reviewed + 1,
      again: s.again + (correct ? 0 : 1),
      good: s.good + (correct ? 1 : 0),
    }));
    setSessionEnded(false);
    setRevealed(false);
    setIdx((i) => (i + 1) % Math.max(1, visibleCards.length));
  }, [revealed, current, studiedToday, visibleCards.length, progress.reviewCard]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!revealed) setRevealed(true);
      } else if (e.key === '1' && revealed) {
        e.preventDefault();
        grade(false);
      } else if (e.key === '2' && revealed) {
        e.preventDefault();
        grade(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, grade]);

  const knownCount = Object.values(progress.state.flashcardReviews).filter((r) => r.reps >= 2).length;
  const sessionAccuracy = pct(session.good, session.reviewed);

  if (loadingQuestions && !questionCards.length) {
    return <div className="animate-fade-up"><PageHeader eyebrow="Practice" title="Spaced-repetition flashcards" /><DeckSkeleton /></div>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice · Active recall"
        title="Flashcards"
        description="Turn the question bank, glossary and tool catalog into a reviewed deck. Rate each card honestly — the schedule adapts to you."
        actions={<Link href="/assessments" className="btn-ghost">Assessments <ArrowRight className="h-4 w-4" /></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Studied today" value={studiedToday} sub="Cards you graded today" icon={<BookOpenText className="h-4 w-4" />} />
        <StatCard label="Due now" value={progress.stats.dueCards} sub="Waiting for review" icon={<CalendarClock className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Known cards" value={knownCount} sub="Rated good at least twice" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Study streak" value={`${progress.state.streak} d`} sub="Consecutive active days" icon={<Sparkles className="h-4 w-4" />} tone="cyan" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* Deck selector */}
          <Panel className="p-4">
            <div className="label mb-3">Choose a deck</div>
            <div className="flex flex-wrap gap-2">
              {decks.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDeck(d.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition',
                    deck === d.key
                      ? 'border-mint-500/50 bg-mint-500/10 text-mint-300'
                      : 'border-ink-700 bg-ink-850 text-muted hover:border-ink-600 hover:text-slate-200',
                  )}
                >
                  {d.icon}
                  <span className="max-w-[230px] truncate">{d.label}</span>
                  <span className="font-mono text-[10px] opacity-70">{d.count}</span>
                </button>
              ))}
            </div>
            {chapterParam && !chapter && (
              <p className="mt-3 text-xs text-amber-300">No chapter matched <code className="font-mono">{chapterParam}</code> — showing the full bank instead.</p>
            )}
          </Panel>

          {/* Domain chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveDomain(null)}
              className={cn('chip transition', !activeDomain && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
            >
              All domains
            </button>
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDomain(activeDomain === d ? null : d)}
                className={cn('chip transition hover:border-ink-500', activeDomain === d && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
              >
                {d}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted">{visibleCards.length} card{visibleCards.length === 1 ? '' : 's'}</span>
          </div>

          {/* Flashcard */}
          {current ? (
            <Panel className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800 px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cyan">{current.kind}</Badge>
                  <Badge>{current.domain}</Badge>
                  {current.source && <span className="text-[11px] text-muted">{current.source}</span>}
                </div>
                <span className="font-mono text-xs text-muted">{safeIdx + 1} / {visibleCards.length}</span>
              </div>

              <button
                type="button"
                className="block w-full px-5 py-12 text-left transition hover:bg-ink-800/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500/40"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? 'Hide answer' : 'Reveal answer'}
              >
                <div className="label mb-3">{revealed ? 'Answer & rationale' : 'Question — click or press Space to reveal'}</div>
                <div className={cn('whitespace-pre-wrap text-lg leading-relaxed', revealed ? 'text-slate-200' : 'font-medium text-slate-100')}>
                  {revealed ? current.back : current.front}
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2 border-t border-ink-800 bg-ink-900/40 px-5 py-4">
                <span className="text-[11px] text-muted">
                  Ease {review?.ease.toFixed(2) ?? '2.50'} · Interval {formatInterval(review?.interval ?? 0)} · Reps {review?.reps ?? 0} · Due {formatDue(review?.due ?? 0)}
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button className="btn-ghost" onClick={() => setIdx((i) => (i - 1 + Math.max(1, visibleCards.length)) % Math.max(1, visibleCards.length))} aria-label="Previous card">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost" onClick={() => { setRevealed(false); setIdx((i) => (i + 1) % Math.max(1, visibleCards.length)); }} aria-label="Next card">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost" onClick={() => { setRevealed(false); setIdx(Math.floor(Math.random() * Math.max(1, visibleCards.length))); }} aria-label="Shuffle card">
                    <Shuffle className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-ink-800 px-5 py-4 sm:flex-row sm:items-center">
                <span className="text-xs text-muted">
                  {revealed ? 'How well did you recall it?' : 'Reveal the answer first, then grade yourself.'}
                </span>
                <div className="flex gap-2 sm:ml-auto">
                  <button className="btn-ghost disabled:opacity-40" disabled={!revealed} onClick={() => grade(false)}>
                    <RotateCcw className="h-4 w-4 text-rose-300" /> Again <kbd className="ml-1 font-mono text-[10px] text-muted">1</kbd>
                  </button>
                  <button className="btn-primary disabled:opacity-40" disabled={!revealed} onClick={() => grade(true)}>
                    <CheckCircle2 className="h-4 w-4" /> Good <kbd className="ml-1 font-mono text-[10px] text-mint-950/70">2</kbd>
                  </button>
                </div>
              </div>
            </Panel>
          ) : (
            <EmptyState
              title={deck === 'due' ? 'Nothing due right now' : 'No cards in this deck'}
              description={deck === 'due' ? 'Grade a few cards — your review schedule will fill this deck automatically.' : 'Try a different deck or clear the domain filter.'}
              action={<button className="btn-ghost" onClick={() => { setDeck('bank'); setActiveDomain(null); }}>Open the question bank</button>}
            />
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="label mb-3">This session</div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="stat-num">{session.reviewed}</div>
                <div className="mt-1 text-xs text-muted">cards reviewed</div>
              </div>
              <button className="btn-ghost" onClick={() => setSessionEnded(true)}>End session</button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted">
              <div className="flex justify-between"><span>Good recalls</span><span className="font-mono text-mint-300">{session.good}</span></div>
              <div className="flex justify-between"><span>Again</span><span className="font-mono text-rose-300">{session.again}</span></div>
              <div className="flex justify-between"><span>Accuracy</span><span className="font-mono text-slate-200">{sessionAccuracy}%</span></div>
            </div>
            <ProgressBar value={sessionAccuracy} className="mt-3" />
            {sessionEnded && (
              <div className="mt-4 rounded-lg border border-mint-500/25 bg-mint-500/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-mint-300"><Brain className="h-4 w-4" /> Session summary</div>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  You reviewed <span className="font-mono text-slate-200">{session.reviewed}</span> cards with{' '}
                  <span className="font-mono text-slate-200">{sessionAccuracy}%</span> honest recalls. Cards marked “Again” restart their interval; “Good” cards return on a longer schedule.
                </p>
                <button
                  className="btn-primary mt-3 w-full"
                  onClick={() => { setSession({ reviewed: 0, again: 0, good: 0 }); setSessionEnded(false); }}
                >
                  Start a new session
                </button>
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="label mb-3">How spaced repetition works</div>
            <p className="text-sm leading-relaxed text-muted">
              Each card starts with an ease of 2.5. A correct answer grows the interval (1 day, 6 days, then ease-scaled); an incorrect answer resets it to zero so the card comes back today. The schedule follows the SM-2-lite algorithm in your local progress state.
            </p>
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90">
              <strong className="font-semibold">Grade honestly.</strong> “Good” should mean you explained the answer before revealing it — not that it looked familiar. Recalling slightly before you forget is what builds durable knowledge.
            </div>
            <div className="mt-4 space-y-1.5 text-[11px] text-muted">
              <div className="font-mono">Space → reveal answer</div>
              <div className="font-mono">1 → Again · 2 → Good</div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="label mb-3">Keyboard-free alternative</div>
            <p className="text-sm leading-relaxed text-muted">
              Click the card to flip it, then use the two grading buttons. Your reviews are stored in this browser only.
            </p>
            <Link href="/assessments/bank" className="link mt-3 inline-flex items-center gap-1 text-xs">Browse the full question bank <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted">Loading flashcards…</div>}>
      <FlashcardsInner />
    </Suspense>
  );
}
