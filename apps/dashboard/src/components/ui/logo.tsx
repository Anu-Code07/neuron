'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Context-engine mark: stacked memories → synapse → knowledge graph hub.
 * Reads as "structured facts compressed into connected AI context."
 */
export function NeuronMark({ className }: { className?: string }) {
  const gradId = useId();

  return (
    <svg
      className={cn('h-8 w-8 shrink-0', className)}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4BA0FA" />
          <stop offset="0.55" stopColor="#3B8FE8" />
          <stop offset="1" stopColor="#36fdfd" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
      <rect
        width="32"
        height="32"
        rx="9"
        fill="none"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="0.75"
      />

      {/* Memory stack — facts narrowing into a context packet */}
      <rect x="5.5" y="8.5" width="10" height="2.75" rx="1.35" fill="white" fillOpacity="0.38" />
      <rect x="5.5" y="12.75" width="8.5" height="2.75" rx="1.35" fill="white" fillOpacity="0.58" />
      <rect x="5.5" y="17" width="7" height="2.75" rx="1.35" fill="white" fillOpacity="0.78" />
      <circle cx="8.75" cy="9.875" r="0.65" fill="white" fillOpacity="0.9" />
      <circle cx="8.75" cy="14.125" r="0.65" fill="white" fillOpacity="0.9" />
      <circle cx="8.75" cy="18.375" r="0.65" fill="white" fillOpacity="0.9" />

      {/* Synapse — memories flow into the graph */}
      <path
        d="M13 18.375 C15.5 18.375 16.5 16 18.25 16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      {/* Knowledge graph hub + linked memories */}
      <circle cx="21.5" cy="16" r="3.25" fill="white" />
      <circle cx="21.5" cy="16" r="1.15" fill="#4BA0FA" />

      <circle cx="26.25" cy="11.25" r="2" fill="white" fillOpacity="0.92" />
      <circle cx="26.25" cy="20.75" r="2" fill="white" fillOpacity="0.92" />
      <circle cx="27.75" cy="16" r="1.35" fill="white" fillOpacity="0.7" />

      <path
        d="M24.4 14.1 L25.5 12.5 M24.4 17.9 L25.5 19.4 M24.75 16 H26.2"
        stroke="white"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeOpacity="0.88"
      />
    </svg>
  );
}

export function NeuronLogoFull({
  className,
  showTagline = false,
  showCreator = false,
  size = 'md',
}: {
  className?: string;
  showTagline?: boolean;
  /** @deprecated use showTagline */
  showCreator?: boolean;
  size?: 'sm' | 'md';
}) {
  const tagline = showTagline || showCreator;
  const iconSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-[15px]' : 'text-[17px]';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <NeuronMark className={iconSize} />
      <div className="flex flex-col items-start leading-none">
        <span className={cn('font-bold tracking-[-0.03em] text-white', textSize)}>
          neuron
        </span>
        {tagline && (
          <span className={cn('mt-1 font-medium text-white/35', size === 'sm' ? 'text-[9px]' : 'text-[10px]')}>
            context engine
          </span>
        )}
      </div>
    </div>
  );
}
