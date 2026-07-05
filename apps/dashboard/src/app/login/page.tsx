'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GitBranch, Loader2, Mail } from 'lucide-react';
import { LoginVisualPanel } from '@/components/auth/login-visual';
import { NeuronLogoFull } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  async function signInWithOAuth(provider: 'github' | 'google') {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
    if (error) { setMessage({ type: 'error', text: error.message }); setLoading(null); }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading('email');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Check your email for the magic link!' });
    setLoading(null);
  }

  return (
    <div className="grid min-h-dvh bg-[#030912] lg:grid-cols-2">
      <LoginVisualPanel />

      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="login-card w-full max-w-[400px] p-8 sm:p-10"
        >
          <NeuronLogoFull className="mb-8 justify-center" />

          <h1 className="text-center text-xl font-medium text-[#fafafa]">
            Never lose context
            <span className="block text-brand-accent">with neuron</span>
          </h1>
          <p className="mt-2 text-center text-[12px] text-[#737373]">
            Your Context Engine — structured memory for every AI assistant.
          </p>

          <div className="mt-8 space-y-3">
            <OAuthButton loading={loading === 'github'} onClick={() => signInWithOAuth('github')}>
              <GitBranch className="size-4" /> Continue with GitHub
            </OAuthButton>
            <OAuthButton loading={loading === 'google'} onClick={() => signInWithOAuth('google')}>
              <GoogleIcon /> Continue with Google
            </OAuthButton>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-[11px] text-[#737373]">
              <span className="bg-[#06101f] px-3">or email</span>
            </div>
          </div>

          <form onSubmit={signInWithEmail} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-3 text-sm text-[#fafafa] placeholder:text-[#737373] focus:border-[#4BA0FA]/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4BA0FA] py-3 text-sm font-medium text-white hover:bg-[#4BA0FA]/90 disabled:opacity-50"
            >
              {loading === 'email' ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              Send magic link
            </button>
          </form>

          {message && (
            <p className={`mt-4 text-center text-[13px] ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}

          <p className="mt-6 text-center text-[11px] text-[#737373]">
            <Link href="/" className="hover:text-[#fafafa]">← Back</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function OAuthButton({ children, onClick, loading }: { children: React.ReactNode; onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-[#fafafa] hover:bg-white/10 disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
