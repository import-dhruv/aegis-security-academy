'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award, BookOpenText, Check, ChevronDown, ChevronRight, CircleCheck, Clock3,
  Compass, FlaskConical, GraduationCap, Layers3, Map, Route, Target, Terminal,
} from 'lucide-react';
import { useData } from '@/lib/data';
import type { RoadmapMonth } from '@/lib/types';
import { Badge, EmptyState, KV, PageHeader, Panel, StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

type Phase = {
  n: number;
  title: string;
  theme: string;
  prerequisites: string[];
  focus: string[];
  milestones: string[];
  competencies: string[];
};

const phases: Phase[] = [
  {
    n: 1,
    title: 'Absolute Beginner',
    theme: 'Build the mental model: how computers, networks, and the web actually work before you try to break them.',
    prerequisites: ['No formal background required', 'Curiosity and a willingness to keep a lab journal', 'A computer you can install a virtual machine on'],
    focus: ['Binary/hex, CPU, memory, processes and files', 'Linux shell, permissions, users and processes', 'Python fundamentals and basic scripting', 'TCP/IP, DNS, HTTP and the browser request/response cycle'],
    milestones: ['Explain a packet capture in plain language', 'Complete beginner Linux wargame levels in your own lab', 'Write a small script that parses a text file', 'Pass a self-assessment on binary, subnetting and HTTP basics'],
    competencies: ['Navigate a Linux terminal without guidance', 'Read a URL and describe every hop to the server', 'Write and debug simple Python scripts', 'Keep notes that another person can follow'],
  },
  {
    n: 2,
    title: 'Security Foundations',
    theme: 'Learn the vocabulary, the threat models and the legal boundaries that make later technical work meaningful.',
    prerequisites: ['Phase 1 computing and networking basics', 'Comfort with a local virtual machine'],
    focus: ['CIA triad, least privilege, defence in depth and trust boundaries', 'Common vulnerability classes and how they map to real incidents', 'Cryptography primitives: hashing, symmetric/asymmetric encryption, TLS', 'Ethics, authorization, disclosure and safe lab hygiene'],
    milestones: ['Classify a set of findings by impact and likelihood', 'Explain the difference between encoding, hashing and encryption', 'Write a personal authorization checklist you actually follow', 'Pass an assessment on core security terminology'],
    competencies: ['Read a security advisory and summarize the root cause', 'Recognize when a test needs written permission', 'Configure an isolated lab network', 'Communicate uncertainty rather than guessing'],
  },
  {
    n: 3,
    title: 'Web Security',
    theme: 'Develop working fluency in the technologies that dominate bug-bounty scope: HTTP, browsers, sessions and APIs.',
    prerequisites: ['Phase 2 foundations', 'Basic HTML/JavaScript and SQL familiarity'],
    focus: ['HTTP methods, headers, cookies, CORS and caching', 'Browser security model: same-origin policy, CSP, SOP nuances', 'OWASP Top 10 with local reproductions', 'Authentication, session management and API authorization patterns'],
    milestones: ['Reproduce injection and XSS classes in DVWA/Juice Shop', 'Write a written proof of concept for an authorization flaw', 'Explain how a CSRF token works and how it can fail', 'Pass a chapter-level assessment on web security'],
    competencies: ['Read a request/response pair and spot missing controls', 'Build a small vulnerable app and then fix it', 'Distinguish client-side from server-side enforcement', 'Use browser DevTools methodically'],
  },
  {
    n: 4,
    title: 'Security Tools',
    theme: 'Turn ad-hoc clicking into a repeatable, measured workflow using a small, understood set of tools.',
    prerequisites: ['Phases 1–3', 'A local lab with intentionally vulnerable targets'],
    focus: ['Proxies and repeaters: intercept, replay and compare requests', 'Content discovery and parameter fuzzing with rate limits', 'Recon fundamentals: DNS, certificates, public records', 'Scripting repeated checks and parsing tool output'],
    milestones: ['Complete a full recon-to-finding workflow against a lab target', 'Automate one repetitive check in Python', 'Document each tool’s purpose, limits and failure modes', 'Pass a practical tool fluency check'],
    competencies: ['Choose a tool because it fits the question, not because it is popular', 'Interpret false positives critically', 'Keep request volumes low and authorized', 'Reproduce results from notes alone'],
  },
  {
    n: 5,
    title: 'Practical Bug Bounty',
    theme: 'Translate lab skill into disciplined program participation: scope, rules, triage and professional reporting.',
    prerequisites: ['Solid web security and tool fluency', 'A safe place to practise end-to-end scenarios'],
    focus: ['Reading scopes, safe-harbour terms and exclusions carefully', 'Prioritizing assets and building an attack-surface inventory', 'Writing minimal, non-destructive proof of concepts', 'Report structure, severity reasoning and triage dialogue'],
    milestones: ['Complete a full synthetic program simulation with a clean report', 'Write three practice reports graded against a rubric', 'Respond to a mock triage request with missing evidence', 'Pass an assessment on scope and disclosure rules'],
    competencies: ['Stay inside scope under ambiguity', 'Explain impact without exaggeration', 'Handle duplicate and informative outcomes gracefully', 'Separate verified facts from hypotheses'],
  },
  {
    n: 6,
    title: 'Advanced Security',
    theme: 'Extend depth into cloud, identity, containers and binary-level topics where assumptions break down.',
    prerequisites: ['Phase 5 reporting discipline', 'Comfort reading documentation and source code'],
    focus: ['Cloud IAM, metadata services and container/Kubernetes misconfiguration', 'OAuth/OIDC, JWT, SAML and identity-provider trust chains', 'Memory layout, calling conventions and common memory-safety bugs', 'CI/CD pipelines, secrets handling and supply-chain exposure'],
    milestones: ['Find and document a flaw in a self-hosted cloud-lab scenario', 'Explain a memory-corruption primitive with a diagram', 'Audit a sample CI workflow for secret leakage', 'Pass an advanced topic assessment'],
    competencies: ['Read architecture diagrams and identify trust boundaries', 'Reason about multi-step authorization chains', 'Build minimal reproducers in a controlled environment', 'Assess exploitability without destructive testing'],
  },
  {
    n: 7,
    title: 'Vulnerability Research',
    theme: 'Move from consuming known bugs to discovering and understanding new ones systematically.',
    prerequisites: ['Phases 5–6', 'Scripting, debugging and source-reading habits'],
    focus: ['Fuzzing strategies, coverage and crash triage in local builds', 'Static and dynamic analysis, sanitizers and debuggers', 'Root-cause analysis and patch-diff comparison', 'Coordinated disclosure and reproducible advisories'],
    milestones: ['Fuzz a small local target and triage the crashes you find', 'Write a root-cause note for one discovered defect', 'Compare a vendor patch with the vulnerable version', 'Pass a research-methodology assessment'],
    competencies: ['Design an experiment that can fail', 'Reduce a crashing input to a minimal case', 'Distinguish a bug from a vulnerability', 'Document evidence other researchers can verify'],
  },
  {
    n: 8,
    title: 'Elite Research',
    theme: 'Operate at the frontier: original classes of bugs, novel exploitation research and responsible publication.',
    prerequisites: ['Demonstrated research output from Phase 7', 'A body of published, high-quality write-ups or advisories'],
    focus: ['Novel bug classes, protocol-level reasoning and parser edge cases', 'Advanced binary exploitation concepts in isolated lab environments', 'Research tooling: custom fuzzers, instrumentation, differential analysis', 'Responsible disclosure, embargoes and community contribution'],
    milestones: ['Publish a detailed, reproducible technical write-up', 'Present a finding or methodology to a peer audience', 'Contribute a tool, test case or patch to a community project', 'Complete a capstone research project with a clear threat model'],
    competencies: ['Form and test original hypotheses', 'Communicate risk precisely to defenders and vendors', 'Review others’ research constructively', 'Keep impact and ethics central to every publication'],
  },
];

function RoadmapView() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: months, loading, error } = useData<RoadmapMonth[]>('roadmap.json');
  const deepLinked = params.get('m');
  const [openId, setOpenId] = useState<string | null>(deepLinked);

  useEffect(() => {
    if (deepLinked) {
      setOpenId(deepLinked);
      const t = setTimeout(() => document.getElementById(deepLinked)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      return () => clearTimeout(t);
    }
  }, [deepLinked]);

  const toggle = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    router.replace(next ? `/roadmap?m=${next}` : '/roadmap', { scroll: false });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Overview / Learning Path"
        title="Beginner-to-Elite Learning Roadmap"
        description="A competency-first path from your first shell command to original security research. Eight phases describe what you should be able to do; twelve monthly plans suggest how to organize the work."
      />

      <Panel className="mb-10 border-cyan-500/25 bg-cyanx-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-cyanx-300" />
          <div>
            <div className="label mb-1 text-cyanx-300">How to use this roadmap</div>
            <p className="text-sm leading-relaxed text-slate-300">
              Adapt the 12-month plan to your actual weekly budget — go slower if life is busy, repeat a month if
              the criteria are not yet met. There are no fixed timeframes and no guarantees of mastery: progress
              is measured by demonstrated competence, not by dates on a calendar. Authorization and safety are
              prerequisites at every phase, never an afterthought.
            </p>
          </div>
        </div>
      </Panel>

      <section className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <Compass className="h-5 w-5 text-mint-400" />
          <h2 className="section-title">The eight phases</h2>
        </div>
        <div className="relative space-y-4 border-l border-ink-700 pl-6 md:pl-8">
          {phases.map((phase) => (
            <div key={phase.n} className="relative">
              <div className="absolute -left-[33px] top-5 flex h-6 w-6 items-center justify-center rounded-full border border-mint-500/40 bg-ink-900 md:-left-[41px]">
                <span className="font-mono text-[10px] text-mint-400">{phase.n}</span>
              </div>
              <Panel className="p-5" hover>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="mint">Phase {phase.n}</Badge>
                  <h3 className="text-lg font-semibold text-slate-50">{phase.title}</h3>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{phase.theme}</p>
                <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="label mb-2 flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-mint-400" /> Prerequisites</div>
                    <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-300">{phase.prerequisites.map((x) => <li key={x}>• {x}</li>)}</ul>
                  </div>
                  <div>
                    <div className="label mb-2 flex items-center gap-1.5"><BookOpenText className="h-3.5 w-3.5 text-cyanx-300" /> Focus topics</div>
                    <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-300">{phase.focus.map((x) => <li key={x}>• {x}</li>)}</ul>
                  </div>
                  <div>
                    <div className="label mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-amber-300" /> Milestone exams</div>
                    <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-300">{phase.milestones.map((x) => <li key={x}>• {x}</li>)}</ul>
                  </div>
                  <div>
                    <div className="label mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-mint-400" /> Expected competencies</div>
                    <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-300">{phase.competencies.map((x) => <li key={x}>• {x}</li>)}</ul>
                  </div>
                </div>
              </Panel>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Route className="h-5 w-5 text-mint-400" /><h2 className="section-title">Twelve monthly plans</h2></div>
          {deepLinked && <button className="btn-ghost" onClick={() => { setOpenId(null); router.replace('/roadmap', { scroll: false }); }}>Clear deep link</button>}
        </div>
        <p className="mb-5 max-w-3xl text-sm text-muted">
          Each plan is a suggestion, not a promise. Adjust it to your weekly budget and revisit the measurable
          criteria before moving on.
        </p>

        {error ? (
          <EmptyState title="Could not load monthly plans" description={error} />
        ) : loading ? (
          <div className="space-y-3">{[1, 2, 3].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-ink-800/60" />)}</div>
        ) : (
          <div className="space-y-3">
            {(months ?? []).map((m) => {
              const open = openId === m.id;
              return (
                <div key={m.id} id={m.id} className="scroll-mt-24">
                <Panel className={cn(open && 'border-mint-500/30')} hover>
                  <button className="flex w-full items-center gap-4 p-5 text-left" onClick={() => toggle(m.id)} aria-expanded={open}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-mint-500/25 bg-mint-500/10 font-mono text-sm text-mint-300">{String(m.n).padStart(2, '0')}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-slate-100">Month {m.n}: {m.title}</div>
                      <div className="mt-1 truncate text-xs text-muted">{m.weeks.length} weekly checkpoints · {m.criteria}</div>
                    </div>
                    {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
                  </button>
                  {open && (
                    <div className="border-t border-ink-800 px-5 pb-5 pt-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        {m.weeks.map((w) => <div key={w} className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-[13px] leading-relaxed text-slate-300">{w}</div>)}
                      </div>
                      <div className="mt-5">
                        <KV k="Concepts & reading" v={m.concepts} />
                        <KV k="Courses" v={m.courses} />
                        <KV k="Labs" v={<span className="inline-flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5 text-mint-400" /> {m.labs}</span>} />
                        <KV k="Programming" v={<span className="inline-flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-cyanx-300" /> {m.programming}</span>} />
                        <KV k="Research" v={m.research} />
                        <KV k="Revision" v={m.revision} />
                        <KV k="Measurable criteria" v={<span className="text-mint-300">{m.criteria}</span>} />
                      </div>
                    </div>
                  )}
                </Panel>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <StatCard label="Phases" value={phases.length} sub="Competency milestones" icon={<Map className="h-4 w-4" />} />
        <StatCard label="Monthly plans" value={(months ?? []).length || 12} sub="Suggestions, not guarantees" icon={<GraduationCap className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Rule" value="Authorized only" sub="Local labs or written permission" icon={<Layers3 className="h-4 w-4" />} tone="slate" />
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div className="animate-pulse py-20 text-center text-muted">Loading roadmap…</div>}>
      <RoadmapView />
    </Suspense>
  );
}
