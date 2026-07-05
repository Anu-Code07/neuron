'use client';

import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void };
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] backdrop-blur-xl px-8 py-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="accent">Context Engine</Badge>
        <button className="relative rounded-xl p-2.5 text-[var(--muted)] hover:bg-white/5 hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500" />
        </button>
        {action && (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </div>
    </header>
  );
}
