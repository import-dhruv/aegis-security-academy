import type { Metadata, Viewport } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import { ProgressProvider } from '@/components/providers';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: { default: 'AEGIS — Cybersecurity & Bug Bounty Academy', template: '%s · AEGIS Academy' },
  description: 'A first-principles, research-driven cybersecurity and bug bounty university: 36 in-depth chapters, 1,000 questions, 56 tools, hands-on labs and a professional research workflow.',
  keywords: ['cybersecurity', 'bug bounty', 'web security', 'security research', 'ethical hacking', 'learning'],
};

export const viewport: Viewport = {
  themeColor: '#080b0e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ProgressProvider>
          <AppShell>{children}</AppShell>
        </ProgressProvider>
      </body>
    </html>
  );
}
