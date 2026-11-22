import type { Chapter, Question } from './types';

/** Deterministic hash so a chapter's quiz set is stable across reloads. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DOMAIN_HINT: Record<string, string[]> = {
  'computer-science-foundations': ['Foundational'],
  'networking-internet-architecture': ['Network'],
  'linux-windows-security': ['Network'],
  'web-development-architecture': ['Web'],
  'cybersecurity-fundamentals': ['Foundational'],
  'cryptography-applied-security': ['Foundational'],
  'web-application-security': ['Web'],
  'advanced-bug-bounty-hunting': ['Web', 'Foundational'],
  'recon-attack-surface-intelligence': ['Network'],
  'burp-suite-mastery': ['Web'],
  'api-security-research': ['Cloud', 'Web'],
  'mobile-application-security': ['Cloud'],
  'cloud-security': ['Cloud'],
  'advanced-exploitation-binary-security': ['Advanced'],
  'reverse-engineering-malware-analysis': ['Advanced'],
  'fuzzing-vulnerability-research': ['Advanced'],
  'ai-future-of-cybersecurity': ['AI'],
  'secure-coding-application-defense': ['Web'],
};

export function questionsForChapter(chapter: Chapter, bank: Question[], count = 5): Question[] {
  const domains = chapter.schoolIds.flatMap((s) => DOMAIN_HINT[s] ?? []);
  const words = new Set([...chapter.tags, ...chapter.title.toLowerCase().split(/\s+/)]
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 3));

  const scored = bank.map((q) => {
    const text = `${q.question} ${q.answer}`.toLowerCase();
    let score = domains.includes(q.domain) ? 10 : 0;
    words.forEach((w) => { if (text.includes(w)) score += 2; });
    score += (hash(`${chapter.id}-${q.id}`) % 7) / 10;
    return { q, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, count).map((x) => x.q);
}

export function scoreAnswers(answers: Record<number, boolean>) {
  const values = Object.values(answers);
  return { correct: values.filter(Boolean).length, total: values.length, score: values.length ? Math.round((values.filter(Boolean).length / values.length) * 100) : 0 };
}
