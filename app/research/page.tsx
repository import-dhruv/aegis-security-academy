'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, BookOpenText, Check, GraduationCap, Info, LibraryBig, ListFilter, Sparkles } from 'lucide-react';
import { useAllData } from '@/lib/data';
import type { Book, Course, GlossaryItem, Research } from '@/lib/types';
import { Badge, DifficultyBadge, EmptyState, ExternalLink, PageHeader, Panel, ProgressBar, SearchInput, StatCard } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { cn, pct } from '@/lib/utils';

type Tab = 'papers' | 'courses' | 'books' | 'glossary';

const READ_METHOD = [
  { title: 'Abstract and introduction', text: 'What problem does the paper address, and why does it matter?' },
  { title: 'Threat model', text: 'What assumptions are made about the attacker and the defender?' },
  { title: 'Design / mechanism', text: 'How does the proposed attack or defence actually work?' },
  { title: 'Evaluation', text: 'Which datasets, baselines and metrics are used — do the results support the claims?' },
  { title: 'Limitations', text: 'What do the authors themselves concede about the approach?' },
  { title: 'Reproducibility', text: 'Is there code, data or an artefact you can run to confirm the result?' },
  { title: 'Connections', text: 'How does this relate to other work and to your own research questions?' },
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
  const lower = q.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lower
          ? <mark key={i} className="rounded bg-mint-500/25 px-0.5 text-mint-200">{part}</mark>
          : part,
      )}
    </>
  );
}

function cleanText(s: string) {
  return s.replace(/\\&/g, '&').replace(/\*/g, '');
}

