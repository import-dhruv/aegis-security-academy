export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Extract plain-text section titles from a markdown document. */
export function extractSections(md: string): { id: string; title: string; level: number }[] {
  const out: { id: string; title: string; level: number }[] = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      const title = m[2].trim();
      out.push({ id: slugifyHeading(title), title, level: m[1].length });
    }
  }
  return out;
}
