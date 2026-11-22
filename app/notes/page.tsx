'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BookOpenText,
  Bookmark,
  FlaskConical,
  Layers3,
  NotebookPen,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useData } from '@/lib/data';
import { useProgress } from '@/components/providers';
import { Badge, EmptyState, ExternalLink, Panel, PageHeader, SearchInput } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Chapter } from '@/lib/types';

type Tab = 'notes' | 'bookmarks';

type RefLink = { href: string | null; label: string };

function bookmarkLink(ref: string): { group: string; icon: React.ReactNode; href: string; label: string } {
  const separator = ref.indexOf(':');
  const prefix = separator >= 0 ? ref.slice(0, separator).toLowerCase() : 'other';
  const value = separator >= 0 ? ref.slice(separator + 1) : ref;
  if (prefix === 'chapter') return { group: 'Chapters', icon: <BookOpenText className="h-4 w-4" />, href: `/learn/${value}`, label: value };
  if (prefix === 'tool') return { group: 'Tools', icon: <Wrench className="h-4 w-4" />, href: `/tools?tool=${encodeURIComponent(value)}`, label: value };
  if (prefix === 'lab') return { group: 'Labs', icon: <FlaskConical className="h-4 w-4" />, href: '/labs', label: value };
  if (prefix === 'cve') return { group: 'Vulnerabilities', icon: <ShieldAlert className="h-4 w-4" />, href: '/vulnerabilities', label: value };
  return { group: 'Other', icon: <Bookmark className="h-4 w-4" />, href: '/notes', label: ref };
}

