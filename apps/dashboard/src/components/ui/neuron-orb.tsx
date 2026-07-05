'use client';

import { motion } from 'framer-motion';

interface NeuronOrbProps {
  size?: number;
  className?: string;
}

export function NeuronOrb({ size = 120, className = '' }: NeuronOrbProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute rounded-full opacity-40 blur-2xl"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background: 'conic-gradient(from 0deg, #369bfd, #36fdfd, #36fdb5, #369bfd)',
        }}
      />
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: `inset 0 ${size * 0.06}px ${size * 0.13}px 0 #0a0e14, 0 ${size * 0.6}px ${size * 0.17}px 0 rgba(41,95,255,0.05)`,
        }}
      >
        <motion.div
          className="absolute -left-1/2 -top-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <div
            style={{
              width: size * 1.8,
              height: size * 1.8,
              background: 'conic-gradient(from 45deg, #369bfd, #36fdfd, #36fdb5, #369bfd)',
            }}
          />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="text-white/90" style={{ width: size * 0.35, height: size * 0.35 }}>
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="6" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="18" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="6" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="18" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
            <line x1="12" y1="12" x2="6" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <line x1="12" y1="12" x2="18" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <line x1="12" y1="12" x2="6" y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <line x1="12" y1="12" x2="18" y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
