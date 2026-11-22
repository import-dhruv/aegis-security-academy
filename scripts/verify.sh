#!/usr/bin/env bash
# Full verification: content integrity, types, production build.
set -euo pipefail
cd /home/dhruv2004/cyber-academy

echo "[1/4] Content integrity"
python3 - <<'PY'
import json, pathlib, re
D = pathlib.Path('public/data')
expected = {
    'chapters': 36, 'schools': 25, 'levels': 10, 'tools': 56,
    'questions': 1000, 'projects': 30, 'reports': 20, 'research': 28,
    'cves': 15, 'labs': 12, 'glossary': 554, 'courses': 16, 'books': 34,
    'ctf': 8, 'roadmap': 12,
}
for name, minimum in expected.items():
    data = json.loads((D / f'{name}.json').read_text())
    assert len(data) >= minimum, f'{name}: expected >= {minimum}, got {len(data)}'
    print(f'  {name:12} {len(data)}')

chapters = json.loads((D / 'chapters.json').read_text())
words = sum(c['words'] for c in chapters)
assert words > 80000, f'only {words} words of curriculum content'
print(f'  curriculum   {words} words')

for c in chapters:
    md = pathlib.Path('public/content/chapters') / pathlib.Path(c['path']).name
    text = md.read_text()
    assert len(text) > 2000, f'chapter {c["number"]} is suspiciously short'
    anchors = [re.sub(r'[^a-z0-9]+', '-', m.lower()).strip('-') for m in re.findall(r'^## (.+)$', text, re.M)]
    toc = [s['id'] for s in c['sections'] if s['level'] == 2]
    assert anchors == toc, f'chapter {c["number"]} TOC anchors do not match headings'
print('  all chapter TOC anchors resolve')
PY

echo "[2/4] Type check"
npx tsc --noEmit

echo "[3/4] Production build"
npm run build

echo "[4/4] Dataset cross-references"
python3 - <<'PY'
import json
D = lambda n: json.load(open(f'public/data/{n}.json'))
chapters = {c['id'] for c in D('chapters')}
schools = {s['id'] for s in D('schools')}
for c in D('chapters'):
    assert c['level'] in range(1, 11)
    assert set(c['schoolIds']) <= schools
    assert set(c['prerequisites']) <= chapters
for s in D('schools'):
    assert set(s['chapterIds']) <= chapters
for r in D('reports'):
    assert r['kind'] == 'synthetic-training-example'
for c in D('cves'):
    assert c['nvd'].startswith('https://nvd.nist.gov/vuln/detail/')
print('  cross-references valid')
PY

echo "ALL CHECKS PASSED"
