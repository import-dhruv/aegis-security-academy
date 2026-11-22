'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, BrainCircuit, Bug, FileSearch, FlaskConical, GraduationCap, Network, Scale, ShieldAlert, Sparkles, Target, Terminal, Wrench } from 'lucide-react';
import { useData } from '@/lib/data';
import type { Chapter, School } from '@/lib/types';
import { Badge, Panel } from '@/components/ui';
import { useProgress } from '@/components/providers';
import { formatMinutes } from '@/lib/utils';

const features = [
  { icon: BookOpen, title: '36 deep chapters', text: 'First-principles theory, internals, diagrams, code, labs and references — not two-paragraph summaries.', href: '/schools', tone: 'text-mint-400' },
  { icon: FlaskConical, title: 'Practical laboratories', text: '12 curated external and local labs plus original browser mini-labs, with completion tracking.', href: '/labs', tone: 'text-cyanx-300' },
  { icon: Target, title: 'Bug bounty workflow', text: 'Scope analysis, recon, validation, reporting and a simulated triage engine with mock programs.', href: '/simulator', tone: 'text-mint-400' },
  { icon: BrainCircuit, title: 'AI tutor, three modes', text: 'Beginner, Engineer and Researcher explanations grounded in the academy’s own content.', href: '/tutor', tone: 'text-cyanx-300' },
  { icon: Terminal, title: '56-tool encyclopedia', text: 'Architecture, install, commands, output, mistakes, limits and alternatives for every tool.', href: '/tools', tone: 'text-mint-400' },
  { icon: FileSearch, title: 'Research & case studies', text: 'Real CVEs with NVD links, curated papers, and synthetic report case studies clearly labelled.', href: '/research', tone: 'text-cyanx-300' },
];

