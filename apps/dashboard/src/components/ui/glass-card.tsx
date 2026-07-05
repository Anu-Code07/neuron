'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  className?: string;
  glow?: boolean;
  hover?: boolean;
  tilt?: number;
  delay?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function GlassCard({
  className,
  glow,
  hover = true,
  tilt = 0,
  delay = 0,
  padding = 'md',
  children,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass rounded-2xl',
        paddingMap[padding],
        glow && 'glow-border',
        hover && 'glass-hover',
        className,
      )}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {children}
    </motion.div>
  );
}

export function GlassStatCard({
  label,
  value,
  icon: Icon,
  loading,
  tilt = 0,
  delay = 0,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  tilt?: number;
  delay?: number;
  accent?: string;
}) {
  return (
    <GlassCard tilt={tilt} delay={delay} glow className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-40 blur-2xl"
        style={{ background: accent ?? 'rgba(75,160,250,0.35)' }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
            {loading ? '—' : value}
          </p>
        </div>
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#4BA0FA] ring-1 ring-white/10">
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function GlassSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard padding="lg" className={className}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-white/50">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </GlassCard>
  );
}

export function GlassCodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre
      className={cn(
        'glass-inner overflow-x-auto rounded-xl p-4 text-[12px] leading-relaxed text-white/70 font-mono',
        className,
      )}
    >
      {code}
    </pre>
  );
}
