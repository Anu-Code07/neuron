import { createHash, randomBytes } from 'node:crypto';

export const API_KEY_PREFIX = 'nrn_';

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `${API_KEY_PREFIX}${randomBytes(24).toString('hex')}`;
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.slice(0, 12),
  };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}
