'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpenText, ChevronRight, CircuitBoard, Crosshair, FlaskConical, Info, Lightbulb,
  Microscope, NotebookPen, RotateCcw, Send, ShieldAlert, Sparkles, Target, Wrench,
} from 'lucide-react';
import { useData, useChapterMarkdown } from '@/lib/data';
import type { Chapter, GlossaryItem, Question } from '@/lib/types';
import { Badge, CopyButton, EmptyState, Panel } from '@/components/ui';
import { Markdown } from '@/components/markdown';
import { useProgress } from '@/components/providers';
import { answerQuestion, explainSelection, suggestPrompts, type TutorContext, type TutorMode, type TutorResponse } from '@/lib/tutor';
import { cn } from '@/lib/utils';

const MODES: { key: TutorMode; title: string; description: string; icon: React.ReactNode; tone: string }[] = [
  {
    key: 'BEGINNER', title: 'Beginner', icon: <Lightbulb className="h-4 w-4" />,
    description: 'Plain language, analogies and everyday examples. Minimal jargon.',
    tone: 'border-mint-500/40 bg-mint-500/10 text-mint-300',
  },
  {
    key: 'ENGINEER', title: 'Engineer', icon: <CircuitBoard className="h-4 w-4" />,
    description: 'Mechanisms, data flow, code and commands, failure modes and fixes.',
    tone: 'border-cyanx-500/40 bg-cyanx-500/10 text-cyanx-300',
  },
  {
    key: 'RESEARCHER', title: 'Researcher', icon: <Microscope className="h-4 w-4" />,
    description: 'Internals, threat models, trust boundaries, open questions and sources.',
    tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
];

const HONESTY_BANNER =
  'Offline grounded tutor — answers are assembled from the academy\'s own content and first-principles templates. Connect an LLM API in the backend for open-ended generation. The tutor is a mentor, not a replacement for practice.';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  at: number;
  response?: TutorResponse;
};

function isMode(v: unknown): v is TutorMode {
  return v === 'BEGINNER' || v === 'ENGINEER' || v === 'RESEARCHER';
}

