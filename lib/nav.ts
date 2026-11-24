export type NavItem = { href: string; label: string; icon: string; badge?: string };

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/roadmap', label: 'Learning Roadmap', icon: 'Map' },
      { href: '/schools', label: 'Cybersecurity Schools', icon: 'GraduationCap' },
      { href: '/analytics', label: 'Learning Analytics', icon: 'ChartNoAxesCombined' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { href: '/bug-bounty', label: 'Bug Bounty Academy', icon: 'Target' },
      { href: '/field-guide', label: 'Practical Field Guide', icon: 'BookOpenCheck' },
      { href: '/topics/web-security', label: 'Web Security', icon: 'Bug' },
      { href: '/topics/networking', label: 'Networking', icon: 'Network' },
      { href: '/topics/linux-windows', label: 'Linux & Windows', icon: 'Server' },
      { href: '/topics/cloud-security', label: 'Cloud Security', icon: 'Cloud' },
      { href: '/topics/mobile-security', label: 'Mobile Security', icon: 'Smartphone' },
      { href: '/topics/reverse-engineering', label: 'Reverse Engineering', icon: 'Binary' },
      { href: '/topics/ai-security', label: 'AI Security', icon: 'BrainCircuit' },
      { href: '/topics/applied-ai-security', label: 'Applied AI Security', icon: 'Bot' },
      { href: '/topics/ai-bug-bounty', label: 'AI-Powered Bug Bounty', icon: 'WandSparkles' },
    ],
  },
  {
    title: 'Research',
    items: [
      { href: '/tools', label: 'Tools Encyclopedia', icon: 'Wrench' },
      { href: '/labs', label: 'Practical Labs', icon: 'FlaskConical' },
      { href: '/ctf', label: 'CTF Challenges', icon: 'Trophy' },
      { href: '/ctf-library', label: '1000-Challenge CTF Library', icon: 'Flag' },
      { href: '/vulnerabilities', label: 'Vulnerability Database', icon: 'ShieldAlert' },
      { href: '/case-studies', label: 'Bug Bounty Case Studies', icon: 'FileSearch' },
      { href: '/real-cases', label: '500 Real Disclosed Cases', icon: 'BookOpenCheck' },
      { href: '/research', label: 'Research Papers', icon: 'BookOpenText' },
      { href: '/projects', label: 'Projects', icon: 'FolderGit2' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { href: '/flashcards', label: 'Flashcards', icon: 'Layers3' },
      { href: '/assessments', label: 'Assessments', icon: 'ClipboardCheck' },
      { href: '/tutor', label: 'AI Tutor', icon: 'Sparkles' },
      { href: '/simulator', label: 'BB Workflow Simulator', icon: 'Workflow' },
      { href: '/practice-sessions', label: 'Guided Practice Sessions', icon: 'Dumbbell' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/notes', label: 'Notes & Bookmarks', icon: 'NotebookPen' },
      { href: '/profile', label: 'Profile & Settings', icon: 'UserRound' },
    ],
  },
];

export const ethicsNav: NavItem = { href: '/ethics', label: 'Ethics & Legal', icon: 'Scale' };

/** A single stage of the recommended learning path inside a topic hub. */
export type TopicStage = { title: string; detail: string; chapterIds: number[] };

/** Full metadata for every LEARN topic hub. */
export type TopicConfig = {
  title: string;
  subtitle: string;
  schoolIds: string[];
  chapterIds: number[];
  accent: 'mint' | 'cyan';
  /** A detailed explanation of what the topic is and why it matters. */
  overview: string;
  /** What the learner will be able to do after completing the topic. */
  objectives: string[];
  /** Observable evidence that the learner has genuinely mastered the topic. */
  masterySignals: string[];
  /** Searchable skill keywords covered by the topic. */
  coreSkills: string[];
  /** Ordered route through the mapped chapters. */
  path: TopicStage[];
  /** Optional additional module volumes rendered on this topic hub. */
  moduleSlugs?: string[];
};

export const topicConfig: Record<string, TopicConfig> = {
  'bug-bounty': {
    title: 'Bug Bounty Academy',
    subtitle: 'A complete professional practice: program selection, scope discipline, passive-first reconnaissance, systematic manual testing, safe impact validation and triage-ready reporting.',
    schoolIds: ['advanced-bug-bounty-hunting', 'recon-attack-surface-intelligence', 'burp-suite-mastery'],
    chapterIds: [11, 12, 13, 14, 15, 25, 26, 27],
    accent: 'mint',
    overview: 'Bug bounty is a professional discipline, not a lottery. It combines deep technical skill with careful reading of rules, rigorous documentation and honest communication. This track takes you from the economics and ethics of vulnerability markets through the full engagement workflow, and ends with report craft and career development. Every technical chapter is paired with the operational skill needed to turn a finding into a validated, well-paid, responsibly disclosed result.',
    objectives: [
      'Explain how platforms, triage and reward models work, and choose programs that fit your current skills.',
      'Read a scope and rules of engagement precisely, and stay inside the authorization boundary under pressure.',
      'Build a passive-first reconnaissance pipeline and prioritize assets by likelihood and impact.',
      'Run a repeatable manual testing loop across trust boundaries, authentication, authorization and business logic.',
      'Validate impact safely with owned accounts and synthetic data, without touching real user information.',
      'Write a triage-ready report with reproduction steps, harmless PoC, CWE/CVSS reasoning and clear remediation.',
      'Manage a sustainable long-term practice: tooling, notes, timeboxing, metrics and professional growth.',
    ],
    masterySignals: [
      'You can state, from memory, the exact in-scope and out-of-scope assets of a program before testing.',
      'You produce an asset inventory with prioritization rationale rather than a list of raw subdomains.',
      'You can explain why a bug is exploitable and what the real-world impact is to a non-technical triager.',
      'Your reports are accepted without requests for more information or reproduction help.',
      'You treat duplicates and informatives as normal outcomes and use them to refine your process.',
    ],
    coreSkills: ['program selection', 'scope analysis', 'safe harbor', 'OSINT', 'recon', 'attack surface mapping', 'Burp Suite', 'manual testing', 'business logic', 'impact validation', 'CVSS', 'CWE', 'report writing', 'triage', 'disclosure', 'workflow', 'career'],
    path: [
      { title: 'Enter the ecosystem', detail: 'Understand the incentives, platforms, disclosure models and legal boundary before touching a target.', chapterIds: [11, 12] },
      { title: 'Define the boundary', detail: 'Read scopes and rules of engagement like a contract; write down what you may and may not test.', chapterIds: [13] },
      { title: 'Map the surface', detail: 'Passive-first discovery, validation and prioritization of assets and endpoints.', chapterIds: [14] },
      { title: 'Test methodically', detail: 'A manual, evidence-driven loop over the highest-value trust boundaries.', chapterIds: [15] },
      { title: 'Report and communicate', detail: 'Turn findings into triage-ready reports and handle feedback professionally.', chapterIds: [25] },
      { title: 'Operate and grow', detail: 'Run a sustainable workflow and build a long-term research career.', chapterIds: [26, 27] },
    ],
  },
  'web-security': {
    title: 'Web Security',
    subtitle: 'HTTP internals, the browser security model, the complete OWASP canon and advanced web exploitation — from first principles to reliable, lab-tested technique.',
    schoolIds: ['web-application-security', 'web-development-architecture', 'api-security-research'],
    chapterIds: [6, 7, 8, 9, 10, 17],
    accent: 'mint',
    overview: 'Web security is the ability to reason about a request as it travels from a browser through caches, proxies, frameworks, databases and back again — and to know where trust is misplaced at every hop. You will build the full stack mental model first, then learn the complete OWASP vulnerability canon with root cause, detection, lab-safe exploitation and defense. The track closes with the advanced, subtle classes (smuggling, cache poisoning, pollution, SSTI, races) and the API-specific universe that dominates modern bug bounty.',
    objectives: [
      'Explain the browser security model: SOP, CORS, CSP, cookies, storage and framework-specific pitfalls.',
      'Trace the full request lifecycle including TLS, proxies, caches, headers and backend parsing differences.',
      'Identify root causes and exploitation paths for every OWASP Top 10 category.',
      'Detect and exploit advanced classes such as request smuggling, cache poisoning, prototype pollution and SSTI in authorized labs.',
      'Apply OWASP API Security concepts: BOLA, BFLA, mass assignment, GraphQL abuse and rate-limit bypass.',
      'Design defenses and verify they work, rather than relying on a scanner report.',
    ],
    masterySignals: [
      'Given an unfamiliar endpoint, you can enumerate its trust boundaries and rank likely vulnerability classes in minutes.',
      'You can explain the difference between a parser-level and a logic-level flaw and choose the right test for each.',
      'You verify a defense by attacking your own patched lab and confirming the exploit fails.',
      'You can map a raw HTTP request to every middleware and framework that will interpret it.',
    ],
    coreSkills: ['HTML/CSS/JS', 'DOM', 'SOP', 'CORS', 'CSP', 'cookies', 'HTTP', 'TLS', 'caching', 'proxies', 'SQL', 'JWT', 'OAuth', 'OWASP Top 10', 'injection', 'XSS', 'SSRF', 'CSRF', 'deserialization', 'request smuggling', 'prototype pollution', 'SSTI', 'race conditions', 'REST', 'GraphQL', 'BOLA'],
    path: [
      { title: 'Build the client model', detail: 'HTML, DOM, JavaScript, browser isolation and the security headers that constrain them.', chapterIds: [6] },
      { title: 'Build the server model', detail: 'Backend architecture, databases, sessions, JWT and OAuth.', chapterIds: [7] },
      { title: 'Master HTTP and TLS', detail: 'The protocol, headers, caching, cookies and intermediaries that shape every request.', chapterIds: [8] },
      { title: 'Learn the canon', detail: 'Every OWASP Top 10 category with root cause, detection, exploitation and defense.', chapterIds: [9] },
      { title: 'Go advanced', detail: 'Smuggling, cache attacks, pollution, SSTI, deserialization and races.', chapterIds: [10] },
      { title: 'Cover APIs', detail: 'Authorization, schema abuse and the OWASP API Security Top 10.', chapterIds: [17] },
    ],
    moduleSlugs: ['web-security', 'web-security-advanced'],
  },
  networking: {
    title: 'Networking & Internet Architecture',
    subtitle: 'From bits on the wire to TLS, DNS, proxies and traffic analysis — the mental model every serious security researcher stands on.',
    schoolIds: ['networking-internet-architecture'],
    chapterIds: [4, 8],
    accent: 'cyan',
    overview: 'Most security assumptions are network assumptions. This topic builds the protocol stack from first principles so that terms like hop limit, cache, resolver, NAT and certificate chain are concrete rather than abstract. You will capture and interpret real packets, subnet a network by hand, understand how DNS and TLS actually behave, and learn which network-level weaknesses become application-level bugs such as SSRF and host-header abuse.',
    objectives: [
      'Describe encapsulation from Ethernet frames through IP, TCP/UDP and TLS into application data.',
      'Subnet IPv4 networks and explain addressing, NAT, routing and IPv6 fundamentals.',
      'Resolve a DNS name step by step and explain caching, record types and DNSSEC.',
      'Explain the TCP handshake, states, retransmission and how proxies/load balancers alter traffic.',
      'Capture and filter traffic with Wireshark and tcpdump, then interpret what you see.',
      'Recognize network-level attack patterns and the controls that mitigate them in a lab.',
    ],
    masterySignals: [
      'You can predict which headers and hops a request will traverse before you send it.',
      'You build correct Wireshark display filters and tcpdump BPF expressions from memory.',
      'You can explain why an SSRF reaches a link-local address and which network controls stop it.',
      'You can subnet and design a segmented lab network without a calculator.',
    ],
    coreSkills: ['OSI', 'TCP/IP', 'Ethernet', 'ARP', 'IPv4', 'IPv6', 'subnetting', 'TCP', 'UDP', 'DNS', 'NAT', 'TLS', 'HTTP', 'proxies', 'Wireshark', 'tcpdump', 'network segmentation'],
    path: [
      { title: 'Foundations of the wire', detail: 'Encapsulation, Ethernet, ARP, IP addressing and subnetting.', chapterIds: [4] },
      { title: 'Transport and name resolution', detail: 'TCP/UDP, DNS, NAT and IPv6 with packet-level examples.', chapterIds: [4] },
      { title: 'Traffic analysis', detail: 'Capture, filters and interpretation with Wireshark and tcpdump.', chapterIds: [4] },
      { title: 'Where the network meets the app', detail: 'HTTP, TLS, proxies, CDNs and host-based routing.', chapterIds: [8] },
    ],
  },
  'linux-windows': {
    title: 'Linux & Windows Security',
    subtitle: 'Operating-system internals, identity, permissions, privilege boundaries, logging and hardening — the environment in which every exploit either works or dies.',
    schoolIds: ['linux-windows-security', 'computer-science-foundations'],
    chapterIds: [2, 3],
    accent: 'mint',
    overview: 'You cannot understand privilege escalation, sandbox escape, persistence or detection without understanding the operating system. This topic builds the computational foundations (bits, CPU, memory, processes) and then walks both major OS families: Linux identity and permission mechanics, and Windows tokens, ACLs and UAC. The emphasis is on verifiable configuration — you will harden a system, then prove the hardening works.',
    objectives: [
      'Explain bits, endianness, CPU execution, memory hierarchy, virtual memory and process isolation.',
      'Read and reason about Linux permissions, ownership, SUID/SGID, capabilities and ACLs.',
      'Explain Windows identity: SIDs, access tokens, UAC, NTFS ACLs and privileged operations.',
      'Locate and interpret the logs that matter on each platform.',
      'Apply a hardening baseline and verify it with concrete commands.',
      'Understand privilege boundaries well enough to assess them in an authorized lab.',
    ],
    masterySignals: [
      'You can predict the effective access of a process from its user, groups, capabilities and ACLs.',
      'You can configure a non-root service with only the capabilities it needs and verify it still runs.',
      'You can enable audit logging and find a specific authentication event without guessing.',
      'You can explain exactly which OS mechanism a sandbox relies on and how it can fail.',
    ],
    coreSkills: ['bits', 'endianness', 'CPU', 'memory', 'virtual memory', 'processes', 'permissions', 'SUID', 'capabilities', 'ACLs', 'PAM', 'sudo', 'systemd', 'auditd', 'UAC', 'tokens', 'registry', 'PowerShell', 'Event Logs', 'Sysmon', 'hardening'],
    path: [
      { title: 'Computer foundations', detail: 'Bits, number systems, CPU, memory, processes and the math behind security.', chapterIds: [2] },
      { title: 'Linux security model', detail: 'Users, permissions, capabilities, services, logging and hardening.', chapterIds: [3] },
      { title: 'Windows security model', detail: 'Tokens, UAC, ACLs, registry, services and event logging.', chapterIds: [3] },
    ],
  },
  'cloud-security': {
    title: 'Cloud Security',
    subtitle: 'IAM and identity federation, metadata services, storage exposure, containers, Kubernetes, serverless, CI/CD and supply-chain risk — with safe, read-only assessment practice.',
    schoolIds: ['cloud-security', 'secure-coding-application-defense'],
    chapterIds: [19, 20],
    accent: 'cyan',
    overview: 'Cloud security failures are overwhelmingly configuration and identity failures, not exotic provider zero-days. This topic gives you a provider-agnostic mental model and then the provider-specific detail: how policy evaluation actually works, how temporary credentials are issued and stolen through SSRF, how storage becomes public by accident, how container and Kubernetes boundaries break, and how CI/CD pipelines become supply-chain entry points. You will practice only against accounts and clusters you own, using read-only auditing first.',
    objectives: [
      'Explain the shared responsibility model across IaaS, PaaS and SaaS for AWS, GCP and Azure.',
      'Evaluate an IAM policy correctly: explicit deny, SCPs, permission boundaries, identity vs resource policies and trust policies.',
      'Explain how instance metadata services work and how IMDSv2 and equivalent controls stop SSRF credential theft.',
      'Identify dangerous storage configurations and design least-exposure bucket/container policies.',
      'Assess container, Kubernetes and serverless designs for realistic escape and lateral-movement paths.',
      'Harden CI/CD with least-privilege tokens, OIDC, pinned dependencies, artifact signing and SBOMs.',
      'Run a safe, read-only cloud assessment and produce prioritized, evidence-backed remediation guidance.',
    ],
    masterySignals: [
      'You can predict whether a principal can perform an action by mentally evaluating the full policy chain.',
      'You can explain, step by step, how an SSRF reaches metadata and which single control breaks the chain.',
      'You can write a Kubernetes NetworkPolicy and PodSecurity standard that block a known lab attack path.',
      'You can design a pipeline where a compromised dependency cannot reach production credentials.',
      'You never assess a resource you do not own or that is not explicitly in scope.',
    ],
    coreSkills: ['shared responsibility', 'IAM', 'STS', 'OIDC federation', 'permission boundaries', 'SCP', 'IMDSv2', 'SSRF', 'S3', 'Blob Storage', 'Cloud Storage', 'containers', 'Kubernetes', 'RBAC', 'NetworkPolicy', 'serverless', 'CI/CD', 'OIDC', 'SLSA', 'SBOM', 'secrets management', 'Prowler', 'ScoutSuite', 'Checkov', 'Trivy'],
    path: [
      { title: 'Cloud identity and policy', detail: 'Shared responsibility, IAM evaluation, roles, federation and temporary credentials.', chapterIds: [19] },
      { title: 'Workload attack surfaces', detail: 'Metadata services, storage, serverless, containers, Kubernetes and networks.', chapterIds: [19] },
      { title: 'Assessment and defense', detail: 'Logging, read-only auditing, secrets management and safe lab practice.', chapterIds: [19] },
      { title: 'Code and supply chain', detail: 'Code review, SAST/SCA, dependency risk and hardened delivery pipelines.', chapterIds: [20] },
    ],
  },
  'mobile-security': {
    title: 'Mobile Application Security',
    subtitle: 'Android and iOS architecture, storage, permissions, deep links, certificate pinning, and static/dynamic analysis in an isolated lab.',
    schoolIds: ['mobile-application-security'],
    chapterIds: [18],
    accent: 'mint',
    overview: 'Mobile apps are clients you control, which makes them a rich source of server-side findings: hidden endpoints, authorization assumptions, API keys and business logic that was never meant to be inspected. This topic covers both platforms from the ground up, then gives you a repeatable static and dynamic analysis workflow against your own apps and lab devices, always tied back to the OWASP Mobile Application Security standard.',
    objectives: [
      'Describe Android and iOS application architecture, sandboxing and signing models.',
      'Analyze an APK/IPA statically: manifest, permissions, components, code, resources and embedded secrets.',
      'Map deep links, intents and URL schemes to real authorization and routing risks.',
      'Set up a lab device or emulator with a proxy and inspect traffic from your own app.',
      'Understand certificate pinning and how it is validated in a controlled lab.',
      'Apply OWASP MASVS/MSTG requirements and test mobile backends as part of the API surface.',
    ],
    masterySignals: [
      'You can extract an app manifest and enumerate exported components plus their risk in minutes.',
      'You can trace a deep link from intent filter to server-side handler and identify the trust decision.',
      'You can capture your own app traffic and explain every TLS validation step.',
      'You can map a mobile finding to a specific MASVS control and write a defensible remediation.',
    ],
    coreSkills: ['Android', 'iOS', 'APK', 'IPA', 'manifest', 'permissions', 'intents', 'deep links', 'keystore', 'keychain', 'WebView', 'certificate pinning', 'MobSF', 'jadx', 'apktool', 'Frida', 'objection', 'MASVS', 'MSTG', 'mobile API'],
    path: [
      { title: 'Platform architecture', detail: 'Android and iOS sandboxes, app structure, signing and lifecycle.', chapterIds: [18] },
      { title: 'Static analysis', detail: 'Decompilation, manifests, components, storage and embedded secrets.', chapterIds: [18] },
      { title: 'Dynamic analysis', detail: 'Emulator, proxying, pinning and runtime instrumentation in a lab.', chapterIds: [18] },
      { title: 'Standards and reporting', detail: 'MASVS/MSTG mapping and mobile backend testing.', chapterIds: [18] },
    ],
  },
  'reverse-engineering': {
    title: 'Reverse Engineering & Binary Security',
    subtitle: 'Assembly, memory layout, memory corruption, disassembly, debugging, fuzzing and malware behaviour analysis in isolated labs.',
    schoolIds: ['advanced-exploitation-binary-security', 'reverse-engineering-malware-analysis', 'fuzzing-vulnerability-research'],
    chapterIds: [21, 22, 23],
    accent: 'cyan',
    overview: 'This is where software becomes data and data becomes control. You will learn the machine-level view of execution, how memory is laid out and corrupted, how modern mitigations change the game, and how to analyze executables you are authorized to study. The track finishes with fuzzing as a way to find bugs at scale and a rigorous crash-triage workflow that turns a crash dump into a root cause.',
    objectives: [
      'Read x86-64 and ARM assembly for common constructs and know the calling conventions.',
      'Explain stack and heap layout, and the mechanics of overflows, UAF and format-string flaws.',
      'Describe how ASLR, NX, stack canaries, PIE, RELRO and CFI each change exploitation.',
      'Navigate ELF/PE files with disassembly and decompilation tools and identify key functions.',
      'Analyze suspicious binaries safely in an isolated sandbox and describe behaviour with indicators.',
      'Run coverage-guided fuzzers and triage crashes down to a root cause.',
    ],
    masterySignals: [
      'You can reconstruct a function’s intent from assembly without symbols.',
      'You can draw the stack frame at a crash and explain which overwrite occurred.',
      'You can select and configure the right sanitizer and fuzzer for a target in your lab.',
      'You can write a YARA rule that captures a behaviour rather than a single hash.',
    ],
    coreSkills: ['assembly', 'x86-64', 'ARM', 'calling conventions', 'stack', 'heap', 'overflow', 'UAF', 'format string', 'ROP', 'ASLR', 'NX', 'canaries', 'RELRO', 'Ghidra', 'radare2', 'ELF', 'PE', 'debugging', 'YARA', 'sandbox', 'AFL++', 'libFuzzer', 'sanitizers', 'crash triage'],
    path: [
      { title: 'Machine foundations', detail: 'Assembly, registers, calling conventions and memory layout.', chapterIds: [21] },
      { title: 'Memory safety', detail: 'Overflow classes, exploits and the mitigations that stop them.', chapterIds: [21] },
      { title: 'Binary analysis', detail: 'Formats, disassembly, decompilation, debugging and behaviour analysis.', chapterIds: [22] },
      { title: 'Automated discovery', detail: 'Fuzzing, sanitizers, minimization and root-cause triage.', chapterIds: [23] },
    ],
  },
  'ai-security': {
    title: 'AI & the Future of Cybersecurity',
    subtitle: 'AI-assisted research plus prompt injection, RAG, agentic and MCP security, model attacks, evaluation and red teaming.',
    schoolIds: ['ai-future-of-cybersecurity'],
    chapterIds: [24, 20],
    accent: 'mint',
    overview: 'AI changes both sides of security. As a researcher you will use models to accelerate reconnaissance, code understanding and analysis; as an attacker surface, LLM applications introduce a new class of flaws where language, retrieved context and tool permissions become the attack path. This topic covers prompt injection in all its forms, RAG and agent/MCP risks, model-level attacks, the OWASP LLM Top 10 and MITRE ATLAS, plus the evaluation and red-team methods needed to make defensible claims.',
    objectives: [
      'Use AI tools to accelerate research while verifying every factual and technical claim.',
      'Explain direct and indirect prompt injection and why retrieved content is untrusted input.',
      'Assess RAG pipelines, agent tool permissions and MCP servers for realistic abuse paths.',
      'Describe model extraction, membership inference, inversion and poisoning at a conceptual level.',
      'Apply the OWASP LLM Top 10 and MITRE ATLAS to structure a threat model.',
      'Design evaluations, guardrails and a red-team plan, then measure whether defenses actually hold.',
    ],
    masterySignals: [
      'You can decompose an LLM app into trust boundaries and identify where untrusted text enters.',
      'You can demonstrate indirect prompt injection against your own lab RAG app and fix it.',
      'You can explain why output filtering alone is not a sufficient defense and what layered controls are needed.',
      'You can report an AI finding with a reproducible evaluation and a measurable success rate.',
    ],
    coreSkills: ['LLM', 'prompt injection', 'jailbreak', 'RAG', 'agents', 'MCP', 'tool use', 'OWASP LLM Top 10', 'MITRE ATLAS', 'model extraction', 'membership inference', 'data poisoning', 'guardrails', 'evals', 'AI red teaming', 'supply chain'],
    path: [
      { title: 'AI as a research tool', detail: 'Augmenting analysis without surrendering judgment or accuracy.', chapterIds: [24] },
      { title: 'LLM application threats', detail: 'Prompt injection, RAG poisoning, agents, MCP and excessive agency.', chapterIds: [24] },
      { title: 'Model-level threats', detail: 'Extraction, inference, poisoning and the OWASP/MITRE frameworks.', chapterIds: [24] },
      { title: 'Evaluation and defense', detail: 'Threat modeling, evals, guardrails, red teaming and incident response.', chapterIds: [24, 20] },
    ],
  },
  'applied-ai-security': {
    title: 'Applied AI Security',
    subtitle: 'Hands-on security for real AI systems: prompt-injection evals, RAG and agent labs, guardrails, AI incident response and secure design.',
    schoolIds: ['ai-future-of-cybersecurity', 'secure-coding-application-defense'],
    chapterIds: [24, 20],
    accent: 'cyan',
    overview: 'This track turns AI security concepts into repeatable lab work. You will threat-model an LLM application, build an evaluation harness for prompt injection, poison your own RAG index to prove isolation failures, sandbox an agent with dangerous tool permissions, measure whether guardrails actually hold, and run an AI incident-response tabletop with rollback and disclosure artefacts. The emphasis is on evidence: every claim is backed by a reproducible evaluation, and every fix is verified by re-running the same test.',
    objectives: [
      'Threat-model an LLM application by mapping data flows, trust boundaries and abuse cases.',
      'Build an evaluation harness that measures prompt-injection success rather than relying on anecdotes.',
      'Demonstrate RAG poisoning and tenant-isolation failures in a lab, then verify the fixes.',
      'Design tool-permission matrices and sandboxes for agents and MCP servers.',
      'Implement layered guardrails and regression tests that survive adversarial input.',
      'Run an AI incident response: detect, contain, roll back, disclose and document.',
    ],
    masterySignals: [
      'You can reproduce an indirect prompt injection against your own lab app and make it fail after a fix.',
      'You publish an eval result with a defined success metric and a controlled baseline.',
      'You can explain why output filtering alone cannot secure an agent with powerful tools.',
      'You have a tested rollback plan for a compromised prompt, model or retrieval index.',
    ],
    coreSkills: ['threat modeling', 'prompt injection', 'eval harness', 'attack success rate', 'RAG poisoning', 'tenant isolation', 'agent sandbox', 'MCP', 'tool permissions', 'guardrails', 'regression tests', 'AI incident response', 'rollback', 'OWASP LLM Top 10', 'MITRE ATLAS'],
    path: [
      { title: 'Map the system', detail: 'Inventory, data flows, trust boundaries and abuse cases for an LLM app.', chapterIds: [24] },
      { title: 'Attack the layers', detail: 'Prompt injection, RAG poisoning, agents, MCP and model-level tests.', chapterIds: [24] },
      { title: 'Measure and defend', detail: 'Evals, guardrails, regression suites and verified fixes.', chapterIds: [24, 20] },
      { title: 'Respond and design', detail: 'AI incident response, rollback, disclosure and secure architecture.', chapterIds: [20] },
    ],
    moduleSlugs: ['applied-ai-security'],
  },
  'ai-bug-bounty': {
    title: 'AI-Powered Bug Bounty',
    subtitle: 'How to use AI to become a dramatically better bug bounty researcher — with verification gates, honest limits, and an augmented hunter operating model.',
    schoolIds: ['advanced-bug-bounty-hunting', 'ai-future-of-cybersecurity'],
    chapterIds: [11, 14, 15, 25, 24],
    accent: 'mint',
    overview: 'AI amplifies skill; it does not replace fundamentals. This track teaches a professional, honest workflow for using models across the entire bug bounty lifecycle: interpreting reconnaissance data, reading unfamiliar code and protocols, generating and checking payload hypotheses only in labs, structuring triage-ready reports, and running agentic pipelines under human review. You will also learn where AI fails — hallucinated impact, duplicate-prone suggestions, privacy leaks from pasted scope, and platform rules on low-quality automated reports — and how to measure whether AI actually made you faster and more accurate.',
    objectives: [
      'Set up an AI workspace with clear boundaries around data, privacy and program rules.',
      'Use models to accelerate reconnaissance analysis while verifying every factual claim.',
      'Apply AI to code and protocol comprehension, with an evidence log of what was checked.',
      'Generate and test exploitation hypotheses safely in owned labs, avoiding false positives.',
      'Use AI to draft and edit reports without inventing impact or losing your own reasoning.',
      'Build agentic workflows with human verification gates and measure real productivity.',
    ],
    masterySignals: [
      'You can show, for any AI-assisted finding, which claims you independently verified.',
      'Your reports remain triage-ready and free of hallucinated or exaggerated impact.',
      'You never paste confidential scope or real user data into a model you do not control.',
      'You can explain exactly where AI helped and where it misled you in a measured workflow review.',
    ],
    coreSkills: ['AI-assisted recon', 'prompt patterns', 'code comprehension', 'hypothesis generation', 'lab verification', 'false-positive control', 'report editing', 'CVSS reasoning', 'agentic workflow', 'human-in-the-loop', 'RAG over notes', 'evals', 'productivity measurement', 'platform policy'],
    path: [
      { title: 'Set the boundary', detail: 'Mindset, platform rules, privacy, and choosing the right model for each task.', chapterIds: [11, 13] },
      { title: 'Accelerate analysis', detail: 'Recon interpretation, code/protocol comprehension and hypothesis generation.', chapterIds: [14, 15] },
      { title: 'Verify in labs', detail: 'Safe payload reasoning, PoC design and false-positive control.', chapterIds: [15] },
      { title: 'Report and review', detail: 'AI-assisted reporting, agentic workflows and measured productivity.', chapterIds: [25, 24] },
    ],
    moduleSlugs: ['ai-bug-bounty'],
  },
};
