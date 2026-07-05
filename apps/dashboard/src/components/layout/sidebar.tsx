'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  Brain,
  Search,
  Building2,
  ListTodo,
  Plug,
  Component,
  Bug,
  Clock,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuronLogo } from '@/components/ui/neuron-logo';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
      { href: '/dashboard/search', icon: Search, label: 'Search' },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { href: '/dashboard/graph', icon: Network, label: 'Knowledge Graph' },
      { href: '/dashboard/memories', icon: Brain, label: 'Memory Browser' },
      { href: '/dashboard/architecture', icon: Building2, label: 'Architecture' },
    ],
  },
  {
    label: 'Entities',
    items: [
      { href: '/dashboard/tasks', icon: ListTodo, label: 'Tasks' },
      { href: '/dashboard/apis', icon: Plug, label: 'APIs' },
      { href: '/dashboard/components', icon: Component, label: 'Components' },
      { href: '/dashboard/bugs', icon: Bug, label: 'Bugs' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/dashboard/timeline', icon: Clock, label: 'Timeline' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      { href: '/dashboard/admin', icon: Shield, label: 'Admin' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/5 transition-all duration-300',
        'bg-[var(--sidebar)] backdrop-blur-2xl',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-white/5 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <NeuronLogo size="sm" />}
        {collapsed && <NeuronLogo size="sm" showText={false} />}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-white/5 hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-foreground border border-violet-500/20'
                            : 'text-[var(--muted)] hover:bg-white/5 hover:text-foreground',
                          collapsed && 'justify-center px-2',
                        )}
                      >
                        <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-violet-400')} />
                        {!collapsed && <span>{item.label}</span>}
                        {isActive && !collapsed && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                        )}
                      </motion.div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={signOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--muted)]',
            'hover:bg-red-500/10 hover:text-red-300 transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