export default function Home() {
  const { data: chapters } = useData<Chapter[]>('chapters.json');
  const { data: schools } = useData<School[]>('schools.json');
  const { stats, state } = useProgress();
  const totalMinutes = chapters?.reduce((a, c) => a + c.minutes, 0) ?? 0;

  return (
    <div className="animate-fade-up">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-900">
        <div className="grid-bg absolute inset-0 opacity-70" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mint-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-cyanx-500/[0.06] blur-3xl" />
        <div className="relative px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge tone="mint"><span className="h-1.5 w-1.5 rounded-full bg-mint-400" /> v1.0 · Built for independent researchers</Badge>
            <Badge tone="cyan">36 chapters · 1,000 questions · 56 tools</Badge>
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Understand systems deeply.<br />
            <span className="text-mint-400">Find what others miss.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            A complete, first-principles cybersecurity and bug bounty university. From bits, bytes and TCP/IP to OWASP exploitation, binary research, cloud and AI security — with labs, assessments and a professional research workflow at every step.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={stats.mastered > 0 ? '/dashboard' : '/learn/chapter-01'} className="btn-primary">
              {stats.mastered > 0 ? 'Open dashboard' : 'Begin Chapter 1'} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/roadmap" className="btn-ghost"><GraduationCap className="h-4 w-4" /> View the roadmap</Link>
            <Link href="/ethics" className="btn-ghost border-amber-500/25 text-amber-300"><Scale className="h-4 w-4" /> Ethics & legal</Link>
          </div>
          {stats.mastered > 0 && (
            <p className="mt-4 text-xs text-muted">Welcome back, {state.name}. You are at Level {stats.level} with {stats.mastered} mastered chapters.</p>
          )}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-ink-700 pt-7 sm:grid-cols-4">
            {[
              { n: chapters?.length ?? '36', l: 'chapters' },
              { n: '1,000', l: 'exam questions' },
              { n: schools?.length ?? '24', l: 'schools & tracks' },
              { n: chapters ? `${Math.round(totalMinutes / 60)}h` : '—', l: 'core reading' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-mono text-2xl font-semibold text-slate-100">{s.n}</div>
                <div className="mt-0.5 text-xs text-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ETHICS STRIP */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <div className="text-sm font-semibold text-amber-200">Knowledge is not permission.</div>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-200/70">Every exploitation lesson is bounded to local labs, synthetic targets, CTFs or programs with explicit written authorization. A public URL is never consent.</p>
          </div>
        </div>
        <Link href="/ethics" className="btn-ghost shrink-0 border-amber-500/25 text-amber-200">Read the framework <ArrowRight className="h-4 w-4" /></Link>
      </div>

      {/* FEATURES */}
      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="label text-mint-400">The ecosystem</div>
            <h2 className="section-title mt-2">Everything a researcher needs, in one place</h2>
          </div>
          <Link href="/dashboard" className="hidden text-sm text-mint-400 hover:underline sm:inline">Open learning dashboard →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link key={f.title} href={f.href} className="panel panel-hover group p-5">
              <div className={`mb-4 inline-flex rounded-lg border border-ink-700 bg-ink-900 p-2.5 ${f.tone}`}><f.icon className="h-5 w-5" /></div>
              <h3 className="text-[15px] font-semibold text-slate-100 group-hover:text-mint-300">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{f.text}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-mint-400 opacity-0 transition group-hover:opacity-100">Explore <ArrowRight className="h-3 w-3" /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* SCHOOLS PREVIEW */}
      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="label text-mint-400">Structured curriculum</div>
            <h2 className="section-title mt-2">19 core schools, six supporting tracks</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">Each school has a defined prerequisite chain. Chapters are mapped to schools and to the ten-level skill tree; progression requires demonstrated understanding.</p>
          </div>
          <Link href="/schools" className="btn-ghost hidden sm:inline-flex">All schools <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(schools ?? []).slice(0, 9).map((s, i) => (
            <Link key={s.id} href={`/schools/${s.id}`} className="panel panel-hover flex items-start gap-3 p-4">
              <span className="font-mono text-[11px] text-mint-500/70">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="text-sm font-medium text-slate-200">{s.name}</div>
                <div className="mt-1 text-xs leading-snug text-muted">{s.description}</div>
                <div className="mt-2 font-mono text-[10px] text-cyanx-400/80">{s.chapterIds.length} chapters</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="mt-16 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel className="p-7">
          <div className="label text-mint-400">Learning philosophy</div>
          <h2 className="section-title mt-2">First principles, always</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">Every topic is taught through a fixed set of questions: what it is, why it exists, the problem it solves, how it works internally, what happens behind the scenes, how it fails, how attackers exploit it, how developers prevent it, how researchers find it, how it is tested, which tools are used, what to practise, common mistakes and what to learn next.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {['Never tools without technology', 'Never exploitation without root cause', 'Never theory without practice', 'Never advancement without assessment'].map((x) => (
              <div key={x} className="flex items-start gap-2 rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2.5 text-xs text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" /> {x}
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-7">
          <div className="label text-cyanx-300">Ten levels</div>
          <h2 className="section-title mt-2">A skill tree, not a checkbox list</h2>
          <div className="mt-6 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {[
              'Cybersecurity Initiate', 'Computer Systems Explorer', 'Network Analyst', 'Security Practitioner', 'Web Security Researcher',
              'Bug Bounty Hunter', 'Advanced Vulnerability Researcher', 'Exploitation Specialist', 'Security Research Engineer', 'Elite Security Researcher',
            ].map((name, i) => (
              <div key={name} className="flex items-center gap-2.5 text-xs">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${i + 1 <= stats.level ? 'border-mint-500/40 bg-mint-500/10 text-mint-400' : 'border-ink-600 text-muted'}`}>{i + 1}</span>
                <span className={i + 1 <= stats.level ? 'text-slate-200' : 'text-muted'}>{name}</span>
              </div>
            ))}
          </div>
          <Link href="/analytics" className="mt-7 inline-flex items-center gap-2 text-sm text-mint-400 hover:underline">See your position on the tree <ArrowRight className="h-4 w-4" /></Link>
        </Panel>
      </section>

      {/* CTA */}
      <section className="mt-16 overflow-hidden rounded-2xl border border-mint-500/20 bg-gradient-to-br from-mint-500/[0.08] to-cyanx-500/[0.05] p-8 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <Sparkles className="mb-3 h-6 w-6 text-mint-400" />
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">The objective is genuine mastery.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Not certificates. Not finished videos. The ability to understand a system, reason about where its assumptions break, validate a suspicion safely and communicate the finding clearly.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/learn/chapter-01" className="btn-primary">Start learning <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/tutor" className="btn-ghost"><BrainCircuit className="h-4 w-4" /> Ask the tutor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
