'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeuronLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function NeuronLogo({ size = 'md', showText = true, className }: NeuronLogoProps) {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-xl bg-violet-500/30 blur-lg"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div
          className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500"
          style={{ width: s, height: s }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-[55%] h-[55%]">
            <circle cx="12" cy="12" r="2" fill="white" />
            <circle cx="6" cy="8" r="1.5" fill="white" opacity="0.8" />
            <circle cx="18" cy="8" r="1.5" fill="white" opacity="0.8" />
            <circle cx="6" cy="16" r="1.5" fill="white" opacity="0.8" />
            <circle cx="18" cy="16" r="1.5" fill="white" opacity="0.8" />
            <line x1="12" y1="12" x2="6" y2="8" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="12" y1="12" x2="18" y2="8" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="12" y1="12" x2="6" y2="16" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="12" y1="12" x2="18" y2="16" stroke="white" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight', size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg')}>
          <span className="text-gradient">Neuron</span>
        </span>
      )}
    </div>
  );
}
