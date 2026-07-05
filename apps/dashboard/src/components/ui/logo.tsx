import { cn } from '@/lib/utils';

export function NeuronMark({ className }: { className?: string }) {
  return (
    <svg className={cn('h-6 w-6', className)} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#4BA0FA]"
      />
    </svg>
  );
}

export function NeuronLogoFull({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <NeuronMark />
      <span className="text-lg font-medium text-white/90">neuron</span>
    </div>
  );
}
