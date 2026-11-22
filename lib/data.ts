'use client';

import { useEffect, useState } from 'react';

const cache = new Map<string, Promise<unknown>>();

export function loadJson<T>(file: string): Promise<T> {
  const url = `/data/${file}`;
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      }),
    );
  }
  return cache.get(url) as Promise<T>;
}

export function useData<T>(file: string | null): { data: T | null; loading: boolean; error: string | null } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: Boolean(file),
    error: null,
  });

  useEffect(() => {
    if (!file) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let active = true;
    setState({ data: null, loading: true, error: null });
    loadJson<T>(file)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((e: Error) => active && setState({ data: null, loading: false, error: e.message }));
    return () => {
      active = false;
    };
  }, [file]);

  return state;
}

export function useChapterMarkdown(path: string | null) {
  const [md, setMd] = useState('');
  const [loading, setLoading] = useState(Boolean(path));
  useEffect(() => {
    if (!path) return;
    let active = true;
    setLoading(true);
    fetch(path)
      .then((r) => r.text())
      .then((text) => active && (setMd(text), setLoading(false)))
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [path]);
  return { md, loading };
}

export function useAllData() {
  const chapters = useData<import('./types').Chapter[]>('chapters.json');
  const schools = useData<import('./types').School[]>('schools.json');
  const levels = useData<import('./types').Level[]>('levels.json');
  const tools = useData<import('./types').Tool[]>('tools.json');
  const questions = useData<import('./types').Question[]>('questions.json');
  const glossary = useData<import('./types').GlossaryItem[]>('glossary.json');
  const projects = useData<import('./types').Project[]>('projects.json');
  const cves = useData<import('./types').CVE[]>('cves.json');
  const labs = useData<import('./types').Lab[]>('labs.json');
  const research = useData<import('./types').Research[]>('research.json');
  const reports = useData<import('./types').Report[]>('reports.json');
  const roadmap = useData<import('./types').RoadmapMonth[]>('roadmap.json');
  const courses = useData<import('./types').Course[]>('courses.json');
  const books = useData<import('./types').Book[]>('books.json');
  const ctf = useData<import('./types').Challenge[]>('ctf.json');
  return { chapters, schools, levels, tools, questions, glossary, projects, cves, labs, research, reports, roadmap, courses, books, ctf };
}
