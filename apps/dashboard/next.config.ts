import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, '../..');

/** Resolve workspace packages from source — works on Vercel without pnpm symlinks */
const workspaceAliases = {
  '@neuron/shared': path.join(monorepoRoot, 'packages/shared/src'),
  '@neuron/context-engine': path.join(monorepoRoot, 'packages/context-engine/src'),
  '@neuron/supabase': path.join(monorepoRoot, 'packages/supabase/src'),
};

const nextConfig: NextConfig = {
  transpilePackages: ['@neuron/shared', '@neuron/context-engine', '@neuron/supabase'],
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...workspaceAliases,
    };
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@neuron/shared': path.join(monorepoRoot, 'packages/shared/src'),
      '@neuron/context-engine': path.join(monorepoRoot, 'packages/context-engine/src'),
      '@neuron/supabase': path.join(monorepoRoot, 'packages/supabase/src'),
    },
  },
};

export default nextConfig;
