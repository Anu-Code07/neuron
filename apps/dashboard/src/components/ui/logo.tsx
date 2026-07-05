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

export function NeuronLogoFull({
  className,
  showCreator = false,
  size = 'md',
}: {
  className?: string;
  showCreator?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative">
        <NeuronMark className={size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#36fdfd] ring-2 ring-[#05080D]" />
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className={cn('font-semibold tracking-tight text-white/95', size === 'sm' ? 'text-sm' : 'text-lg')}>
          neuron
        </span>
        {showCreator && (
          <span className={cn('mt-0.5 font-medium text-white/25', size === 'sm' ? 'text-[9px]' : 'text-[10px]')}>
            context engine
          </span>
        )}
      </div>
    </div>
  );
}
