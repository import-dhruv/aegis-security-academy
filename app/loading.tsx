export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-2/3 rounded-lg bg-ink-800" />
      <div className="h-4 w-1/2 rounded bg-ink-800/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-36 rounded-xl border border-ink-800 bg-ink-900/60" />)}
      </div>
    </div>
  );
}
