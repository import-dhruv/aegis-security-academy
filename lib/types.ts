export type Section = { id: string; title: string; level: number };

/** A real, publicly disclosed bug bounty report from the HackerOne disclosure dataset. */
export type RealCase = {
  id: string;
  reportId: number;
  title: string;
  program: string;
  programHandle: string;
  weakness: string;
  reporter: string;
  votes: number;
  disclosedAt: string;
  createdAt: string;
  sourceUrl: string;
  source: string;
  words: number;
  detail: string;
};

/** A single step in a topic's 50-module mastery curriculum. */
export type Module = {
  id: string;
  topic: string;
  number: number;
  title: string;
  level: string;
  minutes: number;
  summary: string;
  objectives: string[];
  takeaways: string[];
  practice: string;
  sources: { label: string; url: string }[];
  content: string;
};

export type Chapter = {
  id: number;
  slug: string;
  title: string;
  number: number;
  part: string;
  description: string;
  difficulty: string;
  level: number;
  minutes: number;
  words: number;
  sections: Section[];
  schoolIds: string[];
  tags: string[];
  prerequisites: number[];
  path: string;
};

export type School = {
  id: string;
  name: string;
  icon: string;
  description: string;
  chapterIds: number[];
};

export type Level = {
  level: number;
  name: string;
  description: string;
  chapterIds: number[];
};

export type Tool = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  arch: string;
  install: string;
  os: string;
  cmd: string;
  advanced: string;
  output: string;
  example: string;
  mistakes: string;
  limits: string;
  alt: string;
  docs: string;
  level: string;
};

export type Question = {
  id: number;
  domain: string;
  question: string;
  answer: string;
  source?: string;
};

export type Project = {
  id: string;
  name: string;
  problem: string;
  objectives: string;
  prereq: string;
  arch: string;
  stack: string;
  stages: string;
  testing: string;
  security: string;
  outcome: string;
  github: string;
};

export type Report = {
  id: string;
  title: string;
  cls: string;
  asset: string;
  severity: string;
  cwe: string;
  cvss: string;
  summary: string;
  precond: string;
  steps: string;
  poc: string;
  impact: string;
  remediation: string;
  triage: string;
  kind: string;
  disclaimer: string;
};

export type RoadmapMonth = {
  id: string;
  n: number;
  title: string;
  weeks: string[];
  concepts: string[];
  reading: string;
  courses: string;
  labs: string;
  programming: string;
  research: string;
  revision: string;
  criteria: string;
};

export type Research = {
  title: string;
  authors: string;
  year: string;
  problem: string;
  contribution: string;
  difficulty: string;
  category: string;
  source: string;
  url: string;
};

export type Course = {
  platform: string;
  cost: string;
  focus: string;
  prereqs: string;
  outcomes: string;
  source: string;
  url: string;
};

export type Book = {
  title: string;
  author: string;
  focus: string;
  category: string;
};

export type GlossaryItem = { term: string; definition: string };

export type CVE = {
  cve: string;
  name: string;
  software: string;
  category: string;
  severity: string;
  cvss: string;
  year: number;
  rootCause: string;
  impact: string;
  mitigation: string;
  resources: string[];
  nvd: string;
  timeline: string;
};

export type Lab = {
  id: string;
  title: string;
  provider: string;
  difficulty: string;
  type: string;
  url: string;
  skills: string[];
  note: string;
};

export type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  prompt: string;
  hints: string[];
  answer: string;
  lesson: number;
};

export type Note = {
  id: string;
  body: string;
  ref: string;
  createdAt: number;
};

export type ProgressState = {
  completed: Record<number, boolean>;
  quizScores: Record<number, number>;
  flashcardReviews: Record<number, { ease: number; interval: number; due: number; reps: number }>;
  bookmarks: string[];
  notes: Note[];
  studyMinutes: number;
  streak: number;
  lastActive: string;
  labCompletions: string[];
  challengeSolves: string[];
  tutorModes: Record<string, string>;
  toolMastery: Record<string, boolean>;
  papersRead: string[];
  cvesReviewed: string[];
  name: string;
};