function PaperCard({ paper, read, onToggle }: { paper: Research; read: boolean; onToggle: () => void }) {
  return (
    <Panel hover className={cn('flex h-full flex-col p-5', read && 'border-mint-500/30')}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-slate-100">{paper.title}</h3>
        <button
          className={cn('btn-icon shrink-0', read && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
          title={read ? 'Mark as unread' : 'Mark as read'}
          aria-label={read ? 'Mark as unread' : 'Mark as read'}
          onClick={onToggle}
        >
          {read ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="cyan">{paper.authors}</Badge>
        <Badge>{paper.year}</Badge>
        <Badge tone="amber">{paper.category}</Badge>
        <DifficultyBadge value={paper.difficulty} />
      </div>
      <div className="mt-4 space-y-3 text-[13px] leading-relaxed">
        <p><span className="label mr-2">Problem</span><span className="text-slate-300">{paper.problem}</span></p>
        <p><span className="label mr-2">Contribution</span><span className="text-slate-300">{paper.contribution}</span></p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3 text-xs">
        {paper.url ? (
          <ExternalLink href={paper.url}>Read the paper</ExternalLink>
        ) : (
          <span className="text-muted">
            Source: {paper.source} · <span className="text-amber-300/90">verify the original source</span>
          </span>
        )}
        {read && <Badge tone="mint">Read</Badge>}
      </div>
    </Panel>
  );
}

function ResearchContent() {
  const { research, courses, books, glossary } = useAllData();
  const { state, togglePaper } = useProgress();

  const papers = useMemo(() => research.data ?? [], [research.data]);
  const courseList = useMemo(() => courses.data ?? [], [courses.data]);
  const bookList = useMemo(() => books.data ?? [], [books.data]);
  const glossaryList = useMemo(() => glossary.data ?? [], [glossary.data]);

  const [tab, setTab] = useState<Tab>('papers');
  const [paperQuery, setPaperQuery] = useState('');
  const [paperCategory, setPaperCategory] = useState('all');
  const [paperDifficulty, setPaperDifficulty] = useState('all');
  const [courseQuery, setCourseQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [glossaryLimit, setGlossaryLimit] = useState(80);

  const paperCategories = useMemo(() => Array.from(new Set(papers.map((p) => p.category))).sort(), [papers]);
  const paperDifficulties = useMemo(() => Array.from(new Set(papers.map((p) => p.difficulty))).sort(), [papers]);
  const readCount = state.papersRead.filter((t) => papers.some((p) => p.title === t)).length;

  const filteredPapers = useMemo(() => {
    const q = paperQuery.trim().toLowerCase();
    return papers.filter((p) => {
      if (q && ![p.title, p.authors, p.problem, p.contribution, p.category].some((f) => f.toLowerCase().includes(q))) return false;
      if (paperCategory !== 'all' && p.category !== paperCategory) return false;
      if (paperDifficulty !== 'all' && p.difficulty !== paperDifficulty) return false;
      return true;
    });
  }, [papers, paperQuery, paperCategory, paperDifficulty]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return courseList;
    return courseList.filter((c) => [c.platform, c.focus, c.prereqs, c.outcomes].some((f) => f.toLowerCase().includes(q)));
  }, [courseList, courseQuery]);

  const filteredBooks = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    if (!q) return bookList;
    return bookList.filter((b) => [b.title, b.author, b.focus, b.category].some((f) => f.toLowerCase().includes(q)));
  }, [bookList, bookQuery]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return glossaryList;
    return glossaryList.filter((g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q));
  }, [glossaryList, glossaryQuery]);

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'papers', label: 'Papers', count: papers.length, icon: <BookOpenText className="h-4 w-4" /> },
    { id: 'courses', label: 'Courses', count: courseList.length, icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'books', label: 'Books', count: bookList.length, icon: <BookOpen className="h-4 w-4" /> },
    { id: 'glossary', label: 'Glossary', count: glossaryList.length, icon: <LibraryBig className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Master study material · Chapter 33"
        title="Research & Academic Library"
        description="Papers, courses, books and a 554-term glossary — with a repeatable method for reading security research and verifying every citation."
        actions={<Badge tone="mint"><Sparkles className="h-3.5 w-3.5" /> {papers.length || 28} papers · {glossaryList.length || 554} terms</Badge>}
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title text-lg">How to read a security paper</h2>
              <p className="mt-1 text-xs text-muted">Seven steps from Chapter 33 — Security Research Papers.</p>
            </div>
            <Link href="/learn/chapter-33" className="link inline-flex shrink-0 items-center gap-1 text-xs">Chapter 33 <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {READ_METHOD.map((step, i) => (
              <li key={step.title} className="flex gap-2.5 rounded-lg border border-ink-800 bg-ink-850/60 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-mint-500/30 bg-mint-500/10 font-mono text-[11px] text-mint-300">{i + 1}</span>
                <div>
                  <div className="text-[12.5px] font-semibold text-slate-100">{step.title}</div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel className="p-5">
          <h2 className="section-title text-lg">Your reading tracker</h2>
          <p className="mt-1 text-xs text-muted">Mark papers as read to keep a local record of what you have studied.</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="stat-num text-mint-300">{readCount}<span className="text-lg text-muted"> / {papers.length}</span></div>
              <div className="label mt-1">Papers read</div>
            </div>
            <Badge tone="cyan">{pct(readCount, papers.length)}%</Badge>
          </div>
          <ProgressBar value={pct(readCount, papers.length)} className="mt-4" tone="mint" />
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-2.5"><div className="stat-num text-sm text-slate-100">{courseList.length}</div><div className="label mt-1">Courses</div></div>
            <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-2.5"><div className="stat-num text-sm text-slate-100">{bookList.length}</div><div className="label mt-1">Books</div></div>
            <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-2.5"><div className="stat-num text-sm text-slate-100">{glossaryList.length}</div><div className="label mt-1">Terms</div></div>
          </div>
          <div className="mt-5 flex items-start gap-2 border-t border-ink-800 pt-4 text-[11.5px] leading-relaxed text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            Titles, authors, years and venues should be verified against official sources (arXiv, ACM/IEEE DL, USENIX, publishers) before academic use. Where no confident URL exists, the source is shown as text — verify the original source.
          </div>
        </Panel>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-ink-800 pb-3" role="tablist" aria-label="Research library sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition',
              tab === t.id ? 'border-mint-500/40 bg-mint-500/10 text-mint-300' : 'border-ink-700 bg-ink-850 text-muted hover:border-ink-600 hover:text-slate-200',
            )}
          >
            {t.icon} {t.label} <span className="font-mono text-[11px] opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'papers' && (
        <div>
          <Panel className="mb-6 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_1.2fr_1fr]">
              <SearchInput value={paperQuery} onChange={setPaperQuery} placeholder="Search title, author, problem, contribution…" />
              <select className="input" value={paperCategory} onChange={(e) => setPaperCategory(e.target.value)} aria-label="Filter papers by category">
                <option value="all">All research areas</option>
                {paperCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" value={paperDifficulty} onChange={(e) => setPaperDifficulty(e.target.value)} aria-label="Filter papers by difficulty">
                <option value="all">All difficulties</option>
                {paperDifficulties.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>Showing <span className="font-mono text-mint-300">{filteredPapers.length}</span> of {papers.length} papers · {readCount} read</span>
              {(paperQuery || paperCategory !== 'all' || paperDifficulty !== 'all') && (
                <button className="link text-xs" onClick={() => { setPaperQuery(''); setPaperCategory('all'); setPaperDifficulty('all'); }}>Clear filters</button>
              )}
            </div>
          </Panel>
          {research.loading ? (
            <Panel className="p-10 text-center text-sm text-muted">Loading papers…</Panel>
          ) : filteredPapers.length === 0 ? (
            <EmptyState title="No papers match these filters" description="Try another research area or a broader search." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPapers.map((p) => (
                <PaperCard
                  key={p.title}
                  paper={p}
                  read={state.papersRead.includes(p.title)}
                  onToggle={() => togglePaper(p.title)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'courses' && (
        <div>
          <Panel className="mb-6 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput value={courseQuery} onChange={setCourseQuery} placeholder="Search platform, focus, prerequisites…" className="max-w-xl flex-1" />
              <span className="text-xs text-muted">{filteredCourses.length} of {courseList.length} courses</span>
            </div>
          </Panel>
          {courses.loading ? (
            <Panel className="p-10 text-center text-sm text-muted">Loading courses…</Panel>
          ) : filteredCourses.length === 0 ? (
            <EmptyState title="No courses found" description="Try a different search term." />
          ) : (
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
                    <th className="px-4 py-3 font-semibold">Platform</th>
                    <th className="px-4 py-3 font-semibold">Cost</th>
                    <th className="px-4 py-3 font-semibold">Focus</th>
                    <th className="px-4 py-3 font-semibold">Prerequisites</th>
                    <th className="px-4 py-3 font-semibold">Outcomes</th>
                    <th className="px-4 py-3 font-semibold">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((c: Course) => (
                    <tr key={`${c.platform}-${c.focus}`} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/40">
                      <td className="px-4 py-3 font-medium text-slate-100">{c.platform}</td>
                      <td className="px-4 py-3"><Badge tone={c.cost.toLowerCase().includes('free') ? 'mint' : 'amber'}>{c.cost}</Badge></td>
                      <td className="px-4 py-3 text-slate-300">{c.focus}</td>
                      <td className="px-4 py-3 text-muted">{c.prereqs}</td>
                      <td className="px-4 py-3 text-slate-300">{c.outcomes}</td>
                      <td className="px-4 py-3">
                        {c.url ? <ExternalLink href={c.url}>Visit</ExternalLink> : <span className="text-xs text-muted">{c.source}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
          <p className="mt-4 text-xs text-muted">Costs, availability and curricula change — confirm current details on the provider&apos;s site before enrolling.</p>
        </div>
      )}

      {tab === 'books' && (
        <div>
          <Panel className="mb-6 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput value={bookQuery} onChange={setBookQuery} placeholder="Search title, author, focus, category…" className="max-w-xl flex-1" />
              <span className="text-xs text-muted">{filteredBooks.length} of {bookList.length} books</span>
            </div>
          </Panel>
          {books.loading ? (
            <Panel className="p-10 text-center text-sm text-muted">Loading books…</Panel>
          ) : filteredBooks.length === 0 ? (
            <EmptyState title="No books found" description="Try a different search term." />
          ) : (
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Author</th>
                    <th className="px-4 py-3 font-semibold">Focus</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b: Book, i: number) => (
                    <tr key={`${b.title}-${i}`} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/40">
                      <td className="px-4 py-3 font-medium text-slate-100">{cleanText(b.title)}</td>
                      <td className="px-4 py-3 text-slate-300">{cleanText(b.author)}</td>
                      <td className="px-4 py-3"><DifficultyBadge value={b.focus} /></td>
                      <td className="px-4 py-3 text-muted">{b.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      )}

      {tab === 'glossary' && (
        <div>
          <Panel className="mb-6 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput value={glossaryQuery} onChange={(v) => { setGlossaryQuery(v); setGlossaryLimit(80); }} placeholder="Search 554 terms and definitions…" className="max-w-2xl flex-1" />
              <span className="text-xs text-muted"><ListFilter className="mr-1 inline h-3.5 w-3.5" />{filteredGlossary.length} matching terms</span>
            </div>
          </Panel>
          {glossary.loading ? (
            <Panel className="p-10 text-center text-sm text-muted">Loading glossary…</Panel>
          ) : filteredGlossary.length === 0 ? (
            <EmptyState title="No glossary terms found" description="Try a shorter term or a different keyword." />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredGlossary.slice(0, glossaryLimit).map((g: GlossaryItem, i: number) => (
                  <Panel key={`${g.term}-${i}`} hover className="p-4">
                    <h3 className="text-[13px] font-semibold text-mint-300"><Highlight text={g.term} query={glossaryQuery} /></h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted"><Highlight text={g.definition} query={glossaryQuery} /></p>
                  </Panel>
                ))}
              </div>
              {glossaryLimit < filteredGlossary.length && (
                <div className="mt-6 text-center">
                  <button className="btn-ghost" onClick={() => setGlossaryLimit((n) => n + 120)}>
                    Show more <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-2 text-xs text-muted">Showing {Math.min(glossaryLimit, filteredGlossary.length)} of {filteredGlossary.length}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  return <ResearchContent />;
}
