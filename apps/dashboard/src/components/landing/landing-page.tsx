'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Key, Network, Sparkles, Terminal, Zap } from 'lucide-react';
import { NeuronLogoFull } from '@/components/ui/logo';
import { MemoryGraphScrollSection } from './container-scroll';
import { FloatingHeroCards, LandingAurora, LogoMarquee } from './landing-graphics';
import { TextRotate } from './text-rotate';

const FEATURES = [
  {
    icon: Brain,
    title: 'Persistent memory',
    body: 'Facts, decisions, bugs, and architecture — stored once, recalled everywhere.',
    color: 'bg-[#FFD6A5]',
    span: '',
  },
  {
    icon: Terminal,
    title: 'One-key MCP',
    body: 'Share NEURON_API_KEY with your team. Zero Supabase config for them.',
    color: 'bg-[#CAFFBF]',
    span: '',
  },
  {
    icon: Network,
    title: 'Context packets',
    body: 'AI-ready summaries assembled on demand with Groq-powered narratives.',
    color: 'bg-[#BDB2FF]',
    span: 'sm:col-span-2',
  },
  {
    icon: Key,
    title: 'Secure by default',
    body: 'Secrets stay on your server. Testers only get a scoped API key.',
    color: 'bg-[#A2D2FF]',
    span: '',
  },
];

const STATS = [
  { value: '18+', label: 'MCP tools' },
  { value: '1', label: 'API key to connect' },
  { value: '∞', label: 'Project memories' },
  { value: '0', label: 'Secrets shared' },
];

export function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#05080D] text-white">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#05080D]/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <NeuronLogoFull />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-[13px] font-medium text-white/60 transition hover:text-white sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="sketch-pill bg-[#4BA0FA] px-4 py-2 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 md:px-5"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[92vh] overflow-hidden pt-28 md:pt-32">
        <LandingAurora />
        <FloatingHeroCards />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 text-center md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="glass-pill inline-flex items-center gap-2 px-4 py-1.5">
              <Sparkles className="size-3.5 text-[#36fdfd]" />
              <span className="text-[11px] font-medium tracking-wide text-white/70">
                Context OS for AI · MCP-ready
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em] md:text-7xl md:leading-[1.0] lg:text-[5.5rem]">
              Make your AI
              <br />
              <TextRotate
                words={['remember everything', 'know your stack', 'never forget', 'stay in context']}
                className="min-h-[1.1em] text-[2.75rem] md:text-7xl lg:text-[5.5rem]"
              />
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/45 md:text-lg">
              Neuron is a context engine for Cursor, Claude, and any MCP client.
              One API key. Persistent project memory. Award-grade developer experience.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="group sketch-pill inline-flex items-center gap-2 bg-white px-7 py-3.5 text-[14px] font-bold text-black transition hover:-translate-y-1"
              >
                Log in
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#showcase"
                className="sketch-pill inline-flex items-center gap-2 bg-black px-7 py-3.5 text-[14px] font-bold text-white transition hover:-translate-y-1"
              >
                Explore the graph
              </a>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="glass rounded-2xl px-4 py-5 text-center">
                <p className="text-2xl font-bold tabular-nums text-white md:text-3xl">{s.value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/40">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <LogoMarquee />

      {/* Scroll animation + memory graph */}
      <section id="showcase" className="relative">
        <MemoryGraphScrollSection />
      </section>

      {/* Bento features */}
      <section id="how-it-works" className="relative mx-auto max-w-6xl px-4 py-24 md:px-6">
        <div className="mb-14 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#4BA0FA]">Why Neuron</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Designed for builders
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-white/40">
            A developer-first context layer that feels as good as it works.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`sketch-card ${f.span}`}
            >
              <div className={`sketch-icon-ring mb-4 ${f.color}`}>
                <f.icon className="size-5 text-black/80" />
              </div>
              <h3 className="text-[17px] font-bold text-black">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-black/55">{f.body}</p>
            </motion.div>
          ))}

          {/* Open source card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass glow-border flex flex-col justify-between rounded-2xl p-6 lg:col-span-1"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#36fdfd]">Open</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Ship faster</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/45">
                One API key for your team. Groq-powered summaries. Memory that persists across every session.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#4BA0FA] to-[#36fdfd]" />
              </div>
              <span className="text-[11px] tabular-nums text-white/40">Ready</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/[0.06] px-4 py-24 md:px-6">
        <LandingAurora />
        <div className="relative mx-auto max-w-2xl text-center">
          <Zap className="mx-auto size-10 text-[#4BA0FA]" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Give your AI a brain
          </h2>
          <p className="mt-4 text-[15px] text-white/45">
            Sign in, generate an API key, connect Cursor — under 60 seconds.
          </p>
          <Link
            href="/login"
            className="sketch-pill mt-10 inline-flex items-center gap-2 bg-[#4BA0FA] px-10 py-4 text-[15px] font-bold text-white transition hover:-translate-y-1"
          >
            Log in to Neuron <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <NeuronLogoFull size="sm" />
          <div className="text-center md:text-right">
            <p className="text-[12px] text-white/30">Neuron — Context Engine for AI</p>
            <p className="mt-1 text-[10px] text-white/20">anurag</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
