'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Chapter, Level, Note, ProgressState } from '@/lib/types';
import { useData } from '@/lib/data';
import { pct } from '@/lib/utils';

const KEY = 'aegis-progress-v1';

const initial: ProgressState = {
  completed: {},
  quizScores: {},
  flashcardReviews: {},
  bookmarks: [],
  notes: [],
  studyMinutes: 0,
  streak: 0,
  lastActive: '',
  labCompletions: [],
  challengeSolves: [],
  tutorModes: {},
  toolMastery: {},
  papersRead: [],
  cvesReviewed: [],
  name: 'Researcher',
};

export const MASTERY_SCORE = 80;

type ProgressContextValue = {
  state: ProgressState;
  ready: boolean;
  toggleComplete: (id: number) => void;
  setQuizScore: (id: number, score: number) => void;
  reviewCard: (id: number, correct: boolean) => void;
  toggleBookmark: (ref: string) => void;
  addNote: (body: string, ref: string) => void;
  removeNote: (id: string) => void;
  addStudyMinutes: (mins: number) => void;
  toggleLab: (id: string) => void;
  toggleChallenge: (id: string) => void;
  setTutorMode: (key: string, mode: string) => void;
  setToolMastery: (id: string, value: boolean) => void;
  togglePaper: (title: string) => void;
  toggleCVE: (cve: string) => void;
  setName: (name: string) => void;
  reset: () => void;
  isMastered: (id: number) => boolean;
  stats: {
    mastered: number;
    completed: number;
    totalChapters: number;
    overallPct: number;
    level: number;
    levelPct: number;
    levelBreakdown: { level: number; name: string; mastered: number; total: number; pct: number; practicalRequired: number; practicalDone: number; unlocked: boolean }[];
    practicalCount: number;
    practicalRequired: number;
    quizAverage: number;
    quizzesTaken: number;
    strongAreas: string[];
    weakAreas: string[];
    dueCards: number;
  };
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  if (!a) return 999;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(initial);
  const [ready, setReady] = useState(false);
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { data: levels } = useData<Level[]>('levels.json');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {
      /* corrupted local state: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, ready]);

  // Touch streak once per day.
  useEffect(() => {
    if (!ready) return;
    const today = todayISO();
    if (state.lastActive === today) return;
    const gap = daysBetween(state.lastActive, today);
    setState((s) => ({ ...s, lastActive: today, streak: gap === 1 ? s.streak + 1 : 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const patch = useCallback((fn: (s: ProgressState) => ProgressState) => setState(fn), []);

  const toggleComplete = useCallback((id: number) => patch((s) => ({ ...s, completed: { ...s.completed, [id]: !s.completed[id] } })), [patch]);
  const setQuizScore = useCallback((id: number, score: number) => patch((s) => ({
    ...s,
    quizScores: { ...s.quizScores, [id]: Math.max(s.quizScores[id] ?? 0, score) },
  })), [patch]);
  const reviewCard = useCallback((id: number, correct: boolean) => patch((s) => {
    const prev = s.flashcardReviews[id] ?? { ease: 2.5, interval: 0, due: 0, reps: 0 };
    const ease = Math.max(1.3, prev.ease + (correct ? 0.1 : -0.2));
    const reps = correct ? prev.reps + 1 : 0;
    const interval = correct ? (reps === 1 ? 1 : reps === 2 ? 6 : Math.round(prev.interval * ease)) : 0;
    const due = Date.now() + interval * 86400000;
    return { ...s, flashcardReviews: { ...s.flashcardReviews, [id]: { ease, interval, due, reps } } };
  }), [patch]);
  const toggleBookmark = useCallback((ref: string) => patch((s) => ({
    ...s, bookmarks: s.bookmarks.includes(ref) ? s.bookmarks.filter((b) => b !== ref) : [...s.bookmarks, ref],
  })), [patch]);
  const addNote = useCallback((body: string, ref: string) => patch((s) => ({
    ...s, notes: [{ id: `${Date.now()}`, body, ref, createdAt: Date.now() }, ...s.notes],
  })), [patch]);
  const removeNote = useCallback((id: string) => patch((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })), [patch]);
  const addStudyMinutes = useCallback((mins: number) => patch((s) => ({ ...s, studyMinutes: s.studyMinutes + mins })), [patch]);
  const toggleLab = useCallback((id: string) => patch((s) => ({
    ...s, labCompletions: s.labCompletions.includes(id) ? s.labCompletions.filter((x) => x !== id) : [...s.labCompletions, id],
  })), [patch]);
  const toggleChallenge = useCallback((id: string) => patch((s) => ({
    ...s, challengeSolves: s.challengeSolves.includes(id) ? s.challengeSolves.filter((x) => x !== id) : [...s.challengeSolves, id],
  })), [patch]);
  const setTutorMode = useCallback((key: string, mode: string) => patch((s) => ({ ...s, tutorModes: { ...s.tutorModes, [key]: mode } })), [patch]);
  const setToolMastery = useCallback((id: string, value: boolean) => patch((s) => ({ ...s, toolMastery: { ...s.toolMastery, [id]: value } })), [patch]);
  const togglePaper = useCallback((title: string) => patch((s) => ({
    ...s, papersRead: s.papersRead.includes(title) ? s.papersRead.filter((x) => x !== title) : [...s.papersRead, title],
  })), [patch]);
  const toggleCVE = useCallback((cve: string) => patch((s) => ({
    ...s, cvesReviewed: s.cvesReviewed.includes(cve) ? s.cvesReviewed.filter((x) => x !== cve) : [...s.cvesReviewed, cve],
  })), [patch]);
  const setName = useCallback((name: string) => patch((s) => ({ ...s, name })), [patch]);
  const reset = useCallback(() => patch(() => initial), [patch]);

  const isMastered = useCallback((id: number) => (state.quizScores[id] ?? 0) >= MASTERY_SCORE, [state.quizScores]);

  const stats = useMemo(() => {
    const list = chapters ?? [];
    const mastered = list.filter((c) => isMastered(c.id)).length;
    const completed = list.filter((c) => state.completed[c.id]).length;
    const scores = Object.values(state.quizScores);
    const practicalCount = state.labCompletions.length + state.challengeSolves.length;
    const levelBreakdown = (levels ?? []).map((l) => {
      const total = l.chapterIds.length;
      const m = l.chapterIds.filter((id) => isMastered(id)).length;
      const practicalRequired = Math.max(0, l.level - 1);
      const unlocked = pct(m, total) >= 60 && practicalCount >= practicalRequired;
      return { level: l.level, name: l.name, mastered: m, total, pct: pct(m, total), practicalRequired, practicalDone: practicalCount, unlocked };
    });
    let level = 1;
    for (const b of levelBreakdown) {
      if (b.total === 0) continue;
      if (b.unlocked) level = Math.min(10, b.level + 1);
      else break;
    }
    const current = levelBreakdown.find((b) => b.level === level);
    const domainScores: Record<string, number[]> = {};
    list.forEach((c) => {
      const score = state.quizScores[c.id];
      if (score === undefined) return;
      c.tags.forEach((tag) => (domainScores[tag] ??= []).push(score));
    });
    const ranked = Object.entries(domainScores)
      .filter(([, v]) => v.length >= 2)
      .map(([name, v]) => ({ name, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }))
      .sort((a, b) => b.avg - a.avg);
    const now = Date.now();
    const dueCards = Object.values(state.flashcardReviews).filter((r) => r.due <= now).length;
    return {
      mastered,
      completed,
      totalChapters: list.length,
      overallPct: pct(mastered, list.length),
      level,
      levelPct: current?.pct ?? 0,
      levelBreakdown,
      practicalCount,
      practicalRequired: Math.max(0, level - 1),
      quizAverage: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      quizzesTaken: scores.length,
      strongAreas: ranked.slice(0, 4).map((r) => r.name),
      weakAreas: ranked.slice(-4).reverse().map((r) => r.name),
      dueCards,
    };
  }, [chapters, levels, state, isMastered]);

  const value: ProgressContextValue = {
    state, ready, toggleComplete, setQuizScore, reviewCard, toggleBookmark, addNote, removeNote,
    addStudyMinutes, toggleLab, toggleChallenge, setTutorMode, setToolMastery, togglePaper,
    toggleCVE, setName, reset, isMastered, stats,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
