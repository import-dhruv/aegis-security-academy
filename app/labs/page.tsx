'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight, Circle,
  ExternalLink, Filter, FlaskConical, Lock, RotateCcw, ShieldCheck, Target, X,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { Lab } from '@/lib/types';
import { useProgress } from '@/components/providers';
import { Badge, DifficultyBadge, EmptyState, PageHeader, Panel, SearchInput, StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export default function LabsPage() {
  const { data: labs, loading, error } = useData<Lab[]>('labs.json');
  const progress = useProgress();
  const [provider, setProvider] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [completedOnly, setCompletedOnly] = useState(false);
  const [selected, setSelected] = useState<Lab | null>(null);

  const list = labs ?? [];
  const providers = useMemo(() => Array.from(new Set(list.map((l) => l.provider))).sort(), [list]);
  const difficulties = useMemo(() => Array.from(new Set(list.map((l) => l.difficulty))).sort(), [list]);
  const types = useMemo(() => Array.from(new Set(list.map((l) => l.type))).sort(), [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((l) => {
      if (provider !== 'all' && l.provider !== provider) return false;
      if (difficulty !== 'all' && l.difficulty !== difficulty) return false;
      if (type !== 'all' && l.type !== type) return false;
      const done = progress.state.labCompletions.includes(l.id);
      if (completedOnly && !done) return false;
      if (q && ![l.title, l.provider, l.note, l.type, ...l.skills].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, provider, difficulty, type, search, completedOnly, progress.state.labCompletions]);

  const doneCount = list.filter((l) => progress.state.labCompletions.includes(l.id)).length;
  const externalCount = list.filter((l) => isExternal(l.url)).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Research / Practical Labs"
        title="Practical Laboratory System"
        description="Structured, hands-only practice. Every exercise runs against an intentionally vulnerable local app, a sandbox you own, or a platform that explicitly authorizes testing."
        actions={
          <Link href="/ethics" className="btn-ghost">
            <ShieldCheck className="h-4 w-4 text-mint-400" /> Ethics &amp; legal
          </Link>
        }
      />

      <Panel className="mb-8 border-mint-500/25 bg-mint-500/[0.04] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="rounded-xl border border-mint-500/30 bg-mint-500/10 p-3 text-mint-300">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="label mb-1 text-mint-400">The lab safety contract</div>
            <h2 className="text-lg font-semibold text-slate-50">Practice only where you are allowed to</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Work in local virtual machines and containers you control, or on systems where you hold explicit,
              written authorization. Never scan, probe, or exploit third-party systems, friends&apos; websites,
              employer networks, or public services without permission. Treat every external platform below as
              a separate venue with its own rules — read and obey them before you begin. When in doubt, stay in
              the lab. Unauthorized testing is a crime in most jurisdictions and is not part of this academy.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip"><CheckCircle2 className="h-3 w-3 text-mint-400" /> Local &amp; owned targets</span>
              <span className="chip"><CheckCircle2 className="h-3 w-3 text-mint-400" /> Explicit written scope</span>
              <span className="chip"><CheckCircle2 className="h-3 w-3 text-mint-400" /> No third-party testing</span>
              <Link href="/ethics" className="chip link">Read the full ethics policy <ChevronRight className="h-3 w-3" /></Link>
            </div>
          </div>
        </div>
      </Panel>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Lab environments" value={list.length} sub="Curated practice targets" icon={<FlaskConical className="h-4 w-4" />} />
        <StatCard label="Completed" value={doneCount} sub={`${list.length ? Math.round((doneCount / list.length) * 100) : 0}% of catalogue`} icon={<CheckCircle2 className="h-4 w-4" />} tone="cyan" />
        <StatCard label="External platforms" value={externalCount} sub="Separate rules apply" icon={<ExternalLink className="h-4 w-4" />} tone="slate" />
      </div>

      <Panel className="mb-6 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"><Filter className="h-4 w-4 text-mint-400" /> Filters</div>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search labs or skills…" />
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Filter by provider">
            <option value="all">All providers</option>
            {providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Filter by difficulty">
            <option value="all">All difficulties</option>
            {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            className={cn('btn', completedOnly ? 'bg-mint-500 text-ink-950' : 'btn-ghost')}
            onClick={() => setCompletedOnly((v) => !v)}
          >
            {completedOnly ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />} Completed
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{filtered.length} of {list.length} labs shown</span>
          <button className="link" onClick={() => { setProvider('all'); setDifficulty('all'); setType('all'); setSearch(''); setCompletedOnly(false); }}>Reset filters</button>
        </div>
      </Panel>

      {error ? (
        <EmptyState title="Could not load the lab catalogue" description={error} />
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-48 animate-pulse rounded-xl bg-ink-800/60" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No labs match these filters" description="Try removing a filter or searching for a different skill." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lab) => {
            const done = progress.state.labCompletions.includes(lab.id);
            return (
              <button key={lab.id} className="panel panel-hover flex h-full flex-col p-5 text-left" onClick={() => setSelected(lab)}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={isExternal(lab.url) ? 'amber' : 'mint'}>{isExternal(lab.url) ? <ExternalLink className="h-3 w-3" /> : <Lock className="h-3 w-3" />}{isExternal(lab.url) ? 'External platform' : 'Local / internal'}</Badge>
                    {done && <Badge tone="mint"><Check className="h-3 w-3" /> Done</Badge>}
                  </div>
                  <DifficultyBadge value={lab.difficulty} />
                </div>
                <h3 className="text-[15px] font-semibold leading-snug text-slate-100">{lab.title}</h3>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{lab.provider}</span><span className="text-ink-600">•</span><span>{lab.type}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lab.skills.map((s) => <span key={s} className="chip">{s}</span>)}
                </div>
                <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted">{lab.note}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-mint-400">Open details <ChevronRight className="h-3 w-3" /></div>
              </button>
            );
          })}
        </div>
      )}

      <MiniLabs />

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-600 bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="label text-mint-400">Lab details</div>
                <h2 className="mt-1 text-xl font-semibold text-slate-50">{selected.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={isExternal(selected.url) ? 'amber' : 'mint'}>{isExternal(selected.url) ? 'External platform' : 'Local / internal'}</Badge>
                  <DifficultyBadge value={selected.difficulty} />
                  <span className="chip">{selected.provider}</span>
                  <span className="chip">{selected.type}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)} aria-label="Close details"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-6">
              <div className="label mb-2">Full note</div>
              <p className="text-sm leading-relaxed text-slate-300">{selected.note}</p>
            </div>

            <div className="mt-6">
              <div className="label mb-2">Learning objectives (derived from skills)</div>
              <ul className="space-y-2">
                {selected.skills.map((skill) => (
                  <li key={skill} className="flex gap-2 text-sm text-slate-300">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
                    <span>Recognize, reproduce, and explain <strong className="text-slate-100">{skill}</strong> in this lab, then document what made it work and how it would be fixed.</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-[13px] leading-relaxed text-amber-200/80">
              <div className="mb-1 flex items-center gap-2 font-semibold text-amber-200"><AlertTriangle className="h-4 w-4" /> Authorization reminder</div>
              {isExternal(selected.url)
                ? 'This is an external platform with its own terms and rules. Use your own account, stay inside the published scope, and never point its tooling at systems you do not own.'
                : 'Keep this environment isolated on a host-only network or local machine. Do not expose it to the internet and do not reuse credentials from real accounts.'}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink-800 pt-5">
              <button
                className={cn('btn', progress.state.labCompletions.includes(selected.id) ? 'bg-mint-500 text-ink-950' : 'btn-ghost')}
                onClick={() => progress.toggleLab(selected.id)}
              >
                {progress.state.labCompletions.includes(selected.id) ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {progress.state.labCompletions.includes(selected.id) ? 'Completed — undo' : 'Mark lab complete'}
              </button>
              {isExternal(selected.url) ? (
                <a className="btn-primary" href={selected.url} target="_blank" rel="noopener noreferrer">
                  Visit platform <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : (
                <Link className="btn-primary" href={selected.url}>
                  <BookOpen className="h-4 w-4" /> Open internal chapter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Original browser mini-labs ------------------------- */

type ScopeAsset = { id: string; host: string; inScope: boolean; why: string };

const scopeAssets: ScopeAsset[] = [
  { id: 'a', host: 'lab.aegis.test', inScope: true, why: 'Explicitly listed as in scope.' },
  { id: 'b', host: 'api.lab.aegis.test', inScope: true, why: 'A named subdomain of an in-scope zone.' },
  { id: 'c', host: 'beta.aegis.test', inScope: true, why: 'Covered by the explicit beta.* wildcard clause.' },
  { id: 'd', host: 'corp.aegis.test', inScope: false, why: 'Internal corporate domain is excluded.' },
  { id: 'e', host: 'legacy-acquisition.example', inScope: false, why: 'Acquired assets are excluded until added in writing.' },
  { id: 'f', host: 'prod.aegis.test', inScope: false, why: 'Production is not part of this program.' },
];

function ScopePuzzle() {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const wrongIncluded = scopeAssets.filter((a) => !a.inScope && picked.includes(a.id));
  const wrongExcluded = scopeAssets.filter((a) => a.inScope && !picked.includes(a.id));
  const perfect = checked && wrongIncluded.length === 0 && wrongExcluded.length === 0;

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2"><Badge tone="cyan">Mini-lab A</Badge><h3 className="text-base font-semibold text-slate-100">Scope detective</h3></div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Mock policy: <strong className="text-slate-200">in scope</strong> — <code className="font-mono text-mint-300">lab.aegis.test</code>, its subdomains, and <code className="font-mono text-mint-300">beta.aegis.test</code> plus subdomains.
        <strong className="text-slate-200"> Out of scope</strong> — internal, production, and acquired assets. Select every asset you are allowed to test.
      </p>
      <div className="mt-4 space-y-2">
        {scopeAssets.map((a) => (
          <label key={a.id} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition', picked.includes(a.id) ? 'border-mint-500/40 bg-mint-500/[0.06]' : 'border-ink-700 bg-ink-900')}>
            <input type="checkbox" className="accent-mint-500" checked={picked.includes(a.id)} onChange={() => { toggle(a.id); setChecked(false); }} />
            <span className="font-mono text-[13px] text-slate-200">{a.host}</span>
            {checked && <span className={cn('ml-auto text-xs', a.inScope === picked.includes(a.id) ? 'text-mint-400' : 'text-rose-300')}>{a.inScope === picked.includes(a.id) ? 'correct' : 'review'}</span>}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={() => setChecked(true)} disabled={picked.length === 0}><Check className="h-4 w-4" /> Check scope</button>
        <button className="btn-ghost" onClick={() => { setPicked([]); setChecked(false); }}><RotateCcw className="h-4 w-4" /> Reset</button>
      </div>
      {checked && (
        <div className={cn('mt-4 rounded-lg border p-4 text-[13px] leading-relaxed', perfect ? 'border-mint-500/30 bg-mint-500/[0.05] text-mint-200' : 'border-rose-500/30 bg-rose-500/[0.05] text-rose-200')}>
          <div className="mb-2 font-semibold">{perfect ? 'Correct — you stayed inside the authorized scope.' : 'Not quite — review the classification below.'}</div>
          {[...wrongIncluded, ...wrongExcluded].map((a) => <div key={a.id} className="mb-1"><span className="font-mono">{a.host}</span> — {a.why}</div>)}
          {perfect && <div>All six assets classified correctly. When a target is ambiguous, ask the program owner before testing.</div>}
        </div>
      )}
    </Panel>
  );
}

function Base64Puzzle() {
  const encoded = 'ZGVjb2RlIGlzIG5vdCBkZWNyeXB0';
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<string | null>(null);
  const [error, setError] = useState('');
  const expected = 'decode is not decrypt';

  const run = () => {
    try {
      setDecoded(atob(input.trim()));
      setError('');
    } catch {
      setDecoded(null);
      setError('That string is not valid Base64 (check padding and characters).');
    }
  };

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2"><Badge tone="cyan">Mini-lab B</Badge><h3 className="text-base font-semibold text-slate-100">Decode, don&apos;t decrypt</h3></div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Decode this string in your browser: <code className="block my-2 break-all rounded border border-ink-700 bg-ink-950 p-2 font-mono text-[12px] text-mint-300">{encoded}</code>
        Then explain why decoding is <em>not</em> decryption. Type the decoded text below and run the decoder.
      </p>
      <input className="input font-mono" value={input} onChange={(e) => { setInput(e.target.value); setDecoded(null); setError(''); }} placeholder="Paste the Base64 string here…" aria-label="Base64 input" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={run}><Target className="h-4 w-4" /> Decode locally</button>
        <button className="btn-ghost" onClick={() => { setInput(encoded); setDecoded(null); setError(''); }}><RotateCcw className="h-4 w-4" /> Load challenge string</button>
      </div>
      {error && <p className="mt-3 text-[13px] text-rose-300">{error}</p>}
      {decoded !== null && (
        <div className="mt-4 rounded-lg border border-ink-700 bg-ink-950 p-4">
          <div className="label mb-1">Decoder output</div>
          <div className="break-all font-mono text-sm text-cyanx-300">{decoded}</div>
          <div className={cn('mt-3 text-[13px] leading-relaxed', decoded.trim().toLowerCase() === expected ? 'text-mint-300' : 'text-amber-200/80')}>
            {decoded.trim().toLowerCase() === expected
              ? 'Correct. Base64 is a public encoding with no key — anyone can reverse it with atob(). Encoding hides bytes from naive parsers; it does not provide confidentiality. Never describe an encoded token as “encrypted” in a report.'
              : 'Matches the decoder output, but the challenge expects a specific phrase — load the challenge string and try again.'}
          </div>
        </div>
      )}
    </Panel>
  );
}

const headerOptions = [
  { id: 'a', text: 'Set-Cookie lacks HttpOnly, Secure and SameSite, and the page is marked publicly cacheable.' },
  { id: 'b', text: 'The Apache server version is exposed in a Server header.' },
  { id: 'c', text: 'The TLS cipher suite is too weak.' },
  { id: 'd', text: 'Nothing — this is a healthy response.' },
];

function HeaderPuzzle() {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2"><Badge tone="cyan">Mini-lab C</Badge><h3 className="text-base font-semibold text-slate-100">Header weakness spotter</h3></div>
      <p className="mt-2 text-[13px] text-muted">Review this synthetic response from a lab app you own:</p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-[12px] leading-6 text-slate-300">{`HTTP/2 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: sid=s%3Ab7d; Path=/
Cache-Control: public, max-age=600
X-Powered-By: Express 4.x`}</pre>
      <div className="mt-4 space-y-2">
        {headerOptions.map((o) => (
          <label key={o.id} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-[13px] transition', choice === o.id ? 'border-mint-500/40 bg-mint-500/[0.06]' : 'border-ink-700 bg-ink-900')}>
            <input type="radio" name="header-choice" className="mt-0.5 accent-mint-500" checked={choice === o.id} onChange={() => setChoice(o.id)} />
            <span className="leading-relaxed text-slate-300">{o.text}</span>
          </label>
        ))}
      </div>
      {choice && (
        <div className={cn('mt-4 rounded-lg border p-4 text-[13px] leading-relaxed', choice === 'a' ? 'border-mint-500/30 bg-mint-500/[0.05] text-mint-200' : 'border-rose-500/30 bg-rose-500/[0.05] text-rose-200')}>
          <div className="mb-1 font-semibold">{choice === 'a' ? 'Correct.' : 'Not quite.'}</div>
          {choice === 'a'
            ? 'The cookie has no HttpOnly (script can read it), no Secure (it can travel over plain HTTP), and no SameSite (CSRF exposure). Marking a page that sets a session public and cacheable can leak that cookie-bearing response through shared caches. X-Powered-By also discloses the stack. Add a Content-Security-Policy, HSTS, and strict cookie flags in the lab app, then re-test.'
            : 'Look at the Set-Cookie flags and the Cache-Control directive. There is no Server header here, and TLS parameters cannot be judged from an HTTP response alone. The session cookie is missing HttpOnly/Secure/SameSite and the response is explicitly public/cacheable.'}
        </div>
      )}
    </Panel>
  );
}

function MiniLabs() {
  return (
    <section className="mt-14 border-t border-ink-800 pt-10">
      <div className="mb-6">
        <div className="label mb-2 text-mint-400">Original interactive exercises</div>
        <h2 className="section-title">Original browser mini-labs</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Three self-contained puzzles that run entirely in this page. They contain no scanning and no network
          requests — all data is synthetic. Use them to rehearse judgment before touching a real lab.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <ScopePuzzle />
        <Base64Puzzle />
        <HeaderPuzzle />
      </div>
    </section>
  );
}
