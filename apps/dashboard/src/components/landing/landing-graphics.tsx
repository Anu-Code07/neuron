'use client';

import { motion } from 'framer-motion';

const ORBS = [
  { size: 420, x: '10%', y: '8%', color: 'rgba(75,160,250,0.35)', delay: 0 },
  { size: 320, x: '75%', y: '15%', color: 'rgba(54,253,253,0.2)', delay: 1 },
  { size: 280, x: '55%', y: '55%', color: 'rgba(139,92,246,0.18)', delay: 2 },
  { size: 200, x: '5%', y: '65%', color: 'rgba(75,160,250,0.15)', delay: 0.5 },
];

export function LandingAurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grain */}
      <div className="landing-grain absolute inset-0 opacity-[0.35]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent)',
        }}
      />

      {/* Floating orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[80px]"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -15, 10, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#05080D_75%)]" />
    </div>
  );
}

/** Floating tilted cards around hero — 21st.dev style */
export function FloatingHeroCards() {
  const cards = [
    { label: 'remember_fact', rotate: -12, x: '4%', y: '18%', gradient: 'from-pink-400/30 to-orange-400/20' },
    { label: 'context packet', rotate: 8, x: '78%', y: '12%', gradient: 'from-cyan-400/30 to-blue-500/20' },
    { label: 'MCP live', rotate: -6, x: '82%', y: '58%', gradient: 'from-violet-400/25 to-purple-500/15' },
    { label: 'memory graph', rotate: 10, x: '2%', y: '62%', gradient: 'from-emerald-400/25 to-teal-500/15' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="absolute h-28 w-40 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-2xl backdrop-blur-md"
          style={{ left: card.x, top: card.y, rotate: card.rotate }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: 0.2 + i * 0.1, duration: 0.6 },
            scale: { delay: 0.2 + i * 0.1, duration: 0.6 },
            y: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 },
          }}
        >
          <div className={`h-full w-full bg-gradient-to-br ${card.gradient} p-3`}>
            <div className="size-full rounded-lg border border-white/10 bg-black/20" />
            <p className="absolute bottom-2.5 left-3 font-mono text-[10px] text-white/70">{card.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function LogoMarquee() {
  const items = [
    'Cursor MCP', 'Groq LLM', 'Supabase', 'Context Engine', 'Memory Graph',
    'NEURON_API_KEY', 'Neuron', 'remember_fact', 'search_memory',
  ];

  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-4">
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.15em] text-white/25"
          >
            <span className="size-1.5 rounded-full bg-[#4BA0FA]/60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
