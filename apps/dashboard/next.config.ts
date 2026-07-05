import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@neuron/shared', '@neuron/context-engine', '@neuron/supabase'],
};

export default nextConfig;
