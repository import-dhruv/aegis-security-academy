import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function levelName(level: number) {
  const names = [
    '', 'Cybersecurity Initiate', 'Computer Systems Explorer', 'Network Analyst',
    'Security Practitioner', 'Web Security Researcher', 'Bug Bounty Hunter',
    'Advanced Vulnerability Researcher', 'Exploitation Specialist',
    'Security Research Engineer', 'Elite Security Researcher',
  ];
  return names[Math.max(0, Math.min(10, level))] ?? names[0];
}

export function difficultyColor(d: string) {
  const s = d.toLowerCase();
  if (s.includes('beginner') || s === 'easy') return 'text-mint-400 border-mint-500/30 bg-mint-500/10';
  if (s.includes('intermediate') || s.includes('medium')) return 'text-cyanx-300 border-cyanx-500/30 bg-cyanx-500/10';
  if (s.includes('advanced') || s.includes('hard') || s.includes('critical')) return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
  return 'text-slate-300 border-ink-600 bg-ink-800';
}

export function severityColor(s: string) {
  const v = s.toLowerCase();
  if (v === 'critical') return 'text-rose-300 border-rose-500/40 bg-rose-500/10';
  if (v === 'high') return 'text-orange-300 border-orange-500/40 bg-orange-500/10';
  if (v === 'medium') return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
  return 'text-cyanx-300 border-cyanx-500/40 bg-cyanx-500/10';
}

export function formatMinutes(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
