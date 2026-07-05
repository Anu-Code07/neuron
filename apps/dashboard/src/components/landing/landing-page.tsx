'use client';

import Link from 'next/link';
import { ArrowRight, Brain, Key, Network, Sparkles, Terminal, Zap } from 'lucide-react';
import { NeuronLogoFull } from '@/components/ui/logo';
import { MemoryGraphScrollSection } from './container-scroll';

const FEATURES = [
  {
    icon: Brain,
    title: 'Persistent memory',
    body: 'Facts, decisions, bugs, and architecture — stored once, recalled everywhere.',
    color: 'bg-[#FFD6A5]',
  },
  {
    icon: Terminal,
    title: 'One-key MCP',
    body: 'Share NEURON_API_KEY with your team. No Supabase or Groq setup for them.',
    color: 'bg-[#CAFFBF]',
  },
  {
    icon: Network,
    title: 'Context packets',
    body: 'AI-ready summaries assembled on demand with Groq-powered narratives.',
    color: 'bg-[#BDB2FF]',
  },
  {
    icon: Key,
    title: 'Secure by default',
    body: 'Secrets stay on your server. Testers only get a scoped API key.',
    color: 'bg-[#A2D2FF]',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#05080D] text-white">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#05080D]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <NeuronLogoFull className="h-7" />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-[13px] font-medium text-white/70 transition hover:text-white"
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
      <section className="relative overflow-hidden pt-28 md:pt-36">
        <div className="page-hero-gradient absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[#4BA0FA]">
            <Sparkles className="size-3" /> Context OS for AI
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl md:leading-[1.05]">
            Make your AI
            <br />
            <span className="text-[#4BA0FA]">remember everything</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/50 md:text-[17px]">
            Neuron is a context engine for Cursor, Claude, and any MCP client — persistent project memory with one API key.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="sketch-pill inline-flex items-center gap-2 bg-black px-6 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-0.5"
            >
              Log in <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how-it-works"
              className="sketch-pill inline-flex items-center gap-2 bg-white px-6 py-3 text-[14px] font-semibold text-black transition hover:-translate-y-0.5"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Scroll animation + memory graph */}
      <section className="relative mt-8">
        <MemoryGraphScrollSection />
      </section>

      {/* Features */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-4 pb-20 md:px-6">
        <div className="mb-10 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4BA0FA]">Why Neuron</p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Built for real teams</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="sketch-card">
              <div className={`sketch-icon-ring mb-4 ${f.color}`}>
                <f.icon className="size-5 text-black/80" />
              </div>
              <h3 className="text-[16px] font-bold text-black">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-black/55">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] bg-[#0a0e14]/50 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Zap className="mx-auto size-8 text-[#4BA0FA]" />
          <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">Ready to give your AI a brain?</h2>
          <p className="mt-3 text-[14px] text-white/45">
            Sign in, generate an API key, and connect Cursor in under a minute.
          </p>
          <Link
            href="/login"
            className="sketch-pill mt-8 inline-flex items-center gap-2 bg-[#4BA0FA] px-8 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-0.5"
          >
            Log in to Neuron <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-6 text-center text-[12px] text-white/30">
        Neuron — The Context Operating System for AI
      </footer>
    </div>
  );
}