export default function NotesPage() {
  const { state, ready, addNote, removeNote, toggleBookmark } = useProgress();
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const [tab, setTab] = useState<Tab>('notes');
  const [body, setBody] = useState('');
  const [ref, setRef] = useState('');
  const [query, setQuery] = useState('');

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...state.notes].sort((a, b) => b.createdAt - a.createdAt);
    return q ? list.filter((n) => `${n.body} ${n.ref}`.toLowerCase().includes(q)) : list;
  }, [state.notes, query]);

  const groupedBookmarks = useMemo(() => {
    const grouped: Record<string, { ref: string; link: ReturnType<typeof bookmarkLink> }[]> = {};
    state.bookmarks.forEach((ref) => {
      const link = bookmarkLink(ref);
      (grouped[link.group] ??= []).push({ ref, link });
    });
    return Object.entries(grouped);
  }, [state.bookmarks]);

  const resolveRef = (raw: string): RefLink => {
    const value = raw.trim();
    if (!value) return { href: null, label: 'Unattached note' };
    const separator = value.indexOf(':');
    const prefix = separator >= 0 ? value.slice(0, separator).toLowerCase() : '';
    const rest = separator >= 0 ? value.slice(separator + 1) : value;
    if (prefix === 'chapter') return { href: `/learn/${rest}`, label: rest };
    if (prefix === 'tool') return { href: `/tools?tool=${encodeURIComponent(rest)}`, label: rest };
    if (prefix === 'lab') return { href: '/labs', label: rest };
    if (prefix === 'cve') return { href: '/vulnerabilities', label: rest };
    if (/^https?:\/\//i.test(value)) return { href: value, label: value.replace(/^https?:\/\//, '').slice(0, 48) };
    const chapter = chapters?.find((c) => c.slug === value || c.title.toLowerCase() === value.toLowerCase());
    if (chapter) return { href: `/learn/${chapter.slug}`, label: chapter.title };
    return { href: null, label: value };
  };

  const save = () => {
    if (!body.trim()) return;
    addNote(body.trim(), ref.trim());
    setBody('');
  };

  if (!ready) {
    return (
      <div className="space-y-5 py-6">
        <div className="h-24 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />
        <div className="h-72 animate-pulse rounded-xl border border-ink-800 bg-ink-850/60" />
        <p className="pt-2 text-center text-xs text-muted">Opening your workspace…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-10">
      <PageHeader
        eyebrow="Workspace"
        title="Notes & bookmarks"
        description="Capture what you learn and keep quick access to the chapters, tools, labs and vulnerabilities you want to revisit. Both are stored locally in this browser."
        actions={
          <div className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-1">
            <button
              type="button"
              onClick={() => setTab('notes')}
              className={cn('btn px-3 py-1.5 text-xs', tab === 'notes' ? 'bg-mint-500 text-ink-950' : 'text-muted hover:text-slate-100')}
            >
              <NotebookPen className="h-3.5 w-3.5" /> Notes <span className="opacity-70">{state.notes.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('bookmarks')}
              className={cn('btn px-3 py-1.5 text-xs', tab === 'bookmarks' ? 'bg-mint-500 text-ink-950' : 'text-muted hover:text-slate-100')}
            >
              <Bookmark className="h-3.5 w-3.5" /> Bookmarks <span className="opacity-70">{state.bookmarks.length}</span>
            </button>
          </div>
        }
      />

      {tab === 'notes' ? (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* ---------- Composer ---------- */}
          <div>
            <Panel className="p-5">
              <div className="mb-4 flex items-center gap-2 text-mint-300">
                <Plus className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-slate-100">New note</h2>
              </div>
              <label className="label mb-2 block" htmlFor="note-body">Your note</label>
              <textarea
                id="note-body"
                className="input min-h-[160px] resize-y leading-relaxed"
                placeholder="Write down a command, an insight, a question to revisit…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="mt-1 text-right font-mono text-[10px] text-muted">{body.length} characters</div>

              <label className="label mb-2 mt-4 block" htmlFor="note-ref">Attach to <span className="normal-case tracking-normal text-muted">(optional)</span></label>
              <input
                id="note-ref"
                className="input"
                list="note-ref-suggestions"
                placeholder="chapter-08, Burp Suite, a URL…"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
              <datalist id="note-ref-suggestions">
                {(chapters ?? []).map((c) => <option key={c.id} value={c.slug}>{c.title}</option>)}
              </datalist>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Use a chapter slug, a <code className="font-mono text-mint-300">tool:</code> / <code className="font-mono text-mint-300">lab:</code> / <code className="font-mono text-mint-300">cve:</code> prefix, or a chapter title. Recognised references become links.
              </p>
              <button type="button" className="btn-primary mt-4 w-full" disabled={!body.trim()} onClick={save}>
                <Save className="h-4 w-4" /> Save note
              </button>
            </Panel>
            <Panel className="mt-4 p-5">
              <div className="label mb-3">Quick links</div>
              <div className="space-y-2 text-xs">
                <Link href="/learn/chapter-01" className="flex items-center gap-2 text-muted transition hover:text-mint-300"><BookOpenText className="h-3.5 w-3.5" /> Start with chapter 01</Link>
                <Link href="/tools" className="flex items-center gap-2 text-muted transition hover:text-mint-300"><Wrench className="h-3.5 w-3.5" /> Browse the tool encyclopedia</Link>
                <Link href="/labs" className="flex items-center gap-2 text-muted transition hover:text-mint-300"><FlaskConical className="h-3.5 w-3.5" /> Find a practice lab</Link>
              </div>
            </Panel>
          </div>

          {/* ---------- Note list ---------- */}
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">Saved notes</h2>
                <p className="mt-1 text-xs text-muted">Newest first. Notes stay on this device.</p>
              </div>
              <SearchInput value={query} onChange={setQuery} placeholder="Search notes…" className="w-full sm:w-64" />
            </div>

            {notes.length === 0 ? (
              <EmptyState
                title={query ? 'No notes match your search' : 'No notes yet'}
                description={query ? 'Try a different word or clear the search field.' : 'Use the composer to capture an insight from a chapter, then attach it to the source so it is easy to find again.'}
                action={state.notes.length > 0 ? (
                  <button type="button" className="btn-ghost" onClick={() => setQuery('')}>Clear search</button>
                ) : (
                  <Link href="/schools" className="btn-ghost">Go read a chapter</Link>
                )}
              />
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const link = resolveRef(note.ref);
                  const when = new Date(note.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                  return (
                    <Panel key={note.id} className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-slate-200">{note.body}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {link.href ? (
                              <ExternalLink href={link.href} className="chip !text-mint-300"><Bookmark className="h-3 w-3" /> {link.label}</ExternalLink>
                            ) : note.ref ? (
                              <span className="chip">{link.label}</span>
                            ) : (
                              <span className="chip">Unattached</span>
                            )}
                            <span className="text-[11px] text-muted">{when}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-icon shrink-0 hover:border-rose-500/40 hover:text-rose-300"
                          aria-label="Delete note"
                          title="Delete note"
                          onClick={() => removeNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
            {state.notes.length > 0 && (
              <p className="mt-4 text-[11px] text-muted">Showing {notes.length} of {state.notes.length} notes.</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Saved bookmarks</h2>
              <p className="mt-1 text-xs text-muted">Grouped by source. Remove a bookmark to take it off this list.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/schools" className="chip hover:text-mint-300"><BookOpenText className="h-3 w-3" /> Chapters</Link>
              <Link href="/tools" className="chip hover:text-mint-300"><Wrench className="h-3 w-3" /> Tools</Link>
              <Link href="/labs" className="chip hover:text-mint-300"><FlaskConical className="h-3 w-3" /> Labs</Link>
              <Link href="/vulnerabilities" className="chip hover:text-mint-300"><ShieldAlert className="h-3 w-3" /> CVEs</Link>
            </div>
          </div>

          {groupedBookmarks.length === 0 ? (
            <EmptyState
              title="Nothing bookmarked yet"
              description="Star a chapter from its reading page, or bookmark a tool, lab or CVE, and everything you save will collect here."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/schools" className="btn-primary">Browse chapters</Link>
                  <Link href="/tools" className="btn-ghost">Explore tools</Link>
                </div>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {groupedBookmarks.map(([group, items]) => (
                <Panel key={group} className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100">{group}</h3>
                    <Badge tone="cyan">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map(({ ref, link }) => (
                      <div key={ref} className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-900/50 px-3 py-2.5">
                        <span className="shrink-0 text-muted">{link.icon}</span>
                        <Link href={link.href} className="min-w-0 flex-1 truncate text-[13px] text-slate-200 transition hover:text-mint-300">{link.label}</Link>
                        <button
                          type="button"
                          className="btn-icon h-7 w-7 shrink-0 hover:border-rose-500/40 hover:text-rose-300"
                          title="Remove bookmark"
                          aria-label={`Remove bookmark ${link.label}`}
                          onClick={() => toggleBookmark(ref)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          )}
          <p className="mt-5 flex items-center gap-2 text-[11px] text-muted"><Layers3 className="h-3 w-3" /> Bookmarks are plain references stored locally, so they keep working even if the underlying content changes.</p>
        </div>
      )}
    </div>
  );
}
