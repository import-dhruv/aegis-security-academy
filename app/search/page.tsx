'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { useAllData } from '@/lib/data';
import { Badge, EmptyState, PageHeader, Panel, SearchInput } from '@/components/ui';
import { cn } from '@/lib/utils';

type Result = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
  content: string;
  external: boolean;
};

const GROUP_ORDER = ['Chapter', 'Term', 'Question', 'Tool', 'CVE', 'Paper', 'Case study', 'Lab', 'Project', 'Course', 'Book'];
const TONE: Record<string, 'default' | 'mint' | 'cyan' | 'rose' | 'amber'> = {
  Chapter: 'mint', Term: 'amber', Question: 'cyan', Tool: 'cyan', CVE: 'rose',
  Paper: 'default', 'Case study': 'rose', Lab: 'mint', Project: 'default', Course: 'cyan', Book: 'amber',
};

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  const nodes: React.ReactNode[] = [];
  let from = 0;
  let found = lower.indexOf(needle);
  while (found !== -1) {
    if (found > from) nodes.push(text.slice(from, found));
    nodes.push(<mark key={`${found}-${nodes.length}`} className="rounded bg-mint-500/20 px-0.5 text-mint-200">{text.slice(found, found + needle.length)}</mark>);
    from = found + needle.length;
    found = lower.indexOf(needle, from);
  }
  nodes.push(text.slice(from));
  return <>{nodes}</>;
}

