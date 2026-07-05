'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export interface SketchStatCardProps {
  label: string;
  tagline?: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  tilt?: number;
  delay?: number;
  featured?: boolean;
  iconBg?: string;
  className?: string;
}

/** Neubrutalism sketch card — 21st.dev pricing style */
export function SketchStatCard({
  label,
  tagline,
  value,
  icon: Icon,
  loading,
  tilt = 0,
  delay = 0,
  featured,
  iconBg = 'bg-[#FFF3B0]',
  className,
}: SketchStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: tilt - 4 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'sketch-card group relative w-full max-w-[220px]',
        featured && 'sketch-card-featured',
        className,
      )}
    >
      {featured && (
        <span className="sketch-badge absolute -right-2 -top-3 z-10 rotate-6 px-2.5 py-0.5 text-[10px] font-bold text-black">
          Live
        </span>
      )}

      <div className={cn('sketch-icon-ring mb-3', iconBg)}>
        <Icon className="size-5 stroke-[2.2] text-black/80" />
      </div>

      <p className="text-[15px] font-bold tracking-tight text-black">{label}</p>
      {tagline && (
        <p className="mt-0.5 text-[11px] leading-snug text-black/55">{tagline}</p>
      )}

      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-black">
        {loading ? '—' : value}
      </p>
    </motion.div>
  );
}

export function HeroFloatingStats({
  stats,
  loading,
  onDocs,
  onMcp,
}: {
  stats: Array<Omit<SketchStatCardProps, 'loading'>>;
  loading?: boolean;
  onDocs?: () => void;
  onMcp?: () => void;
}) {
  const positions = [
    'left-[2%] top-[8%] sm:left-[4%] sm:top-[12%]',
    'right-[2%] top-[6%] sm:right-[4%] sm:top-[10%]',
    'bottom-[8%] left-[4%] sm:bottom-[12%] sm:left-[8%]',
    'bottom-[6%] right-[2%] sm:bottom-[10%] sm:right-[6%]',
  ];

  return (
    <div className="relative mx-auto min-h-[420px] w-full max-w-4xl sm:min-h-[480px]">
      {/* Floating stat cards — hidden on xs, shown sm+ */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn('absolute animate-float', positions[i])}
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <SketchStatCard {...s} loading={loading} />
          </div>
        ))}
      </div>

      {/* Center hero */}
      <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-4 text-center sm:min-h-[480px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <p className="inline-flex items-center gap-1 text-[13px] font-medium text-[#4BA0FA]">
            <Star className="size-3.5 fill-[#FFF3B0] text-[#FFF3B0]" />
            Simple context
            <Star className="size-3.5 fill-[#FFF3B0] text-[#FFF3B0]" />
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
            Make your AI
            <br />
            <span className="text-[#4BA0FA]">remember everything</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            Persistent project memory for Cursor, Claude, and any MCP client — one API key, zero config.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onDocs}
              className="sketch-pill bg-black px-5 py-2.5 text-[13px] font-semibold text-white transition hover:-translate-y-0.5"
            >
              Check docs →
            </button>
            <button
              type="button"
              onClick={onMcp}
              className="sketch-pill bg-[#4BA0FA] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:-translate-y-0.5"
            >
              ★ Set up MCP
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile: 2×2 grid below hero */}
      <div className="mt-2 grid grid-cols-2 gap-3 px-2 sm:hidden">
        {stats.map((s) => (
          <SketchStatCard key={s.label} {...s} loading={loading} tilt={0} className="max-w-none" />
        ))}
      </div>
    </div>
  );
}
