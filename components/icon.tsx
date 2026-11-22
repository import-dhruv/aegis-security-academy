'use client';

import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type Props = LucideProps & { name: string };

export function Icon({ name, ...props }: Props) {
  const map = Icons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Cmp = map[name] ?? Icons.Circle;
  return <Cmp {...props} />;
}
