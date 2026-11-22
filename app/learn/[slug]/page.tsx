'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, CheckCircle2, ChevronRight, Circle, Clock, FileText, Lightbulb, NotebookPen, Sparkles, X } from 'lucide-react';
import { useData, useChapterMarkdown } from '@/lib/data';
import type { Chapter, Question } from '@/lib/types';
import { Badge, DifficultyBadge, Panel, ProgressBar } from '@/components/ui';
import { Markdown } from '@/components/markdown';
import { useProgress, MASTERY_SCORE } from '@/components/providers';
import { questionsForChapter } from '@/lib/quiz';
import { cn, formatMinutes } from '@/lib/utils';

export default function ChapterPage() {
  const params = useParams<{ slug: string }>();
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { data: questions } = useData<Question[]>('questions.json');
  const chapter = chapters?.find((c) => c.slug === params.slug) ?? null;
  const { md, loading } = useChapterMarkdown(chapter?.path ?? null);
  const progress = useProgress();
  const [showQuiz, setShowQuiz] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState('');

  const quizQuestions = useMemo(
    () => (chapter && questions ? questionsForChapter(chapter, questions, 5) : []),
    [chapter, questions],
  );

  if (!chapter) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">Chapter not found</h1>
        <Link href="/schools" className="btn-primary mt-6">Browse schools</Link>
      </div>
    );
  }

  const idx = chapters!.findIndex((c) => c.id === chapter.id);
  const prev = chapters![idx - 1];
  const next = chapters![idx + 1];
  const mastered = progress.isMastered(chapter.id);
  const score = progress.state.quizScores[chapter.id];
  const bookmarked = progress.state.bookmarks.includes(`chapter:${chapter.slug}`);
  const sections = chapter.sections.filter((s) => s.level === 2);

  const submitQuiz = () => {
    const correct = quizQuestions.filter((q) => answers[q.id]).length;
    const s = Math.round((correct / quizQuestions.length) * 100);
    progress.setQuizScore(chapter.id, s);
    if (s >= 80 && !progress.state.completed[chapter.id]) progress.toggleComplete(chapter.id);
    setSubmitted(true);
  };

  return (
    <div className="animate-fade-up">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/schools" className="hover:text-mint-400">Schools</Link>
        <ChevronRight className="h-3 w-3" />
        <span>{chapter.part}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-300">Chapter {chapter.number}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <div className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="mint">Chapter {chapter.number}</Badge>
              <DifficultyBadge value={chapter.difficulty} />
              <span className="chip"><Clock className="h-3 w-3" /> {formatMinutes(chapter.minutes)}</span>
              <span className="chip"><FileText className="h-3 w-3" /> {chapter.words.toLocaleString()} words</span>
              {mastered && <Badge tone="mint"><CheckCircle2 className="h-3 w-3" /> Mastered</Badge>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{chapter.title}</h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">{chapter.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {chapter.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 py-10">
              {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-ink-800" style={{ width: `${90 - n * 8}%` }} />)}
            </div>
          ) : (
            <Markdown content={md} />
          )}

          <div className="mt-14 grid gap-3 border-t border-ink-800 pt-8 sm:grid-cols-2">
            {prev ? (
              <Link href={`/learn/${prev.slug}`} className="panel panel-hover flex items-center gap-3 p-4">
                <ArrowLeft className="h-4 w-4 text-mint-400" />
                <div><div className="label">Previous</div><div className="text-sm font-medium text-slate-200">{prev.title}</div></div>
              </Link>
            ) : <div />}
            {next && (
              <Link href={`/learn/${next.slug}`} className="panel panel-hover flex items-center justify-end gap-3 p-4 text-right">
                <div><div className="label">Next</div><div className="text-sm font-medium text-slate-200">{next.title}</div></div>
                <ArrowRight className="h-4 w-4 text-mint-400" />
              </Link>
            )}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Panel className="p-4">
              <div className="label mb-3">Mastery check</div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>{score === undefined ? 'Not assessed' : `Best score: ${score}%`}</span>
                <span className="font-mono text-mint-400">{mastered ? 'Unlocked' : `Need ${MASTERY_SCORE}%`}</span>
              </div>
              <ProgressBar value={score ?? 0} />
              <button className="btn-primary mt-4 w-full" onClick={() => setShowQuiz((v) => !v)}>
                {showQuiz ? <><X className="h-4 w-4" /> Close quiz</> : <><CheckCircle2 className="h-4 w-4" /> Take mastery quiz</>}
              </button>
              <p className="mt-2.5 text-[11px] leading-relaxed text-muted">Progression requires a demonstrated score of {MASTERY_SCORE}% — not simply marking a lesson complete.</p>
            </Panel>

            <Panel className="p-4">
              <div className="label mb-3">On this page</div>
              <div className="max-h-[38vh] space-y-1 overflow-y-auto pr-1">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="block rounded px-2 py-1.5 text-[12px] leading-snug text-muted transition hover:bg-ink-800 hover:text-mint-300">
                    {s.title.replace(/^\d+(\.\d+)*\s*/, '')}
                  </a>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="label mb-3">Actions</div>
              <div className="space-y-2">
                <button
                  className={cn('btn-ghost w-full justify-start', progress.state.completed[chapter.id] && 'border-mint-500/30 text-mint-300')}
                  onClick={() => progress.toggleComplete(chapter.id)}
                >
                  {progress.state.completed[chapter.id] ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {progress.state.completed[chapter.id] ? 'Marked as read' : 'Mark as read'}
                </button>
                <button className="btn-ghost w-full justify-start" onClick={() => progress.toggleBookmark(`chapter:${chapter.slug}`)}>
                  <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-mint-400 text-mint-400')} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
                <Link className="btn-ghost w-full justify-start" href={`/tutor?chapter=${chapter.id}`}>
                  <Sparkles className="h-4 w-4 text-cyanx-300" /> Ask AI tutor
                </Link>
                <Link className="btn-ghost w-full justify-start" href={`/flashcards?chapter=${chapter.id}`}>
                  <Lightbulb className="h-4 w-4" /> Make flashcards
                </Link>
              </div>
              <div className="mt-4 border-t border-ink-800 pt-3">
                <textarea className="input min-h-[72px] resize-y text-xs" placeholder="Add a note about this chapter…" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn-ghost mt-2 w-full" disabled={!note.trim()} onClick={() => { progress.addNote(note.trim(), chapter.title); setNote(''); }}>
                  <NotebookPen className="h-4 w-4" /> Save note
                </button>
              </div>
            </Panel>
          </div>
        </aside>
      </div>

      {showQuiz && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowQuiz(false)} />
          <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-600 bg-ink-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="label text-mint-400">Mastery assessment</div>
                <h2 className="mt-1 text-xl font-semibold text-slate-50">{chapter.title}</h2>
                <p className="mt-1 text-xs text-muted">Answer from memory before revealing. 4 of 5 correct unlocks this chapter.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowQuiz(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              {quizQuestions.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-ink-700 bg-ink-850 p-4">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="font-mono text-xs text-mint-400">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-sm font-medium leading-relaxed text-slate-200">{q.question}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className={cn('btn flex-1', answers[q.id] === true ? 'bg-mint-500 text-ink-950' : 'btn-ghost')} onClick={() => { setAnswers((a) => ({ ...a, [q.id]: true })); setRevealed((r) => ({ ...r, [q.id]: true })); }}>
                      <Check className="h-4 w-4" /> I know it
                    </button>
                    <button className={cn('btn flex-1', answers[q.id] === false ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'btn-ghost')} onClick={() => { setAnswers((a) => ({ ...a, [q.id]: false })); setRevealed((r) => ({ ...r, [q.id]: true })); }}>
                      <X className="h-4 w-4" /> I missed it
                    </button>
                  </div>
                  {revealed[q.id] && (
                    <div className="mt-3 rounded-lg border border-ink-700 bg-ink-900 p-3 text-[13px] leading-relaxed text-slate-300">
                      <span className="label mr-2">Model answer</span>{q.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-800 pt-5">
              <div className="text-sm text-muted">
                {submitted ? <>Score recorded: <span className="font-mono text-mint-400">{Math.round((Object.values(answers).filter(Boolean).length / quizQuestions.length) * 100)}%</span></> : 'Your honest self-assessment sets your score.'}
              </div>
              <button className="btn-primary" disabled={Object.keys(answers).length < quizQuestions.length} onClick={submitQuiz}>Record score</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
