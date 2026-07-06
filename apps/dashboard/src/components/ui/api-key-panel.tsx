'use client';

import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, Shield, Terminal } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  copyText,
  getInstallCommandForKey,
  useUserApiKey,
} from '@/lib/hooks/use-user-api-key';
import { MCP_INTERACTIVE_INSTALL } from '@/lib/mcp-install';
import { GlassCard, GlassCodeBlock } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';

interface ApiKeyPanelProps {
  className?: string;
  compact?: boolean;
  showInstallCommands?: boolean;
}

export function ApiKeyPanel({ className, compact, showInstallCommands }: ApiKeyPanelProps) {
  const {
    meta,
    revealedKey,
    displayKey,
    hasKey,
    loading,
    busy,
    error,
    generate,
    regenerate,
  } = useUserApiKey();

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<'key' | 'install' | 'interactive' | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const canCopyKey = !!revealedKey;

  const masked = useMemo(() => {
    if (!displayKey) return '';
    if (revealedKey && !showKey) {
      return `${revealedKey.slice(0, 12)}${'•'.repeat(24)}`;
    }
    return displayKey;
  }, [displayKey, revealedKey, showKey]);

  async function copy(kind: 'key' | 'install' | 'interactive', text: string) {
    await copyText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleGenerate() {
    const key = await generate();
    if (key) {
      setShowKey(true);
      await copy('key', key);
    }
  }

  async function handleRegenerate() {
    const key = await regenerate();
    if (key) {
      setShowKey(true);
      await copy('key', key);
    }
  }

  function handleCopyKey() {
    if (revealedKey) {
      void copy('key', revealedKey);
      return;
    }
    setCopyHint('Full key unavailable — click Regenerate to get a new one you can copy.');
    setTimeout(() => setCopyHint(null), 3500);
  }

  const installCmd = revealedKey ? getInstallCommandForKey(revealedKey) : null;

  return (
    <>
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
                One key per account. We only show the full key right after you generate or regenerate it — for security it isn&apos;t stored in the dashboard.
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

        <div className="mt-5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
            NEURON_API_KEY
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div className="glass-inner relative flex min-h-[48px] flex-1 items-center gap-1 rounded-xl py-2 pl-3 pr-1 sm:pl-4">
              <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-white/90">
                {loading ? 'Loading…' : masked || 'No key yet — generate one below'}
              </code>
              {hasKey && (
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className={cn(
                    'shrink-0 rounded-lg p-2 transition',
                    canCopyKey
                      ? 'text-white/50 hover:bg-white/5 hover:text-white'
                      : 'text-white/25 hover:bg-white/[0.03] hover:text-white/40',
                  )}
                  aria-label="Copy API key"
                  title={canCopyKey ? 'Copy API key' : 'Regenerate to copy the full key'}
                >
                  {copied === 'key' ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              )}
              {revealedKey && (
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="shrink-0 rounded-lg p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {revealedKey && installCmd && (
                <button
                  type="button"
                  onClick={() => copy('install', installCmd)}
                  className="sketch-pill flex items-center gap-1.5 bg-black px-4 py-2.5 text-[13px] font-semibold text-white"
                >
                  {copied === 'install' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied === 'install' ? 'Copied!' : 'Copy command'}
                </button>
              )}
              {hasKey ? (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={busy}
                  className="sketch-pill flex items-center gap-1.5 bg-[#4BA0FA] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  <RefreshCw className={cn('size-3.5', busy && 'animate-spin')} />
                  {busy ? 'Working…' : 'Regenerate'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={busy || loading}
                  className="sketch-pill flex items-center gap-1.5 bg-[#4BA0FA] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  <KeyRound className="size-3.5" />
                  {busy ? 'Creating…' : 'Generate key'}
                </button>
              )}
            </div>
          </div>
        </div>

        {copyHint && (
          <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-[12px] text-amber-200">
            {copyHint}
          </p>
        )}

        {revealedKey && (
          <div className="mt-4 rounded-xl border border-[#4BA0FA]/25 bg-[#4BA0FA]/8 px-4 py-3">
            <p className="text-[12px] font-medium text-[#4BA0FA]">
              {copied === 'key'
                ? 'API key copied — use the copy icon in the input or Copy command for install.'
                : copied === 'install'
                  ? 'Install command copied — paste in Terminal, then restart your editor.'
                  : 'Full key visible this session — use the copy icon in the input before you leave.'}
            </p>
          </div>
        )}

        {hasKey && !revealedKey && meta && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-relaxed text-amber-100/90">
            <p>
              Your key is active (<code className="font-mono text-[12px]">{meta.key_prefix}…</code>
              {meta.last_used_at
                ? ` · last used ${new Date(meta.last_used_at).toLocaleDateString()}`
                : ' · never used'}
              ). The full key can&apos;t be shown again.
            </p>
            <p className="mt-2 text-[12px] text-amber-200/70">
              Click <strong>Regenerate</strong> for a fresh key you can copy from the input, or use interactive setup and paste when prompted.
            </p>
          </div>
        )}

        {!compact && (
          <p className="mt-4 font-mono text-[11px] text-white/30">
            NEURON_API_URL={API_URL}
          </p>
        )}
      </GlassCard>

      {showInstallCommands && (
        <>
          <GlassCard glow padding="lg" className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4BA0FA]">
                  Recommended
                </p>
                <h3 className="mt-1 flex items-center gap-2 font-semibold text-white">
                  <Terminal className="size-4 text-[#4BA0FA]" />
                  Install command
                </h3>
                <p className="mt-1 text-[12px] text-white/45">
                  Run in Terminal or PowerShell, then restart your MCP client.
                </p>
              </div>
              {installCmd && (
                <button
                  type="button"
                  onClick={() => copy('install', installCmd)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#4BA0FA] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#4BA0FA]/90"
                >
                  {copied === 'install' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied === 'install' ? 'Copied!' : 'Copy command'}
                </button>
              )}
            </div>
            {installCmd ? (
              <GlassCodeBlock code={installCmd} className="mt-4 text-[12px]" />
            ) : (
              <p className="mt-4 text-[12px] text-white/40">
                Generate or regenerate your key above to unlock the copy-ready command.
              </p>
            )}
          </GlassCard>

          <GlassCard padding="lg" className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">No key handy?</h3>
                <p className="mt-1 text-[12px] text-white/45">
                  Run this anytime — the CLI will ask you to paste your <code className="font-mono">nrn_</code> key.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copy('interactive', MCP_INTERACTIVE_INSTALL)}
                className="glass-pill flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[12px] text-white hover:bg-white/10"
              >
                {copied === 'interactive' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied === 'interactive' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <GlassCodeBlock code={MCP_INTERACTIVE_INSTALL} className="mt-4 text-[12px]" />
          </GlassCard>
        </>
      )}
    </>
  );
}
