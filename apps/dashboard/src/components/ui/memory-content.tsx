import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'p'; text: string };

function formatInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-white/80">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code
          key={key++}
          className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[0.9em] text-[#36FDFD]/90"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('## ')) blocks.push({ kind: 'h2', text: line.slice(3).trim() });
    else if (line.startsWith('### ')) blocks.push({ kind: 'h3', text: line.slice(4).trim() });
    else if (/^[-*•]\s+/.test(line)) blocks.push({ kind: 'li', text: line.replace(/^[-*•]\s+/, '') });
    else blocks.push({ kind: 'p', text: line.trim() });
  }

  return blocks.length ? blocks : [{ kind: 'p', text: content.trim() }];
}

interface MemoryContentProps {
  content: string;
  variant?: 'preview' | 'full';
  className?: string;
}

export function MemoryContent({ content, variant = 'preview', className }: MemoryContentProps) {
  const blocks = parseBlocks(content);
  const maxBlocks = variant === 'preview' ? 6 : 24;
  const visible = blocks.slice(0, maxBlocks);
  const trimmed = blocks.length > maxBlocks;

  return (
    <div
      className={cn(
        'space-y-2',
        variant === 'preview' && 'line-clamp-[12] max-h-[9.5rem] overflow-hidden',
        className,
      )}
    >
      {visible.map((block, i) => {
        switch (block.kind) {
          case 'h2':
            return (
              <p
                key={i}
                className={cn(
                  'font-semibold leading-snug text-white/90',
                  i === 0 ? 'text-[14px]' : 'mt-1 text-[13px]',
                )}
              >
                {formatInline(block.text)}
              </p>
            );
          case 'h3':
            return (
              <p key={i} className="text-[12px] font-medium uppercase tracking-wide text-white/55">
                {formatInline(block.text)}
              </p>
            );
          case 'li':
            return (
              <div key={i} className="flex gap-2 text-[13px] leading-relaxed text-white/55">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-[#4BA0FA]/70" />
                <span>{formatInline(block.text)}</span>
              </div>
            );
          default:
            return (
              <p key={i} className="text-[13px] leading-[1.65] text-white/55">
                {formatInline(block.text)}
              </p>
            );
        }
      })}
      {trimmed && variant === 'preview' && (
        <p className="text-[11px] text-white/30">…</p>
      )}
    </div>
  );
}

/** One-line summary for lists — strips markdown noise */
export function memoryPreviewLine(content: string, max = 120): string {
  const first = parseBlocks(content).find((b) => b.kind === 'h2' || b.kind === 'p');
  const text = first?.text ?? content;
  const plain = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
  return plain.length <= max ? plain : `${plain.slice(0, max - 1)}…`;
}
