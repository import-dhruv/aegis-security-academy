import type { Metadata } from 'next';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  ExternalLink as ExternalLinkIcon,
  FileCheck2,
  Gavel,
  Globe2,
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Badge, ExternalLink, PageHeader, Panel } from '@/components/ui';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Rules, Ethics & Legal Framework',
  description:
    'The authorization boundary, legal and ethical rules of engagement, safe practice hierarchy, disclosure workflow and legal frameworks for security research.',
};

type Tone = 'rose' | 'amber' | 'mint' | 'cyan';

const toneClasses: Record<Tone, string> = {
  rose: 'border-rose-500/45 bg-rose-500/[0.07]',
  amber: 'border-amber-500/40 bg-amber-500/[0.06]',
  mint: 'border-mint-500/35 bg-mint-500/[0.06]',
  cyan: 'border-cyanx-500/35 bg-cyanx-500/[0.06]',
};

const iconToneClasses: Record<Tone, string> = {
  rose: 'text-rose-300',
  amber: 'text-amber-300',
  mint: 'text-mint-300',
  cyan: 'text-cyanx-300',
};

function Callout({
  tone = 'amber',
  icon,
  title,
  children,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border p-5 md:p-6', toneClasses[tone])}>
      <div className={cn('mb-2.5 flex items-center gap-2.5 text-sm font-semibold tracking-wide', iconToneClasses[tone])}>
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-[14px] leading-7 text-slate-300">{children}</div>
    </div>
  );
}

