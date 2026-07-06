import { normalizeRepoTag, mergeMemoryTags, resolveReadTags } from '@neuron/shared';

export function readRepoFromRequest(request: Request): string | undefined {
  const header = request.headers.get('x-neuron-repo');
  return header ? normalizeRepoTag(header) : undefined;
}

export function readProjectOverride(request: Request): string | undefined {
  return request.headers.get('x-neuron-project-id')?.trim() || undefined;
}

export { mergeMemoryTags, resolveReadTags, normalizeRepoTag };
