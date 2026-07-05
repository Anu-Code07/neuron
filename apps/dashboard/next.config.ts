import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ['@neuron/shared', '@neuron/context-engine', '@neuron/supabase'],
  // Include monorepo packages in serverless bundle traces
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