function snippet(text: string, term: string, max = 190) {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!term) return clean.slice(0, max) + (clean.length > max ? '…' : '');
  const i = clean.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return clean.slice(0, max) + (clean.length > max ? '…' : '');
  const start = Math.max(0, i - 55);
  const end = Math.min(clean.length, start + max);
  return `${start ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
}

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get('q') ?? searchParams.get('term') ?? '';
  const term = raw.trim();
  const [input, setInput] = useState(raw);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());

  useEffect(() => { setInput(raw); }, [raw]);

  const all = useAllData();

  const index = useMemo<Result[]>(() => {
    const r: Result[] = [];
    (all.chapters.data ?? []).forEach((c) => r.push({
      id: `chapter-${c.id}`, type: 'Chapter', title: c.title,
      subtitle: `Chapter ${c.number} · ${c.part}`, href: `/learn/${c.slug}`,
      content: `${c.description} ${c.tags.join(' ')}`, external: false,
    }));
    (all.glossary.data ?? []).forEach((g) => r.push({
      id: `term-${g.term}`, type: 'Term', title: g.term, subtitle: 'Glossary definition',
      href: `/search?term=${encodeURIComponent(g.term)}`, content: g.definition, external: false,
    }));
    // Questions are capped for search performance; the full bank has its own search.
    (all.questions.data ?? []).slice(0, 300).forEach((q) => r.push({
      id: `question-${q.id}`, type: 'Question', title: q.question, subtitle: `${q.domain} · bank #${q.id}`,
      href: `/assessments/bank?q=${encodeURIComponent(q.question.slice(0, 80))}`,
      content: q.answer, external: false,
    }));
    (all.tools.data ?? []).forEach((t) => r.push({
      id: `tool-${t.id}`, type: 'Tool', title: t.name, subtitle: `${t.category} · ${t.level}`,
      href: `/tools?tool=${encodeURIComponent(t.id)}`, content: `${t.purpose} ${t.alt} ${t.cmd}`, external: false,
    }));
    (all.cves.data ?? []).forEach((c) => r.push({
      id: `cve-${c.cve}`, type: 'CVE', title: `${c.cve} — ${c.name}`, subtitle: `${c.severity} · ${c.year} · ${c.software}`,
      href: `/vulnerabilities?cve=${encodeURIComponent(c.cve)}`, content: `${c.rootCause} ${c.impact} ${c.mitigation}`, external: false,
    }));
    (all.research.data ?? []).forEach((p, i) => {
      if (!p.url) return;
      r.push({
        id: `paper-${i}`, type: 'Paper', title: p.title, subtitle: `${p.authors} · ${p.year} · ${p.category}`,
        href: p.url, content: `${p.problem} ${p.contribution}`, external: true,
      });
    });
    (all.reports.data ?? []).forEach((p) => r.push({
      id: `case-${p.id}`, type: 'Case study', title: p.title, subtitle: `${p.cls} · ${p.severity} · ${p.cwe}`,
      href: `/case-studies?case=${encodeURIComponent(p.id)}`, content: `${p.summary} ${p.impact}`, external: false,
    }));
    (all.labs.data ?? []).forEach((l) => {
      const external = /^https?:\/\//i.test(l.url);
      r.push({
        id: `lab-${l.id}`, type: 'Lab', title: l.title, subtitle: `${l.provider} · ${l.difficulty}`,
        href: l.url, content: `${l.skills.join(' ')} ${l.note}`, external,
      });
    });
    (all.projects.data ?? []).forEach((p) => r.push({
      id: `project-${p.id}`, type: 'Project', title: p.name, subtitle: `Project · ${p.stack}`,
      href: `/projects?p=${encodeURIComponent(p.id)}`, content: `${p.problem} ${p.objectives}`, external: false,
    }));
    (all.courses.data ?? []).forEach((c, i) => {
      if (!c.url) return;
      r.push({
        id: `course-${i}`, type: 'Course', title: c.platform, subtitle: `${c.cost} · ${c.focus}`,
        href: c.url, content: c.outcomes, external: true,
      });
    });
    (all.books.data ?? []).forEach((b, i) => r.push({
      id: `book-${i}`, type: 'Book', title: b.title, subtitle: `${b.author} · ${b.category}`,
      href: '/roadmap', content: `${b.focus} ${b.category}`, external: false,
    }));
    return r;
  }, [
    all.chapters.data, all.glossary.data, all.questions.data, all.tools.data, all.cves.data,
    all.research.data, all.reports.data, all.labs.data, all.projects.data, all.courses.data, all.books.data,
  ]);

  const matches = useMemo(() => {
    const needle = term.toLowerCase();
    if (!needle) return [];
    return index.filter((r) => `${r.title} ${r.subtitle} ${r.content}`.toLowerCase().includes(needle));
  }, [index, term]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    matches.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1; });
    return counts;
  }, [matches]);

  const results = useMemo(
    () => (activeTypes.size ? matches.filter((r) => activeTypes.has(r.type)) : matches),
    [matches, activeTypes],
  );

  const groups = useMemo(() => GROUP_ORDER
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0), [results]);

  const toggleType = (type: string) => setActiveTypes((prev) => {
    const next = new Set(prev);
    if (next.has(type)) next.delete(type); else next.add(type);
    return next;
  });

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  };

  const loading = [all.chapters, all.glossary, all.questions, all.tools, all.cves, all.research, all.reports, all.labs, all.projects, all.courses, all.books]
    .some((v) => v.loading);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Global search"
        title={term ? `Results for “${term}”` : 'Search the academy'}
        description="One index across chapters, glossary terms, the question bank, tools, CVEs, papers, case studies, labs, projects, courses and books."
      />

      <form onSubmit={go} className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={input} onChange={setInput} placeholder="Search chapters, terms, tools, CVEs…" className="flex-1" />
        <button className="btn-primary" type="submit"><Search className="h-4 w-4" /> Search</button>
      </form>

      {!term ? (
        <div className="mt-6">
          <EmptyState
            title="Enter a term to search"
            description="Try a concept, tool name, CVE identifier or a phrase from a question. Press Enter to see grouped results."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {['SQL injection', 'XSS', 'TLS', 'OAuth', 'prompt injection', 'IAM'].map((s) => (
                  <button key={s} className="chip transition hover:border-mint-500/40 hover:text-mint-300" onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}>{s}</button>
                ))}
              </div>
            }
          />
          <p className="mt-4 text-center text-xs text-muted">{index.length.toLocaleString()} items indexed{loading ? ' (still loading…)' : ''} · questions limited to the first 300 for performance; use the bank for the full 1,000.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTypes(new Set())}
              className={cn('chip transition', activeTypes.size === 0 && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
            >
              All types <span className="font-mono text-[10px] opacity-70">{matches.length}</span>
            </button>
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn('chip transition', activeTypes.has(type) && 'border-mint-500/40 bg-mint-500/10 text-mint-300')}
              >
                {type} <span className="font-mono text-[10px] opacity-70">{count}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{results.length} result{results.length === 1 ? '' : 's'} across {groups.length} type{groups.length === 1 ? '' : 's'}{loading ? ' · indexing more sources…' : ''}</span>
            <span>Questions are capped at 300 here — search all 1,000 in the <Link href="/assessments/bank" className="link">question bank</Link>.</span>
          </div>

          {results.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No matches found"
                description={`Nothing in the index matched “${term}”. Try a broader term, clear the type filters, or search the full question bank.`}
                action={<div className="flex gap-3"><button className="btn-ghost" onClick={() => setActiveTypes(new Set())}>Clear type filters</button><Link href="/assessments/bank" className="btn-primary">Question bank <ArrowRight className="h-4 w-4" /></Link></div>}
              />
            </div>
          ) : (
            <div className="mt-5 space-y-8">
              {groups.map((group) => (
                <section key={group.type}>
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="section-title">{group.type}</h2>
                    <Badge tone={TONE[group.type] ?? 'default'}>{group.items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((r) => {
                      const body = (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={TONE[r.type] ?? 'default'}>{r.type}</Badge>
                            <span className="text-[11px] text-muted">{r.subtitle}</span>
                          </div>
                          <div className="mt-2 text-sm font-medium text-slate-100"><Highlight text={r.title} term={term} /></div>
                          <div className="mt-1.5 text-xs leading-relaxed text-muted"><Highlight text={snippet(r.content, term)} term={term} /></div>
                        </>
                      );
                      const cls = 'panel panel-hover block p-4';
                      return r.external ? (
                        <a key={r.id} href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
                          <div className="relative">
                            {body}
                            <ArrowUpRight className="absolute right-0 top-0 h-4 w-4 text-ink-500" />
                          </div>
                        </a>
                      ) : (
                        <Link key={r.id} href={r.href} className={cls}>
                          <div className="relative">
                            {body}
                            <ArrowRight className="absolute right-0 top-0 h-4 w-4 text-ink-500" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <Panel className="mt-10 p-4 text-xs leading-relaxed text-muted">
        Glossary terms link back here so you can see every context in which they appear. External papers, courses and labs open in a new tab. Nothing in this search index is fetched from a third party at runtime — it is built entirely from the academy’s local data files.
      </Panel>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted">Building the search index…</div>}>
      <SearchInner />
    </Suspense>
  );
}
