/** Normalize NEURON_REPO / --repo to a stable memory tag */
export function normalizeRepoTag(repo: string): string | undefined {
  const slug = repo
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  if (!slug) return undefined;
  return slug.startsWith('repo:') ? slug : `repo:${slug}`;
}

export function readNeuronRepoEnv(): string | undefined {
  const raw = process.env.NEURON_REPO?.trim();
  return raw ? normalizeRepoTag(raw) : undefined;
}

export function mergeMemoryTags(userTags?: string[], repoTag?: string): string[] | undefined {
  const set = new Set<string>();
  if (repoTag) set.add(repoTag);
  for (const t of userTags ?? []) {
    const n = t.trim().toLowerCase();
    if (n) set.add(n);
  }
  return set.size ? [...set] : undefined;
}

/** Tags for read filters — repo tag is always required when set */
export function resolveReadTags(explicit?: string[], repoTag?: string): {
  requiredRepoTag?: string;
  overlapTags?: string[];
} {
  const overlap = explicit?.map((t) => t.trim().toLowerCase()).filter(Boolean);
  return {
    requiredRepoTag: repoTag,
    overlapTags: overlap?.length ? overlap : undefined,
  };
}
