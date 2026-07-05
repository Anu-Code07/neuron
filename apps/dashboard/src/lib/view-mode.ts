'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const VIEW_MODES = [
  'home',
  'memories',
  'graph',
  'context',
  'integrations',
  'docs',
  'mcp',
  'settings',
] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export function useViewMode() {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(VIEW_MODES).withDefault('home'),
  );
  return { viewMode: view, setViewMode: setView };
}
