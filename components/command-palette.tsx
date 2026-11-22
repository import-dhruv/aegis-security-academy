'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { useAllData } from '@/lib/data';
import { cn } from '@/lib/utils';

type Result = { title: string; subtitle: string; href: string; type: string; keywords: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const all = useAllData();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? onClose() : null;
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const index = useMemo<Result[]>(() => {
    const r: Result[] = [];
    (all.chapters.data ?? []).forEach((c) => r.push({ title: c.title, subtitle: `Chapter ${c.number} · ${c.part}`, href: `/learn/${c.slug}`, type: 'Chapter', keywords: `${c.tags.join(' ')} ${c.description}` }));
    (all.schools.data ?? []).forEach((s) => r.push({ title: s.name, subtitle: 'School', href: `/schools/${s.id}`, type: 'School', keywords: s.description }));
    (all.tools.data ?? []).forEach((t) => r.push({ title: t.name, subtitle: `${t.category} · ${t.level}`, href: `/tools?tool=${t.id}`, type: 'Tool', keywords: `${t.purpose} ${t.alt}` }));
    (all.cves.data ?? []).forEach((c) => r.push({ title: `${c.cve} — ${c.name}`, subtitle: `${c.severity} · ${c.year}`, href: `/vulnerabilities?cve=${c.cve}`, type: 'CVE', keywords: `${c.software} ${c.category} ${c.rootCause}` }));
    (all.research.data ?? []).forEach((p) => p.url && r.push({ title: p.title, subtitle: `${p.authors} · ${p.year}`, href: p.url, type: 'Paper', keywords: `${p.problem} ${p.contribution} ${p.category}` }));
    (all.labs.data ?? []).forEach((l) => r.push({ title: l.title, subtitle: `${l.provider} · ${l.difficulty}`, href: l.url.startsWith('/') ? l.url : l.url, type: 'Lab', keywords: l.skills.join(' ') }));
    (all.projects.data ?? []).forEach((p) => r.push({ title: p.name, subtitle: 'Project', href: `/projects?p=${p.id}`, type: 'Project', keywords: `${p.problem} ${p.stack}` }));
    (all.reports.data ?? []).forEach((p) => r.push({ title: p.title, subtitle: `${p.cls} · ${p.severity}`, href: `/case-studies?case=${p.id}`, type: 'Case study', keywords: `${p.summary} ${p.impact}` }));
    (all.courses.data ?? []).forEach((c) => c.url && r.push({ title: c.platform, subtitle: `${c.cost} · ${c.focus}`, href: c.url, type: 'Course', keywords: c.outcomes }));
    (all.roadmap.data ?? []).forEach((m) => r.push({ title: `Month ${m.n}: ${m.title}`, subtitle: 'Roadmap', href: `/roadmap?m=${m.id}`, type: 'Roadmap', keywords: m.weeks.join(' ') }));
    (all.glossary.data ?? []).forEach((g) => r.push({ title: g.term, subtitle: 'Glossary', href: `/search?term=${encodeURIComponent(g.term)}`, type: 'Term', keywords: g.definition }));
    return r;
  }, [all.chapters.data, all.schools.data, all.tools.data, all.cves.data, all.research.data, all.labs.data, all.projects.data, all.reports.data, all.courses.data, all.roadmap.data, all.glossary.data]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return index.slice(0, 12);
    return index
      .filter((r) => `${r.title} ${r.subtitle} ${r.keywords}`.toLowerCase().includes(needle))
      .slice(0, 30);
  }, [index, q]);

  if (!open) return null;

  const go = (r: Result) => {
    onClose();
    if (r.href.startsWith('http')) window.open(r.href, '_blank', 'noopener,noreferrer');
    else router.push(r.href);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Global search">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-600 bg-ink-900 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-ink-700 px-4">
          <Search className="h-5 w-5 text-mint-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
            placeholder="Search chapters, tools, CVEs, papers, labs…"
            className="w-full bg-transparent py-4 text-sm text-slate-100 outline-none placeholder:text-ink-600"
          />
          <button onClick={onClose} className="btn-icon" aria-label="Close search"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <div className="px-4 py-10 text-center text-sm text-muted">No matches. Try a broader term.</div>}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.title}-${i}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition', active === i ? 'bg-mint-500/10' : 'hover:bg-ink-800')}
            >
              <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-mint-400/80">{r.type}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-200">{r.title}</span>
                <span className="block truncate text-xs text-muted">{r.subtitle}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-600" />
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-ink-800 px-4 py-2.5 text-[11px] text-muted">
          <span>{results.length} results · {index.length} indexed items</span>
          <span className="font-mono">↑↓ navigate · ↵ open · esc close</span>
        </div>
      </div>
    </div>
  );
}