function TutorWorkspace() {
  const params = useSearchParams();
  const chapterParam = params.get('chapter');
  const progress = useProgress();

  const { data: chapters, loading: chaptersLoading } = useData<Chapter[]>('chapters.json');
  const { data: questionBank } = useData<Question[]>('questions.json');
  const { data: glossary } = useData<GlossaryItem[]>('glossary.json');

  const chapter = useMemo(() => {
    if (!chapterParam) return null;
    const id = Number(chapterParam);
    return chapters?.find((c) => c.id === id || c.slug === chapterParam) ?? null;
  }, [chapters, chapterParam]);

  const { md, loading: mdLoading } = useChapterMarkdown(chapter?.path ?? null);

  const [mode, setMode] = useState<TutorMode>('ENGINEER');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionHint, setSelectionHint] = useState('');
  const [saved, setSaved] = useState(false);
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore the persisted mode once progress has been hydrated from localStorage.
  useEffect(() => {
    const stored = progress.state.tutorModes.global;
    if (progress.ready && isMode(stored)) setMode(stored);
  }, [progress.ready, progress.state.tutorModes.global]);

  // Keep the most recent browser selection available even after clicking a button.
  useEffect(() => {
    const capture = () => {
      const text = window.getSelection()?.toString().trim();
      if (text) setSelectedText(text.slice(0, 1200));
    };
    document.addEventListener('selectionchange', capture);
    return () => document.removeEventListener('selectionchange', capture);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const changeMode = useCallback((next: TutorMode) => {
    setMode(next);
    progress.setTutorMode('global', next);
  }, [progress]);

  const ctx = useMemo<TutorContext>(() => ({
    chapter,
    markdown: md,
    questionBank: questionBank ?? [],
    glossary: glossary ?? [],
    selection: selectedText,
  }), [chapter, md, questionBank, glossary, selectedText]);

  const starters = useMemo(() => suggestPrompts(ctx), [ctx]);

  const appendExchange = useCallback((prompt: string, response: TutorResponse) => {
    const at = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: ++seq.current, role: 'user', text: prompt, at },
      { id: ++seq.current, role: 'assistant', text: response.body, at, response },
    ]);
    setSaved(false);
  }, []);

  const send = useCallback((raw: string, overrideMode?: TutorMode) => {
    const text = (raw ?? '').trim();
    if (!text) return;
    if (overrideMode && overrideMode !== mode) changeMode(overrideMode);
    const response = answerQuestion(text, overrideMode ?? mode, ctx);
    appendExchange(text, response);
    setInput('');
  }, [mode, ctx, appendExchange, changeMode]);

  const onSend = useCallback(() => {
    if (!input.trim()) return;
    send(input);
  }, [input, send]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const runSelection = useCallback(() => {
    const live = window.getSelection()?.toString().trim();
    const text = live || selectedText;
    if (!text) {
      setSelectionHint('Select some chapter text first, then click Explain selection.');
      return;
    }
    setSelectedText(text.slice(0, 1200));
    setSelectionHint('');
    const response = explainSelection(text, mode, ctx);
    appendExchange(`Explain this selection: ${text.slice(0, 160)}`, response);
  }, [selectedText, mode, ctx, appendExchange]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant' && m.response),
    [messages],
  );

  const label = chapter?.title ?? (chapterParam && chaptersLoading ? 'your chapter' : 'this topic');
  const tools: { label: string; prompt: string; icon: React.ReactNode; overrideMode?: TutorMode }[] = [
    { label: 'Explain simply', prompt: `Explain simply: ${label}`, icon: <Lightbulb className="h-3.5 w-3.5" />, overrideMode: 'BEGINNER' },
    { label: 'Root cause', prompt: `What is the root cause of ${label}?`, icon: <Crosshair className="h-3.5 w-3.5" /> },
    { label: 'Detection methods', prompt: `Detection methods for ${label} — how do I find it?`, icon: <Target className="h-3.5 w-3.5" /> },
    { label: 'Defence', prompt: `How do developers prevent ${label}? Give fix and mitigation details.`, icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { label: 'Generate quiz', prompt: `Generate a quiz on ${label}`, icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { label: 'Generate flashcards', prompt: `Generate flashcards for ${label}`, icon: <BookOpenText className="h-3.5 w-3.5" /> },
    { label: 'Interview simulation', prompt: `Interview simulation for ${label}`, icon: <Microscope className="h-3.5 w-3.5" /> },
    { label: 'Research directions', prompt: `Research directions for ${label}`, icon: <Wrench className="h-3.5 w-3.5" /> },
  ];

  const contextLoading = Boolean(chapter) && mdLoading;

  return (
    <div className="animate-fade-up">
      <header className="mb-7 border-b border-ink-800 pb-6">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyanx-300" />
          <span className="label text-mint-400">Practice / AI Tutor</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">AI Tutor</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
          A mentor that explains anything in the academy at the depth you choose — grounded in your chapters, question bank and glossary.
        </p>
      </header>

      <Panel className="mb-5 flex flex-col gap-3 border-amber-500/20 bg-amber-500/[0.04] p-4 sm:flex-row sm:items-start">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p className="text-[12.5px] leading-relaxed text-amber-100/80">{HONESTY_BANNER}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* ---------------------------- Main chat ---------------------------- */}
        <div className="min-w-0 space-y-4">
          <div>
            <div className="label mb-2">Explanation depth</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => changeMode(m.key)}
                  aria-pressed={mode === m.key}
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    mode === m.key ? m.tone : 'border-ink-700 bg-ink-900/60 hover:border-ink-600 hover:bg-ink-800',
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {m.icon}
                    <span>{m.title}</span>
                    {mode === m.key && <Badge tone="mint" className="ml-auto">Active</Badge>}
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Panel className="flex min-h-[560px] flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyanx-300" />
                <span className="text-sm font-medium text-slate-200">Conversation</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {chapter ? (
                  <Badge tone="mint">
                    <BookOpenText className="h-3 w-3" />
                    Grounded in: Chapter {chapter.number} — {chapter.title}
                  </Badge>
                ) : chapterParam && !chaptersLoading ? (
                  <Badge tone="amber">Chapter not found — using general context</Badge>
                ) : (
                  <Badge>General context</Badge>
                )}
                {contextLoading && <Badge tone="cyan">Loading chapter…</Badge>}
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5" style={{ maxHeight: '56vh' }}>
              {messages.length === 0 ? (
                <EmptyState
                  title="Ask your first question"
                  description="Pick a starter prompt, choose a quick action, or type your own question. Answers are assembled live from the academy's own content — nothing is sent to a server."
                  action={
                    <button className="btn-primary" onClick={() => send(starters[0] ?? 'Explain the basics')}>
                      <Sparkles className="h-4 w-4" /> Try a starter prompt
                    </button>
                  }
                />
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={cn('flex animate-fade-up', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[92%] rounded-2xl px-4 py-3', m.role === 'user'
                      ? 'border border-mint-500/30 bg-mint-500/10'
                      : 'border border-ink-700 bg-ink-850')}>
                      <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted">
                        <span className={m.role === 'user' ? 'text-mint-300' : 'text-cyanx-300'}>
                          {m.role === 'user' ? 'You' : `Tutor · ${m.role === 'assistant' && m.response ? m.response.mode.toLowerCase() : mode.toLowerCase()}`}
                        </span>
                        <span className="text-ink-600">·</span>
                        <span>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {m.role === 'assistant' ? (
                        <>
                          {m.response && <h3 className="mb-2 text-base font-semibold text-slate-50">{m.response.title}</h3>}
                          <Markdown content={m.text} />
                          {m.response && m.response.sources.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink-800 pt-3">
                              <span className="label mr-1">Sources</span>
                              {m.response.sources.map((s) => <span key={s} className="chip">{s}</span>)}
                              {m.response.grounded && <Badge tone="mint">Grounded</Badge>}
                            </div>
                          )}
                          {m.response && m.response.followUps.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {m.response.followUps.map((f) => (
                                <button key={f} className="btn-ghost text-[11.5px]" onClick={() => send(f)}>
                                  <ChevronRight className="h-3 w-3 text-cyanx-300" /> {f}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-200">{m.text}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-ink-800 bg-ink-900/60 p-3">
              {lastAssistant && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    className="btn-ghost text-[11.5px]"
                    onClick={() => {
                      progress.addNote(
                        `### ${lastAssistant.response?.title ?? 'Tutor answer'}\n\n${lastAssistant.text}`,
                        chapter ? `Chapter ${chapter.number} — ${chapter.title}` : 'AI Tutor',
                      );
                      setSaved(true);
                    }}
                  >
                    <NotebookPen className="h-3.5 w-3.5" /> {saved ? 'Saved to notes' : 'Save last answer'}
                  </button>
                  <CopyButton text={`${lastAssistant.response?.title ?? ''}\n\n${lastAssistant.text}`.trim()} />
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  className="input min-h-[52px] flex-1 resize-none py-3 text-[13.5px]"
                  placeholder="Ask about any concept, or paste a question… (Enter to send, Shift+Enter for a new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  aria-label="Ask the tutor"
                />
                <button className="btn-primary h-[52px] px-4" disabled={!input.trim()} onClick={onSend} title="Send message">
                  <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span>
                </button>
                <button className="btn-icon h-[52px] w-10" onClick={() => { setMessages([]); setSaved(false); }} title="Clear conversation">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Enter sends · Shift+Enter adds a line · the tutor never makes network requests.
              </p>
            </div>
          </Panel>
        </div>

        {/* ---------------------------- Sidebar ---------------------------- */}
        <aside>
          <div className="space-y-4 lg:sticky lg:top-24">
            <Panel className="p-4">
              <div className="label mb-3">Context</div>
              {chapter ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <BookOpenText className="h-4 w-4 text-mint-400" />
                    Chapter {chapter.number} — {chapter.title}
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{chapter.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {chapter.tags.slice(0, 6).map((t) => <span key={t} className="chip">#{t}</span>)}
                  </div>
                </div>
              ) : contextLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-ink-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-ink-800" />
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  No chapter selected. Open a chapter and choose <span className="text-cyanx-300">Ask AI tutor</span> to ground answers in its markdown.
                </p>
              )}

              <div className="mt-4 border-t border-ink-800 pt-3">
                <div className="label mb-2">Selected text</div>
                {selectedText ? (
                  <blockquote className="max-h-24 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 p-2.5 text-[11.5px] italic leading-relaxed text-slate-300">
                    “{selectedText.slice(0, 300)}{selectedText.length > 300 ? '…' : ''}”
                  </blockquote>
                ) : (
                  <p className="text-[11.5px] leading-relaxed text-muted">Select text anywhere on the page to explain it in context.</p>
                )}
                {selectionHint && <p className="mt-1.5 text-[11px] text-amber-300">{selectionHint}</p>}
                <button className="btn-ghost mt-2 w-full" onClick={runSelection}>
                  <BookOpenText className="h-3.5 w-3.5" /> Explain selection
                </button>
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="label mb-3">Starter prompts</div>
              <div className="space-y-1.5">
                {starters.map((p, i) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] leading-snug text-slate-300 transition hover:bg-ink-800 hover:text-mint-300"
                  >
                    <span className="font-mono text-[10px] text-ink-600">{String(i + 1).padStart(2, '0')}</span>
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="label mb-3">Toolbelt</div>
              <div className="grid grid-cols-2 gap-1.5">
                {tools.map((t) => (
                  <button
                    key={t.label}
                    className="btn-ghost justify-start px-2 py-2 text-[11.5px] leading-tight"
                    onClick={() => send(t.prompt, t.overrideMode)}
                  >
                    {t.icon} <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="label mb-2">How this works</div>
              <p className="text-[11.5px] leading-relaxed text-muted">
                The engine detects your intent and topic, extracts the most relevant paragraph from the loaded chapter, and builds an answer in your chosen depth.
                Quiz and flashcard actions draw from the academy&apos;s own question bank.
              </p>
            </Panel>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="animate-pulse py-20 text-center text-sm text-muted">Loading tutor…</div>}>
      <TutorWorkspace />
    </Suspense>
  );
}
