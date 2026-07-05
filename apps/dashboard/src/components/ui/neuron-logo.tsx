'use client';

import { cn } from '@/lib/utils';
import { NeuronMark } from '@/components/ui/logo';

interface NeuronLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const ICON = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-10 w-10' } as const;
const TEXT = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' } as const;

export function NeuronLogo({ size = 'md', showText = true, className }: NeuronLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <NeuronMark className={ICON[size]} />
      {showText && (
        <span className={cn('font-bold tracking-[-0.03em] text-white', TEXT[size])}>
          neuron
        </span>
      )}
    </div>
  );
}
