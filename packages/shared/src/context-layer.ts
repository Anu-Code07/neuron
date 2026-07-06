import { ContextLayer } from './constants.js';

const LAYER_TO_DB: Record<ContextLayer, string> = {
  [ContextLayer.User]: 'user',
  [ContextLayer.Organization]: 'organization',
  [ContextLayer.Project]: 'project',
  [ContextLayer.Branch]: 'branch',
  [ContextLayer.Task]: 'task',
  [ContextLayer.Conversation]: 'conversation',
};

const DB_TO_LAYER: Record<string, ContextLayer> = {
  user: ContextLayer.User,
  organization: ContextLayer.Organization,
  project: ContextLayer.Project,
  branch: ContextLayer.Branch,
  task: ContextLayer.Task,
  conversation: ContextLayer.Conversation,
};

const DB_LAYER_NAMES = new Set(Object.keys(DB_TO_LAYER));

/** Postgres context_layer enum expects strings like 'project', not numeric 3 */
export function contextLayerToDb(layer: ContextLayer | string | number | undefined): string {
  if (layer === undefined || layer === null) return 'project';
  if (typeof layer === 'string' && DB_LAYER_NAMES.has(layer)) return layer;
  const numeric = typeof layer === 'number' ? layer : Number(layer);
  if (!Number.isNaN(numeric) && LAYER_TO_DB[numeric as ContextLayer]) {
    return LAYER_TO_DB[numeric as ContextLayer];
  }
  return 'project';
}

export function contextLayerFromDb(layer: string): ContextLayer {
  return DB_TO_LAYER[layer] ?? ContextLayer.Project;
}