function Section({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="mb-5 flex items-start gap-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-mint-500/30 bg-mint-500/10 font-mono text-sm font-semibold text-mint-300">
          {String(n).padStart(2, '0')}
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h2>
          {subtitle && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4 sm:pl-[52px]">{children}</div>
    </section>
  );
}

function Bullets({ items, tone = 'mint' }: { items: string[]; tone?: Tone }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[14px] leading-7 text-slate-300">
          {tone === 'rose' ? (
            <X className="mt-1.5 h-4 w-4 shrink-0 text-rose-400" />
          ) : (
            <Check className="mt-1.5 h-4 w-4 shrink-0 text-mint-400" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const checklist = [
  'Written scope — a signed or explicitly approved document naming the engagement and the tester.',
  'Dates and windows — exact start/end dates, allowed hours and maintenance windows.',
  'Asset list — every in-scope domain, IP, app, API and environment, plus explicit exclusions.',
  'Rules of engagement — approved techniques, tooling constraints and escalation path.',
  'Emergency contact — a named, reachable contact on the owner side for immediate stop/escalation.',
  'Data handling — what data may be touched, how evidence is stored, redacted and deleted.',
  'Tool restrictions — which scanners, fuzzers or scripts are permitted and at what intensity.',
  'Third-party permissions — approval from cloud/SaaS providers and any other affected parties.',
  'Rate limits — request budgets, concurrency caps and timeouts agreed in advance.',
  'Stop conditions — the exact signals (errors, load, data exposure) that mean pause immediately.',
];

const disclosureSteps = [
  {
    title: 'Discover and verify',
    body: 'Confirm the finding in a safe, minimal way and understand its real impact. Avoid touching more data than necessary to establish the issue.',
  },
  {
    title: 'Contain and protect evidence',
    body: 'Capture only what proves the issue: redacted request/response snippets, timestamps, and sanitized screenshots. Never copy real personal data or secrets into your notes.',
  },
  {
    title: 'Notify privately',
    body: 'Use the owner’s security contact, security.txt, disclosure platform or the bug-bounty channel. Give a clear description, impact, steps to reproduce and your minimal evidence.',
  },
  {
    title: 'Allow remediation time',
    body: 'Give the owner a reasonable, program-defined window to investigate and fix (often 30–90 days). Avoid public pressure while they work; ask for status updates politely.',
  },
  {
    title: 'Coordinate the details',
    body: 'Agree on disclosure timing, CVE assignment through a CNA where appropriate, and what may be described publicly. Share additional detail privately on request.',
  },
  {
    title: 'Publish responsibly',
    body: 'After a fix or an agreed date, publish a sanitized account that teaches the lesson without providing a ready-to-use attack against unpatched systems. Credit the owner appropriately.',
  },
];

const hierarchy = [
  { title: 'Systems you own', body: 'Your own machine, VM or account. Full freedom, full responsibility.' },
  { title: 'Local labs', body: 'Isolated, intentionally vulnerable apps such as DVWA or Juice Shop in a local VM.' },
  { title: 'CTFs and authorized platforms', body: 'Challenge ranges and training grounds with explicit permission to play.' },
  { title: 'Explicit written authorization', body: 'A signed engagement with a defined scope, dates and rules of engagement.' },
  { title: 'Bug-bounty scope', body: 'Only the assets, vulnerability types and conditions the program actually lists.' },
];

const resources = [
  { name: 'OWASP', url: 'https://owasp.org/', note: 'Web application security knowledge and the Top 10.' },
  { name: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework', note: 'Risk-based security functions and outcomes.' },
  { name: 'CISA', url: 'https://www.cisa.gov/', note: 'Advisories, known exploited vulnerabilities and guidance.' },
  { name: 'FIRST CVSS', url: 'https://www.first.org/cvss/', note: 'The standard vulnerability severity scoring system.' },
  { name: 'MITRE CWE', url: 'https://cwe.mitre.org/', note: 'Common weakness enumeration and software weaknesses.' },
  { name: 'MeitY', url: 'https://www.meity.gov.in/', note: 'India’s Ministry of Electronics and IT — policy and rules.' },
  { name: 'CERT-In', url: 'https://www.cert-in.org.in/', note: 'India’s national computer security incident response team.' },
  { name: 'NVD', url: 'https://nvd.nist.gov/', note: 'Public vulnerability records and severity data.' },
];

export default function EthicsPage() {
  return (
    <div className="animate-fade-up space-y-14 pb-10">
      <PageHeader
        eyebrow="Governance · read before any practice"
        title="Rules, Ethics & Legal Framework"
        description="Knowledge of how systems fail is powerful. This page defines the boundary between learning security and practising it lawfully — and it applies to every chapter, lab, tool and tutor answer in this academy."
        actions={
          <>
            <Badge tone="rose"><Scale className="h-3 w-3" /> Non-negotiable</Badge>
            <Badge tone="amber"><ShieldAlert className="h-3 w-3" /> Read first</Badge>
          </>
        }
      />

      {/* The boundary banner */}
      <div className={cn('relative overflow-hidden rounded-2xl border-2 p-6 md:p-10', toneClasses.rose)}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="mb-4 flex items-center gap-2 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
            <span className="label text-rose-300">The authorization boundary</span>
          </div>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-slate-50 md:text-3xl">
            Educational knowledge is not permission to test any real system.
          </h2>
          <p className="mt-4 text-[15px] leading-8 text-slate-300">
            Everything in this academy is for learning in systems you own, in isolated labs, or in
            environments where you have been given explicit, written permission. Reading about a
            vulnerability, a tool or a technique does <strong className="font-semibold text-rose-200">not</strong>{' '}
            authorize you to point it at a website, a company, another person’s account or any
            network you do not control. A system being vulnerable, publicly reachable, or “interesting”
            is never consent. If you are unsure whether you are allowed, the answer is no — stop and
            ask the owner.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="rose">Own it or have written permission</Badge>
            <Badge tone="amber">Scope is specific, not implied</Badge>
            <Badge tone="default">When in doubt, stop</Badge>
          </div>
        </div>
      </div>

      <Callout tone="amber" icon={<CircleAlert className="h-4 w-4" />} title="General education, not legal advice">
        This page is a general educational overview of ethical norms and common legal concepts. It is
        <strong className="font-semibold text-slate-100"> not legal advice</strong>, does not create an
        attorney–client relationship, and is not a complete or current statement of any law. Laws vary
        between countries and states, change over time, and depend on specific facts. If you have a
        real question about what you may do, consult a qualified lawyer in the relevant jurisdiction
        before acting.
      </Callout>

      {/* 01 — Legal boundaries */}
      <Section
        n={1}
        title="The legal boundaries of security testing"
        subtitle="Understanding the categories of conduct the law commonly addresses helps you stay deliberately inside them."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Across many jurisdictions, the law is concerned with more than damage. Unauthorized
            access to a computer or account, interception of communications, alteration or deletion
            of data, and the possession or distribution of tools intended for misuse can each be
            addressed separately. A “look but don’t touch” claim is not a reliable defence: merely
            accessing a system without permission can be enough to create criminal or civil exposure.
            Contractual rules — acceptable-use policies, cloud terms, employment agreements and
            program policies — apply alongside the law.
          </p>
          <div className="mt-5">
            <Bullets
              items={[
                'Permission must come from the owner, or from someone legally able to authorize testing on their behalf.',
                'Authorization is specific: which systems, which techniques, which time window, which people.',
                'Publicly reachable does not mean publicly testable.',
                'You are responsible for knowing the law where you are and where the target system operates.',
                'Good intentions and educational purpose do not replace permission.',
              ]}
            />
          </div>
        </Panel>
      </Section>

      {/* 02 — Explicit authorization */}
      <Section
        n={2}
        title="Explicit authorization"
        subtitle="Permission should be clear, documented, current and given by the right person."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Treat authorization as a contract-like record rather than a casual conversation. It should
            name the tester(s), the owner, the exact assets, the permitted activities, the time window
            and a point of contact. Verify that the person granting it can actually authorize tests on
            that system — a tenant can usually authorize their own application configuration, but not
            the underlying provider’s infrastructure. Permission is not transferable and does not carry
            over to new assets discovered mid-test; those require an explicit amendment.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-mint-500/25 bg-mint-500/[0.05] p-4">
              <div className="label mb-2 text-mint-300">Counts as authorization</div>
              <p className="text-[13px] leading-6 text-slate-300">
                A signed engagement letter, an approved bug-bounty scope page, or a written message
                from the asset owner that clearly states what is permitted.
              </p>
            </div>
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/[0.05] p-4">
              <div className="label mb-2 text-rose-300">Does not</div>
              <p className="text-[13px] leading-6 text-slate-300">
                A verbal “sure, go ahead” with no scope, a friend’s assurance, an old expired
                permission, or a public program page you have not actually read.
              </p>
            </div>
          </div>
        </Panel>
      </Section>

      {/* 03 — Scope restrictions */}
      <Section
        n={3}
        title="Scope restrictions"
        subtitle="Scope is the list of things you are allowed to touch. If it is not written down, treat it as out of scope."
      >
        <Panel className="p-5 md:p-6">
          <Bullets
            items={[
              'Assets: exact domains, IPs, hosts, APIs, mobile apps and environments (production vs staging).',
              'Exclusions: third-party services, shared infrastructure, payment systems, health or financial records, and staff devices.',
              'Techniques: which classes of test are allowed and which are prohibited (for example, no denial of service or social engineering).',
              'Time: permitted dates and hours, plus any change-freeze or maintenance windows.',
              'Data: the categories of data you may encounter and the limits on viewing or storing it.',
            ]}
          />
          <p className="mt-5 border-t border-ink-800 pt-4 text-[13px] leading-6 text-muted">
            During a test you may discover related systems that look promising. Do not follow them
            without written approval. Pause, document what you found and ask the owner to extend the
            scope if appropriate.
          </p>
        </Panel>
      </Section>

      {/* 04 — Rules of engagement */}
      <Section
        n={4}
        title="Rules of engagement"
        subtitle="The operating agreement that turns permission into a controlled, safe activity."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            A rules-of-engagement (RoE) document should cover objectives, named testers, test windows,
            approved tools and intensity, escalation and emergency contacts, evidence handling,
            stop conditions, and the disclosure timeline. For longer engagements, agree on check-ins
            and a change-control step before any new target or technique is added. The RoE exists to
            protect both sides: it makes expectations explicit and gives you a clear process to follow
            when something unexpected happens.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Objectives', 'Personnel', 'Windows', 'Tools', 'Escalation', 'Evidence', 'Stop conditions', 'Disclosure'].map((tag) => (
              <span key={tag} className="chip">{tag}</span>
            ))}
          </div>
        </Panel>
      </Section>

      {/* 05 — Disclosure */}
      <Section
        n={5}
        title="Responsible and coordinated disclosure"
        subtitle="Report privately, give the owner time to fix, and coordinate what becomes public."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Coordinated disclosure means giving the organization a fair opportunity to understand and
            remediate a problem before details are made public. Use the channel the owner designates —
            a security.txt file, a security contact, a disclosure platform or the bug-bounty program.
            A useful report describes the impact, the affected asset, minimal reproduction steps and
            sanitized evidence. Avoid threats, demands or publicity as leverage; those damage trust
            and can turn a cooperative process into a legal one.
          </p>
          <div className="mt-5">
            <Bullets
              items={[
                'Respect the program’s or owner’s stated disclosure window before publishing anything.',
                'Coordinate CVE assignment through a CNA where the case warrants it.',
                'Do not release a working exploit for an unpatched issue; sanitize examples instead.',
                'Accept that some reports are duplicates, out of scope or closed without a reward.',
              ]}
            />
          </div>
        </Panel>
      </Section>

      {/* 06 — Privacy */}
      <Section
        n={6}
        title="Privacy and data minimization"
        subtitle="Collect the least data needed to make the point — and no more."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Use synthetic records and dedicated test accounts wherever possible. If real personal data
            appears incidentally, stop touching it and record only the minimum abstract fact needed to
            describe the issue — for example, “a record’s fields were exposed” or “approximately N
            records were reachable” — rather than the contents. Redact screenshots, delete temporary
            copies when the engagement ends, and follow the owner’s instructions. These habits mirror
            widely accepted data-protection principles: purpose limitation, minimization, storage
            limitation, accuracy and confidentiality.
          </p>
        </Panel>
      </Section>

      {/* 07 — Sensitive information */}
      <Section
        n={7}
        title="Handling sensitive information"
        subtitle="Credentials, keys, tokens and private data are not evidence to be collected."
      >
        <Panel className="p-5 md:p-6">
          <Bullets
            items={[
              'Never copy passwords, API keys, session tokens, private keys, source code or backups into your notes or reports.',
              'Report the presence and location of an exposed secret so the owner can rotate it — do not use it.',
              'Never paste sensitive material into a chatbot, a public repository, a paste site or a screenshot.',
              'Store legitimate reports encrypted, limit access, and delete them when the retention period ends.',
              'If you believe you have exposed a secret, tell the owner promptly so it can be revoked.',
            ]}
          />
        </Panel>
      </Section>

      {/* 08 — Evidence */}
      <Section
        n={8}
        title="Evidence collection"
        subtitle="Enough to demonstrate the finding, gathered carefully and kept securely."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Good evidence is minimal, accurate and reproducible: UTC timestamps, the affected endpoint,
            redacted request/response excerpts, sanitized screenshots, and hashes of any artifact you
            must keep. Record who collected each item and when. Do not modify the target system to
            “improve” a screenshot, and never collect bulk datasets to make an impact look larger.
            Preserve what you need for the report, then delete it according to the agreed handling plan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="cyan"><FileCheck2 className="h-3 w-3" /> Redact secrets</Badge>
            <Badge tone="cyan"><Lock className="h-3 w-3" /> Store securely</Badge>
            <Badge tone="cyan"><ShieldCheck className="h-3 w-3" /> Keep it minimal</Badge>
          </div>
        </Panel>
      </Section>

      {/* 09 — Safe PoC */}
      <Section
        n={9}
        title="Safe proof-of-concept design"
        subtitle="Prove the point with the smallest, least harmful demonstration that works."
      >
        <Panel className="p-5 md:p-6">
          <Bullets
            items={[
              'Use your own test account and synthetic data; never a real user’s records.',
              'Prefer metadata — a count, a field name, a benign marker — over dumping actual content.',
              'Make the PoC deterministic and low-volume so it cannot be mistaken for an attack or cause load.',
              'Avoid destructive payloads, persistence, lateral movement or anything that changes system state.',
              'Run it only inside the authorized environment and stop as soon as the point is proven.',
            ]}
          />
        </Panel>
      </Section>

      {/* 10 — Disruption */}
      <Section
        n={10}
        title="Avoiding service disruption"
        subtitle="Availability is a security property too — and outages harm real people."
      >
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Respect request budgets, concurrency limits and timeouts. Do not run denial-of-service
            tests, aggressive fuzzing or large-scale crawling against production unless the engagement
            explicitly permits it in a controlled window. Avoid expensive endpoints and bulk exports,
            watch for unusual error rates or latency, and use the emergency contact to pause if the
            system behaves unexpectedly. Do not delete, modify or “clean up” anything on the target.
          </p>
        </Panel>
      </Section>

      {/* 11 — Unauthorized access */}
      <Section
        n={11}
        title="Avoiding unauthorized access"
        subtitle="Technical ability is not entitlement."
      >
        <Panel className="p-5 md:p-6">
          <Bullets
            items={[
              'Do not reuse leaked or guessed credentials, hijack sessions, or bypass authentication to reach another account or tenant.',
              'Do not escalate privileges beyond the accounts you were given, or move laterally to other hosts.',
              'Do not access another user’s data even if the application makes it technically possible.',
              'Do not install backdoors, persistence mechanisms or tooling on a target host unless explicitly authorized.',
              'If you gain wider access than intended, stop, avoid exploring it, and tell the owner immediately.',
            ]}
          />
        </Panel>
      </Section>

      {/* 12 — Third parties */}
      <Section
        n={12}
        title="Third-party service restrictions"
        subtitle="Your permission from one organization rarely extends to the services it depends on.">
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            Cloud platforms, SaaS products, CDNs, DNS providers, payment processors and email or SMS
            gateways have their own terms and, in many cases, published penetration-testing policies.
            Authorization from a customer to test their application does not automatically authorize
            testing the provider’s infrastructure, other tenants, or shared services. Do not scan or
            host payloads on third-party systems without their permission, and do not test suppliers,
            partners or downstream users as a shortcut into a target.
          </p>
          <p className="mt-4 text-[13px] leading-6 text-muted">
            Before any cloud work, read the relevant provider’s current testing policy and follow it,
            including any registration or notification requirements.
          </p>
        </Panel>
      </Section>

      {/* 13 — Bug bounties */}
      <Section
        n={13}
        title="Bug-bounty program policies"
        subtitle="A bounty program is a limited, conditional invitation — not blanket consent.">
        <Panel className="p-5 md:p-6">
          <Bullets
            items={[
              'Read the program page fully: scope, exclusions, safe-harbor terms, disclosure rules and reward conditions.',
              'Test only listed assets and vulnerability types; stay off excluded domains and infrastructure.',
              'Use the accounts and data the program provides, and respect any limits on automation.',
              'Private programs require an invitation; do not test an unlisted program’s assets.',
              'Do not demand payment, threaten disclosure or use public pressure. Follow the program’s process.',
              'Programs change and can end — re-check the policy before every new round of testing.',
            ]}
          />
        </Panel>
      </Section>

      {/* 14 — India */}
      <Section
        n={14}
        title="Indian legal framework (general overview)"
        subtitle="A high-level map of the frameworks commonly discussed in Indian cybersecurity practice.">
        <Panel className="p-5 md:p-6">
          <p className="text-[14px] leading-7 text-slate-300">
            India’s <strong className="font-semibold text-slate-100">Information Technology Act, 2000</strong>{' '}
            and its amendments address unauthorized access, data theft and related computer offences,
            and are central to how unauthorized security testing may be viewed. The{' '}
            <strong className="font-semibold text-slate-100">IT Rules, 2013</strong> on reasonable
            security practices and procedures, together with subsequent breach-reporting directions,
            set out expectations around safeguarding information and reporting certain incidents. The{' '}
            <strong className="font-semibold text-slate-100">Digital Personal Data Protection Act, 2023</strong>{' '}
            and its rules establish a consent-based framework emphasizing purpose limitation, data
            minimization, individual rights, breach intimation and significant penalties for
            non-compliance. CERT-In, India’s national incident-response team, and MeitY, the responsible
            ministry, publish advisories and rules in this space. Other general criminal and sectoral
            laws may also be relevant depending on the facts.
          </p>
          <Callout tone="amber" icon={<Gavel className="h-4 w-4" />} title="Confirm the current position with counsel">
            <p>
              The overview above is deliberately general and may not reflect the latest amendments,
              rules or judicial interpretation. Applicability depends on the specific system, data
              and conduct. Consult a qualified lawyer in India for advice about a real situation.
            </p>
          </Callout>
        </Panel>
      </Section>

      {/* 15 — International */}
      <Section
        n={15}
        title="Relevant international frameworks"
        subtitle="A short, non-exhaustive orientation — not a survey of any country’s full law.">
        <Panel className="p-5 md:p-6">
          <div className="space-y-4">
            <p className="text-[14px] leading-7 text-slate-300">
              <strong className="font-semibold text-slate-100">United Kingdom.</strong> The Computer
              Misuse Act 1990 and later amendments address unauthorized access, access with intent to
              commit further offences, and damage to data or systems.
            </p>
            <p className="text-[14px] leading-7 text-slate-300">
              <strong className="font-semibold text-slate-100">United States.</strong> The Computer
              Fraud and Abuse Act (CFAA) and various state laws address unauthorized access to
              protected computers and related conduct, with both criminal and civil consequences.
            </p>
            <p className="text-[14px] leading-7 text-slate-300">
              <strong className="font-semibold text-slate-100">European Union.</strong> The GDPR
              governs processing of personal data; NIS2 places security and incident-reporting duties
              on essential and important entities; and the Cyber Resilience Act sets requirements for
              products with digital elements. The Budapest Convention on Cybercrime supports
              international cooperation against cybercrime.
            </p>
          </div>
          <p className="mt-5 border-t border-ink-800 pt-4 text-[13px] leading-6 text-muted">
            These frameworks differ in scope and are updated over time. Where an engagement crosses
            borders, several may apply at once. Seek jurisdiction-specific legal guidance rather than
            relying on this summary.
          </p>
        </Panel>
      </Section>

      {/* Never do this */}
      <section className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">Never do this</h2>
            <p className="mt-1 text-sm text-muted">No amount of curiosity or learning justifies these actions.</p>
          </div>
        </div>
        <Panel className="border-rose-500/30 p-5 md:p-6">
          <Bullets
            tone="rose"
            items={[
              'Scan, enumerate or probe systems you do not own or have explicit written permission to test.',
              'Exploit a vulnerability on any target outside a current, documented scope.',
              'Steal, guess, reuse or trade credentials, or hijack someone else’s session.',
              'Deploy malware, backdoors, rootkits or any form of persistence.',
              'Perform destructive testing: deleting or altering data, ransomware or wiper behaviour.',
              'Access private data belonging to other users, tenants or people — even if you can.',
              'Run denial-of-service, resource-exhaustion or anything that degrades a service.',
            ]}
          />
        </Panel>
      </section>

      {/* Safe practice hierarchy */}
      <section className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-mint-500/30 bg-mint-500/10 text-mint-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">Safe practice hierarchy</h2>
            <p className="mt-1 text-sm text-muted">Climb one rung at a time — each level earns the next.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {hierarchy.map((step, i) => (
            <div key={step.title} className="relative">
              <Panel hover className={cn('h-full p-4', i >= 3 && 'border-cyanx-500/25')}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-mint-400">{String(i + 1).padStart(2, '0')}</span>
                  {i < hierarchy.length - 1 && <ArrowRight className="h-4 w-4 text-ink-600" />}
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-2 text-[12px] leading-6 text-muted">{step.body}</p>
              </Panel>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-6 text-muted">
          Move up only when you have the permission required for the next level. Most learning should
          stay in the first three rungs; the last two always require documented authorization.
        </p>
      </section>

      {/* Pre-test checklist */}
      <section className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-mint-500/30 bg-mint-500/10 text-mint-300">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">Pre-test checklist</h2>
            <p className="mt-1 text-sm text-muted">Ten things to confirm before any authorized engagement begins.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {checklist.map((item, i) => (
            <Panel key={i} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-mint-500/30 bg-mint-500/10 font-mono text-[11px] font-semibold text-mint-300">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-[13px] leading-6 text-slate-300">{item}</p>
            </Panel>
          ))}
        </div>
      </section>

      {/* Disclosure workflow */}
      <section className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyanx-500/30 bg-cyanx-500/10 text-cyanx-300">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">Responsible disclosure workflow</h2>
            <p className="mt-1 text-sm text-muted">From discovery to a safe, coordinated publication.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {disclosureSteps.map((step, i) => (
            <Panel key={step.title} className="relative p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyanx-500/30 bg-cyanx-500/10 font-mono text-xs font-semibold text-cyanx-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
              </div>
              <p className="text-[13px] leading-6 text-slate-400">{step.body}</p>
            </Panel>
          ))}
          <Panel className="flex items-center gap-3 border-mint-500/25 bg-mint-500/[0.04] p-5">
            <ShieldCheck className="h-6 w-6 shrink-0 text-mint-300" />
            <p className="text-[13px] leading-6 text-slate-300">
              Throughout: stay in scope, protect privacy, keep evidence minimal and communicate respectfully.
            </p>
          </Panel>
        </div>
      </section>

      {/* Resources */}
      <section className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-slate-300">
            <Globe2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">Authoritative resources</h2>
            <p className="mt-1 text-sm text-muted">Primary references used across the academy. Consult the source, not a summary.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <Panel hover key={resource.name} className="flex h-full flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-mint-400" />
                <ExternalLinkIcon className="h-3.5 w-3.5 text-ink-600" />
              </div>
              <ExternalLink href={resource.url} className="text-sm font-semibold">
                {resource.name}
              </ExternalLink>
              <p className="mt-2 text-[12px] leading-6 text-muted">{resource.note}</p>
            </Panel>
          ))}
        </div>
      </section>

      {/* Closing disclaimer */}
      <Callout tone="rose" icon={<Scale className="h-4 w-4" />} title="Final word">
        <p>
          This framework exists to help you become a careful, trustworthy security learner. General
          education is not legal advice; laws vary by jurisdiction and change over time, and this page
          is not a substitute for a qualified lawyer. Above all: <strong className="font-semibold text-rose-200">educational
          knowledge is never permission to test a real system</strong> without proper authorization.
          If in doubt, do not test — learn in a lab instead.
        </p>
      </Callout>
    </div>
  );
}
