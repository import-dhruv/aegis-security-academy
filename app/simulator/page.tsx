'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList,
  FileSearch, Flag, RotateCcw, ShieldCheck, Target, Terminal, Workflow, X,
} from 'lucide-react';
import { Badge, DifficultyBadge, PageHeader, Panel, ProgressBar, StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

/* ------------------------------- Synthetic data ------------------------------ */

type Quiz = { prompt: string; options: Choice[]; correct: string };

type Program = {
  id: string;
  name: string;
  summary: string;
  scope: string[];
  excluded: string[];
  rules: string[];
  knownDuplicate: string;
  scopeQuiz: Quiz;
  rulesQuiz: Quiz;
};

type Choice = { id: string; label: string; description?: string };

type InventoryItem = { id: string; host: string; kind: string; note: string; scope: Record<string, boolean> };

const programs: Program[] = [
  {
    id: 'vault',
    name: 'Aegis Disk Vault (FICTIONAL)',
    summary: 'Mock file-sharing service. All hosts end in .test and exist only in this simulation.',
    scope: ['vault.aegis-lab.test', 'api.vault.aegis-lab.test', 'All subdomains of beta.vault.aegis-lab.test'],
    excluded: ['blog.aegis-lab.test (third-party hosted)', 'prod.vault.aegis-lab.test', 'Any partner or vendor domain'],
    rules: ['Maximum 2 requests per second', 'No denial-of-service or destructive payloads', 'No social engineering or phishing', 'No access to real user data; use seeded test accounts', 'Proof of concepts must be local and minimal'],
    knownDuplicate: 'An IDOR on the file-download endpoint was already reported and fixed this cycle.',
    scopeQuiz: {
      prompt: 'Which target is clearly in scope for this program?',
      options: [
        { id: 'good', label: 'api.vault.aegis-lab.test', description: 'Explicitly listed in the scope statement.' },
        { id: 'blog', label: 'blog.aegis-lab.test', description: 'Third-party hosted and excluded.' },
        { id: 'prod', label: 'prod.vault.aegis-lab.test', description: 'Production is explicitly excluded.' },
      ],
      correct: 'good',
    },
    rulesQuiz: {
      prompt: 'Which activity is permitted under these rules?',
      options: [
        { id: 'passive', label: 'Rate-limited, passive recon on an in-scope host', description: 'Allowed within the stated 2 req/s cap.' },
        { id: 'phish', label: 'Phishing staff to obtain credentials', description: 'Explicitly prohibited.' },
        { id: 'dos', label: 'Stress testing with a heavy payload', description: 'Prohibited: no DoS or destructive testing.' },
      ],
      correct: 'passive',
    },
  },
  {
    id: 'nimbus',
    name: 'Nimbus Cloud Console (FICTIONAL)',
    summary: 'Mock cloud management console with a synthetic control plane and API.',
    scope: ['console.nimbus-lab.test', 'api.nimbus-lab.test', 'docs.nimbus-lab.test'],
    excluded: ['status.nimbus-lab.test', '*.customer-nimbus.example', 'All partner integrations'],
    rules: ['No automated scanning above 1 req/s', 'No credential stuffing or password spraying', 'No testing of customer-owned projects', 'Use only the seeded demo tenant', 'Report immediately if you encounter live data'],
    knownDuplicate: 'Missing CSP headers on docs.nimbus-lab.test were reported as informative last cycle.',
    scopeQuiz: {
      prompt: 'Which target is clearly in scope for this program?',
      options: [
        { id: 'good', label: 'console.nimbus-lab.test', description: 'Named in the scope statement.' },
        { id: 'status', label: 'status.nimbus-lab.test', description: 'Explicitly out of scope.' },
        { id: 'customer', label: 'app.customer-nimbus.example', description: 'Customer-owned and excluded.' },
      ],
      correct: 'good',
    },
    rulesQuiz: {
      prompt: 'Which activity is permitted under these rules?',
      options: [
        { id: 'passive', label: 'Manual review of the seeded demo tenant', description: 'Allowed; stop if live data appears.' },
        { id: 'spray', label: 'Password spraying the login endpoint', description: 'Prohibited.' },
        { id: 'tenant', label: 'Probing a customer-owned project', description: 'Prohibited.' },
      ],
      correct: 'passive',
    },
  },
  {
    id: 'orbit',
    name: 'Orbit Payments Sandbox (FICTIONAL)',
    summary: 'Mock payment API with test cards only. No real money or real merchants exist here.',
    scope: ['sandbox.orbit-lab.test', 'api.sandbox.orbit-lab.test'],
    excluded: ['orbit-lab.test (production)', 'cards.orbit-lab.test', 'All issuing banks and merchants'],
    rules: ['Test card numbers only — never real card data', 'Maximum 2 requests per second', 'No state-changing requests outside the sandbox', 'No social engineering of support staff', 'Do not exfiltrate transaction records'],
    knownDuplicate: 'A verbose error message on the sandbox token endpoint was already reported.',
    scopeQuiz: {
      prompt: 'Which target is clearly in scope for this program?',
      options: [
        { id: 'good', label: 'api.sandbox.orbit-lab.test', description: 'Explicitly listed as a sandbox asset.' },
        { id: 'prod', label: 'orbit-lab.test', description: 'Production is excluded.' },
        { id: 'bank', label: 'bank.partner.example', description: 'Third-party bank is excluded.' },
      ],
      correct: 'good',
    },
    rulesQuiz: {
      prompt: 'Which activity is permitted under these rules?',
      options: [
        { id: 'testcard', label: 'Using published test card numbers in the sandbox', description: 'Allowed within the sandbox.' },
        { id: 'realcard', label: 'Using a real payment card to test charges', description: 'Prohibited.' },
        { id: 'support', label: 'Calling support while impersonating a merchant', description: 'Prohibited social engineering.' },
      ],
      correct: 'testcard',
    },
  },
];

const inventory: InventoryItem[] = [
  { id: 'v1', host: 'vault.aegis-lab.test', kind: 'Web app', note: 'Login, upload and shared-file pages', scope: { vault: true, nimbus: false, orbit: false } },
  { id: 'v2', host: 'api.vault.aegis-lab.test', kind: 'REST API', note: 'File metadata and download endpoints', scope: { vault: true, nimbus: false, orbit: false } },
  { id: 'v3', host: 'beta.vault.aegis-lab.test', kind: 'Beta app', note: 'New sharing features', scope: { vault: true, nimbus: false, orbit: false } },
  { id: 'v4', host: 'blog.aegis-lab.test', kind: 'Third-party blog', note: 'Hosted by an external vendor', scope: { vault: false, nimbus: false, orbit: false } },
  { id: 'n1', host: 'console.nimbus-lab.test', kind: 'Web console', note: 'Project and IAM management', scope: { vault: false, nimbus: true, orbit: false } },
  { id: 'n2', host: 'api.nimbus-lab.test', kind: 'Control-plane API', note: 'Identity and project endpoints', scope: { vault: false, nimbus: true, orbit: false } },
  { id: 'n3', host: 'status.nimbus-lab.test', kind: 'Status page', note: 'Excluded by policy', scope: { vault: false, nimbus: false, orbit: false } },
  { id: 'o1', host: 'sandbox.orbit-lab.test', kind: 'Merchant sandbox', note: 'Test transactions only', scope: { vault: false, nimbus: false, orbit: true } },
  { id: 'o2', host: 'api.sandbox.orbit-lab.test', kind: 'Payments API', note: 'Tokens and charges', scope: { vault: false, nimbus: false, orbit: true } },
  { id: 'o3', host: 'orbit-lab.test', kind: 'Production site', note: 'Explicitly excluded', scope: { vault: false, nimbus: false, orbit: false } },
];

const surfaces = [
  { id: 'login', label: 'Login / session flow' },
  { id: 'api', label: 'Authenticated API endpoint' },
  { id: 'upload', label: 'File upload handler' },
  { id: 'reset', label: 'Password-reset workflow' },
  { id: 'admin', label: 'Administrative panel' },
  { id: 'token', label: 'Token / secret handling' },
];

const stepTitles = [
  'Select a program', 'Read the scope', 'Read the rules', 'Identify in-scope assets',
  'Build an attack-surface map', 'Permitted recon', 'Identify a potential vulnerability',
  'Validate in an authorized lab', 'Assess severity / CVSS', 'Create a minimal PoC',
  'Write the report', 'Handle triage feedback',
];

const reconChoices: Choice[] = [
  { id: 'safe', label: 'Passive DNS, certificate transparency and manual review at ≤1–2 req/s on in-scope hosts', description: 'Policy-compliant and low impact.' },
  { id: 'aggressive', label: 'High-speed automated scan across the whole company domain', description: 'Hits out-of-scope hosts and violates rate limits.' },
  { id: 'phishing', label: 'Phish employees for credentials', description: 'Prohibited social engineering.' },
  { id: 'vendor', label: 'Probe a third-party vendor that looks related', description: 'Out of scope; never assume affiliation.' },
];

const vulnChoices: Choice[] = [
  { id: 'idor', label: 'IDOR on an authenticated, in-scope API endpoint', description: 'Testable with two seeded test accounts.' },
  { id: 'xss', label: 'Reflected XSS in a search parameter on an in-scope page', description: 'Testable in the sandbox with harmless markers.' },
  { id: 'sqli-prod', label: 'Time-based SQL injection on the excluded production host', description: 'Out of scope — do not test.' },
  { id: 'duplicate', label: 'A finding already listed in the program’s known-issues notes', description: 'Likely duplicate.' },
];

const validationChoices: Choice[] = [
  { id: 'lab', label: 'Reproduce against a local DVWA/crAPI instance with owned accounts and capture evidence', description: 'Safe, controlled, verifiable.' },
  { id: 'real', label: 'Exploit the live production database to prove maximum impact', description: 'Unauthorized and destructive.' },
  { id: 'friend', label: 'Ask a friend to let you test their employer’s website', description: 'No valid authorization.' },
  { id: 'skip', label: 'Skip validation and report from a single observation', description: 'Weak, unverified evidence.' },
];

const severityChoices: Choice[] = [
  { id: 'reasoned-high', label: 'High, with a documented vector and a clear explanation of prerequisites and impact', description: 'Reasoned and defensible.' },
  { id: 'reasoned-low', label: 'Low, because the issue needs an authenticated test account and exposes limited data', description: 'Reasoned and proportionate.' },
  { id: 'unreasoned', label: 'Critical / CVSS 10 because “it sounds severe”, with no vector or context', description: 'Unsupported severity claim.' },
];

const pocChoices: Choice[] = [
  { id: 'minimal', label: 'Minimal redacted request/response pair reproduced locally, with placeholder tokens', description: 'Safe and actionable.' },
  { id: 'destructive', label: 'Full live exploit with real tokens and a destructive payload', description: 'Unsafe and prohibited.' },
  { id: 'screenshot', label: 'A single screenshot with no steps or evidence', description: 'Insufficient for triage.' },
];

const evidenceChoices = [
  { id: 'scope', label: 'Quote from the in-scope policy' },
  { id: 'request', label: 'Redacted request/response pair' },
  { id: 'lab', label: 'Local lab reproduction steps' },
  { id: 'remediation', label: 'Suggested remediation' },
];

const triageChoices: Choice[] = [
  { id: 'supply', label: 'Reply with exact request, timestamp and the missing scoped evidence', description: 'Professional and useful.' },
  { id: 'argue', label: 'Insist the finding is critical without adding any detail', description: 'Unhelpful to triage.' },
  { id: 'self-close', label: 'Close the report yourself as a duplicate without checking', description: 'Premature conclusion.' },
  { id: 'ask-prod', label: 'Ask to test production directly to “prove” the impact', description: 'Unsafe request.' },
];

/* ------------------------------- Triage engine ------------------------------- */

type Criterion = { key: string; label: string; score: number; feedback: string };
type Verdict = 'Accepted' | 'Needs info' | 'Informative' | 'Duplicate' | 'Invalid';
type Result = { verdict: Verdict; criteria: Criterion[]; summary: string };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function criterion(key: string, label: string, score: number, good: string, bad: string): Criterion {
  return { key, label, score: clamp(score), feedback: clamp(score) >= 60 ? good : bad };
}

export default function SimulatorPage() {
  const [step, setStep] = useState(0);
  const [programId, setProgramId] = useState<string | null>(null);
  const [scopeAnswer, setScopeAnswer] = useState<string | null>(null);
  const [rulesAnswer, setRulesAnswer] = useState<string | null>(null);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [surfaceIds, setSurfaceIds] = useState<string[]>([]);
  const [recon, setRecon] = useState<string | null>(null);
  const [vuln, setVuln] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [cvssVector, setCvssVector] = useState('');
  const [poc, setPoc] = useState<string | null>(null);
  const [report, setReport] = useState({ summary: '', impact: '', steps: '', justification: '', evidence: [] as string[] });
  const [triage, setTriage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const program = programs.find((p) => p.id === programId) ?? null;

  const reset = () => {
    setStep(0); setProgramId(null); setScopeAnswer(null); setRulesAnswer(null); setAssetIds([]);
    setSurfaceIds([]); setRecon(null); setVuln(null); setValidation(null); setSeverity(null);
    setCvssVector(''); setPoc(null); setReport({ summary: '', impact: '', steps: '', justification: '', evidence: [] });
    setTriage(null); setResult(null);
  };

  const toggleIn = (list: string[], id: string) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const canAdvance = () => {
    switch (step) {
      case 0: return Boolean(programId);
      case 1: return Boolean(scopeAnswer);
      case 2: return Boolean(rulesAnswer);
      case 3: return assetIds.length > 0;
      case 4: return surfaceIds.length > 0;
      case 5: return Boolean(recon);
      case 6: return Boolean(vuln);
      case 7: return Boolean(validation);
      case 8: return Boolean(severity);
      case 9: return Boolean(poc);
      case 10: return report.summary.trim().length > 0 && report.impact.trim().length > 0 && report.steps.trim().length > 0;
      case 11: return Boolean(triage);
      default: return false;
    }
  };

  const buildResult = (): Result => {
    const correctScope = program?.scopeQuiz.correct === scopeAnswer;
    const correctRules = program?.rulesQuiz.correct === rulesAnswer;
    const correctAssets = program ? inventory.filter((i) => i.scope[program.id]).map((i) => i.id) : [];
    const falsePositives = assetIds.filter((id) => !correctAssets.includes(id)).length;
    const missed = correctAssets.filter((id) => !assetIds.includes(id)).length;

    let scopeScore = 100;
    if (!correctScope) scopeScore -= 25;
    if (!correctRules) scopeScore -= 15;
    scopeScore -= falsePositives * 25;
    scopeScore -= missed * 8;
    if (recon === 'aggressive' || recon === 'vendor') scopeScore -= 20;
    if (recon === 'phishing') scopeScore -= 30;
    if (vuln === 'sqli-prod') scopeScore -= 35;

    let evidenceScore = 25;
    if (validation === 'lab') evidenceScore += 35;
    else if (validation === 'skip') evidenceScore += 5;
    if (poc === 'minimal') evidenceScore += 30;
    else if (poc === 'screenshot') evidenceScore += 10;
    evidenceScore += report.evidence.length * 8;
    if (report.summary.trim().length >= 80) evidenceScore += 8;
    if (triage === 'supply') evidenceScore += 10;
    if (triage === 'argue') evidenceScore -= 10;
    if (triage === 'self-close' || triage === 'ask-prod') evidenceScore -= 15;

    let impactScore = 15;
    const impactLen = report.impact.trim().length;
    const stepsLen = report.steps.trim().length;
    const justificationLen = report.justification.trim().length;
    if (impactLen >= 120) impactScore += 35;
    else if (impactLen >= 70) impactScore += 20;
    if (stepsLen >= 80) impactScore += 20;
    if (justificationLen >= 60) impactScore += 15;
    if (report.summary.trim().length >= 60) impactScore += 10;
    if (vuln === 'idor' || vuln === 'xss') impactScore += 5;

    let safeScore = 100;
    if (validation === 'real' || validation === 'friend') safeScore -= 70;
    if (validation === 'skip') safeScore -= 15;
    if (poc === 'destructive') safeScore -= 70;
    if (poc === 'screenshot') safeScore -= 10;
    if (recon === 'phishing') safeScore -= 40;
    if (recon === 'aggressive') safeScore -= 25;
    if (recon === 'vendor') safeScore -= 20;
    if (vuln === 'sqli-prod') safeScore -= 45;
    if (triage === 'ask-prod') safeScore -= 40;

    let severityScore = 15;
    if (severity === 'reasoned-high' || severity === 'reasoned-low') severityScore += 65;
    else severityScore += 10;
    if (/AV[:=]/i.test(cvssVector)) severityScore += 20;
    if (justificationLen >= 60) severityScore += 10;

    const criteria: Criterion[] = [
      criterion('scope', 'Scope compliance', scopeScore,
        'You read the policy, chose in-scope assets and kept recon low-impact.',
        'Scope was misread: out-of-scope assets, prohibited recon or an excluded target crept into the workflow.'),
      criterion('evidence', 'Evidence quality', evidenceScore,
        'Local reproduction plus redacted request/response and clear report sections give triage something to verify.',
        'Evidence is thin: validation, a minimal PoC and at least two supporting artifacts are needed.'),
      criterion('impact', 'Impact clarity', impactScore,
        'You explained who is affected, what an attacker gains and exactly how to reproduce it.',
        'Impact and reproduction steps are too vague for a triager to act on.'),
      criterion('safe', 'Safe PoC', safeScore,
        'The proof of concept was minimal, local, redacted and non-destructive.',
        'Unsafe behaviour: real systems, real data, destructive payloads or unauthorized access appeared in the workflow.'),
      criterion('severity', 'Severity reasoning', severityScore,
        'Severity is tied to a vector, prerequisites and realistic impact rather than intuition.',
        'The severity claim lacks a CVSS vector, context or a defensible justification.'),
    ];

    const byKey = Object.fromEntries(criteria.map((c) => [c.key, c.score]));
    let verdict: Verdict;
    if (
      byKey.safe < 55 || byKey.scope < 55 || falsePositives > 0 ||
      vuln === 'sqli-prod' || recon === 'phishing' || recon === 'aggressive' || recon === 'vendor'
    ) verdict = 'Invalid';
    else if (vuln === 'duplicate') verdict = 'Duplicate';
    else if (byKey.evidence < 55 || byKey.impact < 55) verdict = 'Needs info';
    else if (byKey.severity < 55) verdict = 'Informative';
    else verdict = 'Accepted';

    const summary = verdict === 'Accepted'
      ? 'A well-scoped, safely reproduced finding with actionable evidence. A real program would now move to remediation discussion.'
      : verdict === 'Needs info'
        ? 'Triage can see a plausible finding but needs clearer reproduction steps and supporting evidence before validation.'
        : verdict === 'Informative'
          ? 'The behaviour is real but the reported impact or severity is not sufficient for a bounty decision.'
          : verdict === 'Duplicate'
            ? 'The issue matches an already-known report in this program. Always check known-issue notes before submitting.'
            : 'The report cannot be accepted because scope or safety rules were violated at some step.';

    return { verdict, criteria, summary };
  };

  const next = () => {
    if (step < 11) { setStep((s) => s + 1); return; }
    setResult(buildResult());
    setStep(12);
  };

  const verdictTone = result?.verdict === 'Accepted' ? 'mint' : result?.verdict === 'Invalid' ? 'rose' : result?.verdict === 'Duplicate' ? 'default' : 'amber';

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Practice / Workflow Simulator"
        title="Professional Bug Bounty Workflow Simulator"
        description="Walk a finding from program selection to triage decision. Every choice is scored on scope compliance, evidence, impact, PoC safety and severity reasoning."
        actions={<Link href="/ethics" className="btn-ghost"><ShieldCheck className="h-4 w-4 text-mint-400" /> Ethics &amp; legal</Link>}
      />

      <Panel className="mb-6 border-amber-500/30 bg-amber-500/[0.05] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
          <div className="flex-1">
            <div className="font-semibold text-amber-200">Simulation using synthetic data</div>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-100/75">
              All programs, hosts, policies and findings below are fictional <code className="font-mono">.test</code> names.
              Nothing here contacts a network. The workflow teaches judgment and report structure only — real testing
              requires explicit authorization and must stay inside the published scope.
            </p>
          </div>
          <Badge tone="amber"><Flag className="h-3 w-3" /> Fictional scenario</Badge>
        </div>
      </Panel>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Workflow step" value={result ? 'Complete' : `${Math.min(step + 1, 12)} / 12`} sub="Step-driven simulation" icon={<Workflow className="h-4 w-4" />} />
        <StatCard label="Selected program" value={program ? program.name.split(' (')[0] : '—'} sub={program ? 'Fictional program' : 'Choose one at step 1'} icon={<Target className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Triage verdict" value={result ? result.verdict : 'Pending'} sub={result ? 'Based on five criteria' : 'Complete all 12 steps'} icon={<ClipboardList className="h-4 w-4" />} tone="slate" />
      </div>

      <Panel className="mb-6 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="label">Progress · {result ? 'Simulation complete' : stepTitles[step]}</div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-mint-400">{result ? 100 : Math.round((step / 12) * 100)}%</span>
            <button className="btn-ghost" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset</button>
          </div>
        </div>
        <ProgressBar value={result ? 100 : (step / 12) * 100} />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {stepTitles.map((title, i) => (
            <button
              key={title}
              className={cn('rounded-full border px-2 py-1 text-[10px] transition', i === step && !result ? 'border-mint-500/40 bg-mint-500/10 text-mint-300' : i < step || result ? 'border-ink-600 bg-ink-800 text-slate-400' : 'border-ink-700 text-ink-600')}
              title={title}
              onClick={() => { if (i <= step) { setResult(null); setStep(i); } }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </Panel>

      {result ? (
        <div className="animate-fade-up space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="label text-mint-400">Triage decision</div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-50">Report outcome: {result.verdict}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{result.summary}</p>
              </div>
              <Badge tone={verdictTone} className="text-sm"><CheckCircle2 className="h-4 w-4" /> {result.verdict}</Badge>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.criteria.map((c) => (
              <Panel key={c.key} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-100">{c.label}</div>
                  <div className="font-mono text-sm text-mint-400">{c.score}/100</div>
                </div>
                <ProgressBar className="mt-3" value={c.score} tone={c.score >= 60 ? 'mint' : 'cyan'} />
                <p className="mt-3 text-[13px] leading-relaxed text-muted">{c.feedback}</p>
              </Panel>
            ))}
          </div>

          <Panel className="p-5">
            <div className="label mb-3">Your final report snapshot</div>
            <div className="grid gap-2 text-[13px] text-slate-300 md:grid-cols-2">
              <div><span className="text-muted">Program:</span> {program?.name ?? '—'}</div>
              <div><span className="text-muted">In-scope assets selected:</span> {assetIds.length}</div>
              <div><span className="text-muted">Potential issue:</span> {vulnChoices.find((c) => c.id === vuln)?.label ?? '—'}</div>
              <div><span className="text-muted">Validation:</span> {validationChoices.find((c) => c.id === validation)?.label ?? '—'}</div>
              <div className="md:col-span-2"><span className="text-muted">Summary:</span> {report.summary || '—'}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={reset}><RotateCcw className="h-4 w-4" /> Run again</button>
              <button className="btn-ghost" onClick={() => { setResult(null); setStep(10); }}><ArrowLeft className="h-4 w-4" /> Revise report</button>
              <Link className="btn-ghost" href="/projects"><FileSearch className="h-4 w-4" /> Practice with projects</Link>
            </div>
          </Panel>
        </div>
      ) : (
        <Panel className="p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-ink-800 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-mint-500/25 bg-mint-500/10 font-mono text-sm text-mint-300">{step + 1}</span>
            <div>
              <div className="label">Step {step + 1} of 12</div>
              <h2 className="text-lg font-semibold text-slate-50">{stepTitles[step]}</h2>
            </div>
          </div>

          {step === 0 && (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-muted">Choose a fictional program. Each has its own synthetic scope and policy — you will be scored on reading them carefully.</p>
              <div className="grid gap-3 md:grid-cols-3">
                {programs.map((p) => (
                  <button key={p.id} className={cn('rounded-xl border p-4 text-left transition', programId === p.id ? 'border-mint-500/40 bg-mint-500/[0.07]' : 'border-ink-700 bg-ink-900 hover:border-ink-600')} onClick={() => setProgramId(p.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">{p.name}</span>
                      {programId === p.id && <Check className="h-4 w-4 shrink-0 text-mint-400" />}
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-muted">{p.summary}</p>
                    <Badge tone="amber" className="mt-3">Fictional</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && program && (
            <div>
              <p className="mb-4 text-sm text-muted">Read the published scope. Nothing outside it may be touched, even if it looks related.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-mint-500/25 bg-mint-500/[0.04] p-4">
                  <div className="label mb-2 text-mint-400">In scope</div>
                  <ul className="space-y-1.5 text-[13px] text-slate-200">{program.scope.map((s) => <li key={s}>✓ {s}</li>)}</ul>
                </div>
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.04] p-4">
                  <div className="label mb-2 text-rose-300">Out of scope</div>
                  <ul className="space-y-1.5 text-[13px] text-slate-200">{program.excluded.map((s) => <li key={s}>✕ {s}</li>)}</ul>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-slate-100">{program.scopeQuiz.prompt}</div>
                <ChoiceList choices={program.scopeQuiz.options} value={scopeAnswer} onChange={setScopeAnswer} />
              </div>
            </div>
          )}

          {step === 2 && program && (
            <div>
              <p className="mb-4 text-sm text-muted">Rules are limits on behaviour, not suggestions. Respect rate caps and never use real data or people.</p>
              <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
                <div className="label mb-2">Program rules</div>
                <ul className="space-y-1.5 text-[13px] text-slate-300">{program.rules.map((r) => <li key={r}>• {r}</li>)}</ul>
              </div>
              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-slate-100">{program.rulesQuiz.prompt}</div>
                <ChoiceList choices={program.rulesQuiz.options} value={rulesAnswer} onChange={setRulesAnswer} />
              </div>
            </div>
          )}

          {step === 3 && program && (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-muted">Select every asset from this synthetic inventory that is in scope for <strong className="text-slate-200">{program.name}</strong>. Decoys from other programs and excluded hosts are present.</p>
              <div className="grid gap-2 md:grid-cols-2">
                {inventory.map((item) => (
                  <label key={item.id} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-[13px] transition', assetIds.includes(item.id) ? 'border-mint-500/40 bg-mint-500/[0.06]' : 'border-ink-700 bg-ink-900')}>
                    <input type="checkbox" className="mt-0.5 accent-mint-500" checked={assetIds.includes(item.id)} onChange={() => setAssetIds((a) => toggleIn(a, item.id))} />
                    <span>
                      <span className="block font-mono text-[12px] text-slate-100">{item.host}</span>
                      <span className="block text-[11px] text-muted">{item.kind} — {item.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-muted">From the assets you selected, map the components you would examine. Broad maps help prioritization; they are not permission to test everything at once.</p>
              <div className="grid gap-2 md:grid-cols-2">
                {surfaces.map((s) => (
                  <label key={s.id} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] transition', surfaceIds.includes(s.id) ? 'border-cyanx-500/40 bg-cyanx-500/[0.06]' : 'border-ink-700 bg-ink-900')}>
                    <input type="checkbox" className="accent-mint-500" checked={surfaceIds.includes(s.id)} onChange={() => setSurfaceIds((a) => toggleIn(a, s.id))} />
                    <span className="text-slate-200">{s.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">Selected: {surfaceIds.length} component{surfaceIds.length === 1 ? '' : 's'} · keep the map inside the authorized scope.</p>
            </div>
          )}

          {step === 5 && <ChoiceStep prompt="How do you begin reconnaissance?" hint="Prefer passive, low-volume, in-scope observation and obey the program’s rate limits." choices={reconChoices} value={recon} onChange={setRecon} />}
          {step === 6 && program && <ChoiceStep prompt="Which potential issue do you pursue?" hint={`Program note: ${program.knownDuplicate} Out-of-scope hosts are never test targets.`} choices={vulnChoices} value={vuln} onChange={setVuln} />}
          {step === 7 && <ChoiceStep prompt="How do you validate the candidate issue?" hint="Validation belongs in a local lab with accounts you own. Real impact is demonstrated with minimal, authorized evidence." choices={validationChoices} value={validation} onChange={setValidation} />}

          {step === 8 && (
            <div>
              <ChoiceStep prompt="How do you assess severity?" hint="Severity follows the vector, prerequisites and demonstrable impact — not intuition." choices={severityChoices} value={severity} onChange={setSeverity} />
              <div className="mt-5">
                <label className="label mb-2 block" htmlFor="cvss">CVSS vector (optional, but scored)</label>
                <input id="cvss" className="input font-mono" value={cvssVector} onChange={(e) => setCvssVector(e.target.value)} placeholder="CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N" />
                <p className="mt-2 text-xs text-muted">Example format only — derive the real vector from your own lab evidence.</p>
              </div>
            </div>
          )}

          {step === 9 && <ChoiceStep prompt="Which proof of concept do you include?" hint="Minimal, redacted, reproducible. Never include real tokens, live data or destructive actions." choices={pocChoices} value={poc} onChange={setPoc} />}

          {step === 10 && (
            <div>
              <p className="mb-4 text-sm text-muted">Draft the report. Longer, concrete sections score better: explain who is affected, the exact reproduction steps and a realistic fix.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Summary" value={report.summary} onChange={(v) => setReport((r) => ({ ...r, summary: v }))} placeholder="One paragraph: what the issue is and where it lives…" />
                <TextField label="Impact" value={report.impact} onChange={(v) => setReport((r) => ({ ...r, impact: v }))} placeholder="Who is affected, what an attacker gains, and why it matters…" />
                <TextField label="Steps to reproduce" value={report.steps} onChange={(v) => setReport((r) => ({ ...r, steps: v }))} placeholder="Numbered, minimal steps from a seeded test account…" />
                <TextField label="Severity justification" value={report.justification} onChange={(v) => setReport((r) => ({ ...r, justification: v }))} placeholder="Vector, prerequisites and limiting factors…" />
              </div>
              <div className="mt-5">
                <div className="label mb-2">Supporting evidence included</div>
                <div className="flex flex-wrap gap-2">
                  {evidenceChoices.map((e) => (
                    <label key={e.id} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12px]', report.evidence.includes(e.id) ? 'border-mint-500/40 bg-mint-500/[0.06] text-mint-200' : 'border-ink-700 bg-ink-900 text-slate-300')}>
                      <input type="checkbox" className="accent-mint-500" checked={report.evidence.includes(e.id)} onChange={() => setReport((r) => ({ ...r, evidence: toggleIn(r.evidence, e.id) }))} />
                      {e.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 11 && (
            <div>
              <div className="mb-4 rounded-xl border border-cyanx-500/25 bg-cyanx-500/[0.04] p-4">
                <div className="label mb-1 text-cyanx-300">Synthetic triage reply</div>
                <p className="text-[13px] leading-relaxed text-slate-300">
                  “Thanks for the report. We could not reproduce because the steps reference a stale endpoint.
                  Please send the exact request, a timestamp and the authorization context.”
                </p>
              </div>
              <ChoiceStep prompt="How do you respond?" hint="Good triage responses add verifiable detail and stay within the program rules." choices={triageChoices} value={triage} onChange={setTriage} />
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 pt-5">
            <button className="btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" /> Back</button>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted sm:inline">{canAdvance() ? 'Ready to continue' : 'Make a choice to continue'}</span>
              <button className="btn-primary" disabled={!canAdvance()} onClick={next}>
                {step === 11 ? 'Submit for triage' : 'Next step'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Panel>
      )}

      <div className="mt-8 rounded-xl border border-ink-700 bg-ink-900/60 p-5 text-[13px] leading-relaxed text-muted">
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-200"><Terminal className="h-4 w-4 text-mint-400" /> Debrief</div>
        A real program outcome depends on evidence, scope and triage policy. A safe workflow always starts with the
        rules, stays inside scope, validates locally, writes a minimal PoC and communicates precisely. Nothing in
        this simulator authorizes testing any real system.
      </div>
    </div>
  );
}

function ChoiceList({ choices, value, onChange }: { choices: Choice[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {choices.map((c) => (
        <button key={c.id} className={cn('flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition', value === c.id ? 'border-mint-500/40 bg-mint-500/[0.06]' : 'border-ink-700 bg-ink-900 hover:border-ink-600')} onClick={() => onChange(c.id)}>
          <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', value === c.id ? 'border-mint-400 bg-mint-500/20' : 'border-ink-600')}>
            {value === c.id && <Check className="h-2.5 w-2.5 text-mint-400" />}
          </span>
          <span className="flex-1">
            <span className="block text-[13px] leading-relaxed text-slate-200">{c.label}</span>
            {c.description && <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{c.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function ChoiceStep({ prompt, hint, choices, value, onChange }: { prompt: string; hint: string; choices: Choice[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-100">{prompt}</p>
      <p className="mb-4 text-[12px] leading-relaxed text-muted">{hint}</p>
      <ChoiceList choices={choices} value={value} onChange={onChange} />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label mb-2 block">{label}</span>
      <textarea className="input min-h-[96px] resize-y text-[13px]" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
