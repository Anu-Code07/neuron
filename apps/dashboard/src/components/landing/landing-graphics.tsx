'use client';

import { motion } from 'framer-motion';

const BEAMS = [
  { x: '20%', rotate: 25, width: 1, opacity: 0.12 },
  { x: '50%', rotate: 0, width: 2, opacity: 0.08 },
  { x: '78%', rotate: -20, width: 1, opacity: 0.1 },
];

const ORBS = [
  { size: 480, x: '8%', y: '5%', color: 'rgba(75,160,250,0.4)', delay: 0 },
  { size: 360, x: '72%', y: '10%', color: 'rgba(54,253,253,0.22)', delay: 1 },
  { size: 300, x: '50%', y: '50%', color: 'rgba(167,139,250,0.2)', delay: 2 },
  { size: 220, x: '2%', y: '60%', color: 'rgba(75,160,250,0.18)', delay: 0.5 },
  { size: 180, x: '88%', y: '70%', color: 'rgba(54,253,253,0.12)', delay: 1.5 },
];

export function LandingAurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="landing-grain absolute inset-0 opacity-[0.4]" />

      {/* Light beams */}
      <div className="absolute inset-0 overflow-hidden">
        {BEAMS.map((beam, i) => (
          <div
            key={i}
            className="absolute -top-[20%] h-[140%] bg-gradient-to-b from-[#4BA0FA]/20 via-[#36fdfd]/10 to-transparent"
            style={{
              left: beam.x,
              width: `${beam.width}px`,
              transform: `rotate(${beam.rotate}deg)`,
              opacity: beam.opacity,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 25%, black, transparent)',
        }}
      />

      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[90px]"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            x: [0, 24, -12, 0],
            y: [0, -18, 12, 0],
            scale: [1, 1.1, 0.92, 1],
          }}
          transition={{
            duration: 14 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#05080D_70%)]" />
    </div>
  );
}

export function FloatingHeroCards() {
  const cards = [
    { label: 'remember_fact', rotate: -12, x: '3%', y: '16%', gradient: 'from-rose-400/40 via-orange-300/20 to-transparent', glow: '#fb7185' },
    { label: 'context packet', rotate: 9, x: '76%', y: '10%', gradient: 'from-cyan-400/40 via-blue-400/20 to-transparent', glow: '#22d3ee' },
    { label: 'MCP live', rotate: -5, x: '80%', y: '55%', gradient: 'from-violet-400/35 via-purple-400/15 to-transparent', glow: '#a78bfa' },
    { label: 'memory graph', rotate: 11, x: '1%', y: '58%', gradient: 'from-emerald-400/35 via-teal-400/15 to-transparent', glow: '#34d399' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="absolute h-32 w-44 overflow-hidden rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          style={{
            left: card.x,
            top: card.y,
            rotate: card.rotate,
            boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 40px ${card.glow}22`,
          }}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.15 + i * 0.12, duration: 0.7 },
            scale: { delay: 0.15 + i * 0.12, duration: 0.7 },
            y: { duration: 5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
          }}
        >
          <div className={`relative h-full w-full bg-gradient-to-br ${card.gradient} p-3`}>
            <div className="size-full rounded-xl border border-white/15 bg-black/30 backdrop-blur-sm" />
            <div className="absolute inset-3 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
            <p className="absolute bottom-3 left-3 font-mono text-[10px] font-medium text-white/80">{card.label}</p>
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
    <div className="relative overflow-hidden border-y border-white/[0.08] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#05080D] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#05080D] to-transparent" />
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/30"
          >
            <span className="size-1.5 rounded-full bg-gradient-to-r from-[#4BA0FA] to-[#36fdfd]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const PARTNERS = ['Cursor', 'Claude', 'Groq', 'Supabase', 'VS Code', 'GitHub'];

export function WorksWithStrip() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white/25">
        Works with your stack
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {PARTNERS.map((name, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-full px-5 py-2.5 text-[13px] font-medium text-white/50 transition hover:border-[#4BA0FA]/30 hover:text-white/80"
          >
            {name}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksSteps() {
  const steps = [
    { n: '01', title: 'Sign in', desc: 'Create your project in seconds with magic link auth.' },
    { n: '02', title: 'Get API key', desc: 'One NEURON_API_KEY — share with your team or demo users.' },
    { n: '03', title: 'Connect Cursor', desc: 'Run init, restart MCP, and your AI remembers everything.' },
  ];

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-20 md:px-6">
      <div className="mb-12 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#36fdfd]">How it works</p>
        <h2 className="font-display mt-3 text-3xl text-white md:text-4xl">Three steps to context</h2>
      </div>
      <div className="relative grid gap-6 md:grid-cols-3">
        <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-[#4BA0FA]/40 to-transparent md:block" />
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="gradient-border glass relative rounded-2xl p-6 text-center md:text-left"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4BA0FA] to-[#36fdfd] text-[13px] font-bold text-black">
              {s.n}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
