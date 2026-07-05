'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Network,
  Zap,
  TrendingUp,
  Activity,
  ArrowUpRight,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stats = [
  { label: 'Total Memories', value: '1,247', change: '+12%', icon: Brain, color: 'from-violet-500 to-purple-600' },
  { label: 'Graph Nodes', value: '384', change: '+8%', icon: Network, color: 'from-cyan-500 to-blue-600' },
  { label: 'Context Packets', value: '89', change: '+24%', icon: Zap, color: 'from-amber-500 to-orange-600' },
  { label: 'Token Savings', value: '67%', change: '+5%', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
];

const recentMemories = [
  { type: 'decision', title: 'Auth Provider → Supabase', confidence: 0.95, time: '2h ago' },
  { type: 'api', title: 'POST /auth/login', confidence: 0.88, time: '4h ago' },
  { type: 'pattern', title: 'BLoC sealed classes', confidence: 0.92, time: '6h ago' },
  { type: 'bug', title: 'Safari login redirect', confidence: 0.75, time: '1d ago' },
  { type: 'architecture', title: 'Monorepo structure', confidence: 0.98, time: '2d ago' },
];

const typeColors: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  decision: 'default',
  api: 'accent',
  pattern: 'success',
  bug: 'danger',
  architecture: 'warning',
};

const activity = [
  { action: 'Context packet generated', project: 'neuron', tokens: 847 },
  { action: 'Memory merged', project: 'neuron', tokens: null },
  { action: 'Decision recorded', project: 'neuron', tokens: null },
  { action: 'MCP tool called', project: 'neuron', tokens: 1203 },
];

export function DashboardHome() {
  return (
    <div className="p-8 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card hover className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl`} />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> {stat.change} this week
                    </p>
                  </div>
                  <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-2.5`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Memories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-400" />
                Recent Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMemories.map((mem) => (
                  <div
                    key={mem.title}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={typeColors[mem.type] ?? 'muted'}>{mem.type}</Badge>
                      <span className="text-sm font-medium group-hover:text-violet-300 transition-colors">
                        {mem.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                      <span>{Math.round(mem.confidence * 100)}% conf</span>
                      <span>{mem.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {item.project}
                        {item.tokens && ` · ${item.tokens} tokens`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Context Layers Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-emerald-400" />
              Active Context Layers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[
                { layer: 'L3 Project', active: true, items: 142 },
                { layer: 'L4 Branch', active: true, items: 23 },
                { layer: 'L5 Task', active: true, items: 7 },
                { layer: 'L6 Conversation', active: false, items: 3 },
              ].map((l) => (
                <div
                  key={l.layer}
                  className={`rounded-xl border px-4 py-3 ${
                    l.active
                      ? 'border-violet-500/30 bg-violet-500/10'
                      : 'border-white/5 bg-white/[0.02] opacity-60'
                  }`}
                >
                  <p className="text-sm font-semibold">{l.layer}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{l.items} memories</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
