'use client';

import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useUserApiKey } from '@/lib/hooks/use-user-api-key';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';

interface ApiKeyPanelProps {
  className?: string;
  compact?: boolean;
}

export function ApiKeyPanel({ className, compact }: ApiKeyPanelProps) {
  const {
    meta,
    revealedKey,
    displayKey,
    hasKey,
    loading,
    busy,
    error,
    projectId,
    generate,
    regenerate,
  } = useUserApiKey();

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<'key' | 'prefix' | null>(null);

  const masked = useMemo(() => {
    if (!displayKey) return '';
    if (revealedKey && !showKey) {
      return `${revealedKey.slice(0, 12)}${'•'.repeat(24)}`;
    }
    return displayKey;
  }, [displayKey, revealedKey, showKey]);

  function copy(text: string, kind: 'key' | 'prefix') {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <GlassCard glow padding="lg" className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#4BA0FA]/15 text-[#4BA0FA] ring-1 ring-[#4BA0FA]/25">
            <KeyRound className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">Your API key</h3>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  hasKey ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/45',
                )}
              >
                {loading ? '…' : hasKey ? 'Active' : 'Not set'}
              </span>
            </div>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/50">
              One key per account. Share it with Cursor or external testers — they never see your Supabase or Groq secrets.
            </p>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/40">
            <Shield className="size-3.5" />
            1 key per user
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-300">
          {error}
        </p>
      )}

      {!projectId && (
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-[13px] text-amber-200">
          Set <code className="font-mono text-[12px]">NEXT_PUBLIC_NEURON_PROJECT_ID</code> to enable key generation.
        </p>
      )}

      <div className="mt-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
          NEURON_API_KEY
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="glass-inner relative flex min-h-[48px] flex-1 items-center rounded-xl px-4 py-3">
            <code className="flex-1 break-all font-mono text-[13px] text-white/90">
              {loading ? 'Loading…' : masked || 'Generate a key to get started'}
            </code>
            {revealedKey && (
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="ml-2 shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white/70"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {hasKey ? (
              <>
                {revealedKey && (
                  <button
                    type="button"
                    onClick={() => copy(revealedKey, 'key')}
                    className="sketch-pill flex items-center gap-1.5 bg-black px-4 py-2.5 text-[13px] font-semibold text-white"
                  >
                    {copied === 'key' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied === 'key' ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => regenerate()}
                  disabled={busy || !projectId}
                  className="sketch-pill flex items-center gap-1.5 bg-[#4BA0FA] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  <RefreshCw className={cn('size-3.5', busy && 'animate-spin')} />
                  {busy ? 'Regenerating…' : 'Regenerate'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => generate()}
                disabled={busy || loading || !projectId}
                className="sketch-pill flex items-center gap-1.5 bg-[#4BA0FA] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                <KeyRound className="size-3.5" />
                {busy ? 'Creating…' : 'Generate key'}
              </button>
            )}
          </div>
        </div>
      </div>

      {revealedKey && (
        <div className="mt-4 rounded-xl border border-[#4BA0FA]/25 bg-[#4BA0FA]/8 px-4 py-3">
          <p className="text-[12px] font-medium text-[#4BA0FA]">
            Copy now — full key is only shown after generate or regenerate
          </p>
        </div>
      )}

      {hasKey && !revealedKey && meta && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-white/45">
          <span>
            Prefix <code className="font-mono text-white/70">{meta.key_prefix}…</code>
            {meta.last_used_at
              ? ` · Last used ${new Date(meta.last_used_at).toLocaleDateString()}`
              : ' · Never used'}
          </span>
          <button
            type="button"
            onClick={() => copy(meta.key_prefix, 'prefix')}
            className="text-[#4BA0FA] hover:underline"
          >
            {copied === 'prefix' ? 'Copied prefix' : 'Copy prefix'}
          </button>
        </div>
      )}

      {!compact && (
        <p className="mt-4 font-mono text-[11px] text-white/30">
          NEURON_API_URL={API_URL}
        </p>
      )}
    </GlassCard>
  );
}
