import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Compass className="mb-5 h-10 w-10 text-mint-400" />
      <div className="font-mono text-sm text-muted">404 · route not in scope</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">This page does not exist</h1>
      <p className="mt-3 max-w-md text-sm text-muted">The lesson, tool or resource you requested could not be found. Use global search (⌘K) or return to the dashboard.</p>
      <div className="mt-7 flex gap-3">
        <Link href="/dashboard" className="btn-primary">Dashboard</Link>
        <Link href="/schools" className="btn-ghost">Browse schools</Link>
      </div>
    </div>
  );
}
