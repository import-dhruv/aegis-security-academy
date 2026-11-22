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
      { href: '/topics/web-security', label: 'Web Security', icon: 'Bug' },
      { href: '/topics/networking', label: 'Networking', icon: 'Network' },
      { href: '/topics/linux-windows', label: 'Linux & Windows', icon: 'Server' },
      { href: '/topics/cloud-security', label: 'Cloud Security', icon: 'Cloud' },
      { href: '/topics/mobile-security', label: 'Mobile Security', icon: 'Smartphone' },
      { href: '/topics/reverse-engineering', label: 'Reverse Engineering', icon: 'Binary' },
      { href: '/topics/ai-security', label: 'AI Security', icon: 'BrainCircuit' },
    ],
  },
  {
    title: 'Research',
    items: [
      { href: '/tools', label: 'Tools Encyclopedia', icon: 'Wrench' },
      { href: '/labs', label: 'Practical Labs', icon: 'FlaskConical' },
      { href: '/ctf', label: 'CTF Challenges', icon: 'Trophy' },
      { href: '/vulnerabilities', label: 'Vulnerability Database', icon: 'ShieldAlert' },
      { href: '/case-studies', label: 'Bug Bounty Case Studies', icon: 'FileSearch' },
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

export const topicConfig: Record<string, { title: string; subtitle: string; schoolIds: string[]; chapterIds: number[]; accent: string }> = {
  'web-security': {
    title: 'Web Security',
    subtitle: 'HTTP internals, the browser security model, the complete OWASP canon and advanced web exploitation.',
    schoolIds: ['web-application-security', 'web-development-architecture'],
    chapterIds: [6, 7, 8, 9, 10, 17],
    accent: 'mint',
  },
  networking: {
    title: 'Networking & Internet Architecture',
    subtitle: 'From bits on the wire to TLS, DNS, proxies and traffic analysis with Wireshark and tcpdump.',
    schoolIds: ['networking-internet-architecture'],
    chapterIds: [4, 8],
    accent: 'cyan',
  },
  'linux-windows': {
    title: 'Linux & Windows Security',
    subtitle: 'Operating-system internals, identity, permissions, privilege boundaries, logging and hardening.',
    schoolIds: ['linux-windows-security', 'computer-science-foundations'],
    chapterIds: [2, 3],
    accent: 'mint',
  },
  'cloud-security': {
    title: 'Cloud Security',
    subtitle: 'IAM, metadata services, containers, Kubernetes, CI/CD and cloud misconfiguration assessment.',
    schoolIds: ['cloud-security'],
    chapterIds: [19, 20],
    accent: 'cyan',
  },
  'mobile-security': {
    title: 'Mobile Application Security',
    subtitle: 'Android and iOS architecture, storage, pinning, and static/dynamic analysis in a lab.',
    schoolIds: ['mobile-application-security'],
    chapterIds: [18],
    accent: 'mint',
  },
  'reverse-engineering': {
    title: 'Reverse Engineering & Binary Security',
    subtitle: 'Assembly, memory layout, memory corruption, disassembly, debugging, fuzzing and malware analysis.',
    schoolIds: ['advanced-exploitation-binary-security', 'reverse-engineering-malware-analysis', 'fuzzing-vulnerability-research'],
    chapterIds: [21, 22, 23],
    accent: 'cyan',
  },
  'ai-security': {
    title: 'AI & the Future of Cybersecurity',
    subtitle: 'AI-assisted research plus prompt injection, RAG, agentic, MCP and LLM application security.',
    schoolIds: ['ai-future-of-cybersecurity'],
    chapterIds: [24, 20],
    accent: 'mint',
  },
};
