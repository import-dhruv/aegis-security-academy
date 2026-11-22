'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  Bookmark,
  Check,
  Download,
  FlaskConical,
  HardDrive,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useData } from '@/lib/data';
import { useProgress } from '@/components/providers';
import { Badge, EmptyState, KV, Panel, PageHeader } from '@/components/ui';
import { cn, formatMinutes, levelName } from '@/lib/utils';
import type { Chapter, CVE, Lab, Tool } from '@/lib/types';

const TUTOR_MODES = [
  { value: 'concise', label: 'Concise', detail: 'Short, direct answers with the key facts first.' },
  { value: 'balanced', label: 'Balanced', detail: 'Clear explanation with an example and caveats.' },
  { value: 'detailed', label: 'Deep dive', detail: 'First principles, mechanisms and further reading.' },
] as const;

type BookmarkLink = { group: string; label: string; href: string; icon: React.ReactNode };

export default function ProfilePage() {
  const { state, ready, stats, setName, reset, setTutorMode } = useProgress();
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { data: tools } = useData<Tool[]>('tools.json');
  const { data: labs } = useData<Lab[]>('labs.json');
  const { data: cves } = useData<CVE[]>('cves.json');

  const [nameDraft, setNameDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const [armedReset, setArmedReset] = useState(false);

  useEffect(() => setNameDraft(state.name), [state.name]);
  useEffect(() => {
    if (!armedReset) return;
    const t = setTimeout(() => setArmedReset(false), 5000);
    return () => clearTimeout(t);
  }, [armedReset]);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const tutorMode = state.tutorModes['global'] ?? 'balanced';

  const bookmarkLinks = useMemo<BookmarkLink[]>(() => {
    return state.bookmarks.map((ref) => {
      const separator = ref.indexOf(':');
      const prefix = separator >= 0 ? ref.slice(0, separator) : 'other';
      const value = separator >= 0 ? ref.slice(separator + 1) : ref;
      if (prefix === 'chapter') {
        const chapter = chapters?.find((c) => c.slug === value || String(c.id) === value);
        return {
          group: 'Chapters',
          label: chapter ? `${chapter.number}. ${chapter.title}` : value,
          href: `/learn/${value}`,
          icon: <BookOpenText className="h-4 w-4" />,
        };
      }
      if (prefix === 'tool') {
        const tool = tools?.find((t) => t.id === value);
        return {
          group: 'Tools',
          label: tool ? tool.name : value,
          href: `/tools?tool=${encodeURIComponent(value)}`,
          icon: <Wrench className="h-4 w-4" />,
        };
      }
      if (prefix === 'lab') {
        const lab = labs?.find((l) => l.id === value);
        return { group: 'Labs', label: lab ? lab.title : value, href: '/labs', icon: <FlaskConical className="h-4 w-4" /> };
      }
      if (prefix === 'cve' || prefix.toLowerCase() === 'cve') {
        const cve = cves?.find((c) => c.cve.toLowerCase() === value.toLowerCase());
        return {
          group: 'Vulnerabilities',
          label: cve ? `${cve.cve} · ${cve.name}` : value,
          href: '/vulnerabilities',
          icon: <ShieldAlert className="h-4 w-4" />,
        };
      }
      return { group: 'Other', label: ref, href: '/notes', icon: <Bookmark className="h-4 w-4" /> };
    });
  }, [state.bookmarks, chapters, tools, labs, cves]);

  const bookmarkGroups = useMemo(() => {
    const grouped: Record<string, BookmarkLink[]> = {};
    bookmarkLinks.forEach((link) => (grouped[link.group] ??= []).push(link));
    return Object.entries(grouped);
  }, [bookmarkLinks]);

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (!armedReset) {
      setArmedReset(true);
      return;
    }
    reset();
    setNameDraft('Researcher');
    setArmedReset(false);
  };

  if (!ready) {
    return (
      <div className="space-y-5 py-6">
        <div className="h-24 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-56 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />)}
        </div>
        <p className="pt-2 text-center text-xs text-muted">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-10">
      <PageHeader
        eyebrow="Account"
        title="Profile & settings"
        description="Your identity, Preferences and data controls for AEGIS. Everything here is local to this browser — there is no account to sign in to."
        actions={<Badge tone="mint"><ShieldCheck className="h-3 w-3" /> Local-first</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          {/* ---------- Display name ---------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg border border-mint-500/25 bg-mint-500/10 p-2 text-mint-300"><UserRound className="h-5 w-5" /></div>
              <div>
                <h2 className="section-title">Display name</h2>
                <p className="mt-0.5 text-xs text-muted">Used in the dashboard greeting and across your workspace.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input flex-1"
                value={nameDraft}
                maxLength={48}
                placeholder="Your researcher name"
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameDraft.trim()) {
                    setName(nameDraft.trim());
                    setSaved(true);
                  }
                }}
                aria-label="Display name"
              />
              <button
                type="button"
                className="btn-primary"
                disabled={!nameDraft.trim() || nameDraft.trim() === state.name}
                onClick={() => { setName(nameDraft.trim()); setSaved(true); }}
              >
                <Save className="h-4 w-4" /> Save name
              </button>
            </div>
            <div className="mt-2 h-4 text-xs text-mint-400">{saved && <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Saved.</span>}</div>
          </Panel>

          {/* ---------- Tutor preference ---------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg border border-cyanx-500/25 bg-cyanx-500/10 p-2 text-cyanx-300"><Sparkles className="h-5 w-5" /></div>
              <div>
                <h2 className="section-title">Tutor explanation mode</h2>
                <p className="mt-0.5 text-xs text-muted">A global default for how the AI tutor frames its answers.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {TUTOR_MODES.map((mode) => {
                const active = tutorMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTutorMode('global', mode.value)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition',
                      active ? 'border-mint-500/50 bg-mint-500/[0.07]' : 'border-ink-700 bg-ink-900/50 hover:border-ink-600',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100">{mode.label}</span>
                      {active && <Check className="h-4 w-4 text-mint-400" />}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{mode.detail}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Stored as <code className="rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 font-mono text-mint-300">tutorModes.global = &quot;{tutorMode}&quot;</code>. Chapter-specific tutor preferences, if set, take precedence.
            </p>
          </Panel>

          {/* ---------- Bookmarks ---------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">Bookmarks</h2>
                <p className="mt-0.5 text-xs text-muted">Everything you have starred, grouped by source.</p>
              </div>
              <Badge tone="cyan">{state.bookmarks.length} saved</Badge>
            </div>
            {bookmarkGroups.length === 0 ? (
              <EmptyState
                title="No bookmarks yet"
                description="Star a chapter while reading, or bookmark a tool or lab, and it will appear here for quick access."
                action={<Link href="/schools" className="btn-ghost">Browse chapters</Link>}
              />
            ) : (
              <div className="space-y-5">
                {bookmarkGroups.map(([group, links]) => (
                  <div key={group}>
                    <div className="label mb-2">{group}</div>
                    <div className="space-y-1.5">
                      {links.map((link, i) => (
                        <Link key={`${link.href}-${link.label}-${i}`} href={link.href} className="panel panel-hover flex items-center gap-3 p-3">
                          <span className="text-muted">{link.icon}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{link.label}</span>
                          <span className="font-mono text-[10px] text-muted">{link.href}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {/* ---------- Stats summary ---------- */}
          <Panel className="p-5 md:p-6">
            <h2 className="section-title">Progress summary</h2>
            <p className="mt-1 text-xs text-muted">Read-only values mirrored from your local progress record.</p>
            <div className="mt-4">
              <KV k="Level" v={`L${stats.level} · ${levelName(stats.level)}`} />
              <KV k="Overall mastery" v={`${stats.overallPct}%`} />
              <KV k="Chapters" v={`${stats.mastered} mastered · ${stats.completed} read of ${stats.totalChapters}`} />
              <KV k="Quizzes" v={`${stats.quizzesTaken} taken · ${stats.quizAverage}% average`} />
              <KV k="Study time" v={formatMinutes(state.studyMinutes)} />
              <KV k="Streak" v={`${state.streak} days`} />
              <KV k="Labs / challenges" v={`${state.labCompletions.length} · ${state.challengeSolves.length}`} />
              <KV k="Notes / bookmarks" v={`${state.notes.length} · ${state.bookmarks.length}`} />
              <KV k="Due flashcards" v={stats.dueCards} />
            </div>
          </Panel>

          {/* ---------- Storage / privacy ---------- */}
          <Panel className="p-5 md:p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg border border-cyanx-500/25 bg-cyanx-500/10 p-2 text-cyanx-300"><HardDrive className="h-5 w-5" /></div>
              <h2 className="section-title">Local-first storage</h2>
            </div>
            <p className="text-[13px] leading-relaxed text-muted">
              Your progress — completed chapters, quiz scores, flashcard scheduling, notes, bookmarks and preferences — lives in this browser&apos;s <code className="rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 font-mono text-mint-300">localStorage</code> under the key <code className="rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 font-mono text-mint-300">aegis-progress-v1</code>.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              There is no account, no sync and no analytics upload in local mode. <span className="text-mint-300">No data leaves your browser.</span> Clearing site data resets everything, so export a backup if you want to keep it.
            </p>
            <button type="button" className="btn-ghost mt-5 w-full" onClick={exportProgress}>
              <Download className="h-4 w-4" /> Export progress as JSON
            </button>
          </Panel>

          {/* ---------- Danger zone ---------- */}
          <Panel className="border-rose-500/20 p-5 md:p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2 text-rose-300"><AlertTriangle className="h-5 w-5" /></div>
              <h2 className="section-title">Reset progress</h2>
            </div>
            <p className="text-[13px] leading-relaxed text-muted">
              Permanently erase all locally stored progress: mastery, scores, notes, bookmarks, labs, challenges and settings. This cannot be undone — export a backup first.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                'mt-5 w-full',
                armedReset
                  ? 'btn bg-rose-500 text-white hover:bg-rose-400'
                  : 'btn border border-rose-500/30 bg-rose-500/5 text-rose-300 hover:bg-rose-500/15',
              )}
            >
              <RotateCcw className="h-4 w-4" />
              {armedReset ? 'Click again within 5s to confirm' : 'Reset all progress'}
            </button>
            {armedReset && <p className="mt-2 text-center text-[11px] text-rose-300">Armed — a second click will wipe local data. Disarmed automatically after 5 seconds.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
