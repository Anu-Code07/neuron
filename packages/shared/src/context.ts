import type { ContextLayer } from './constants.js';
import type {
  ApiMemory,
  BugMemory,
  ComponentMemory,
  DecisionMemory,
  Memory,
  Project,
  TaskMemory,
} from './entities.js';

/** Signals used to assemble a context packet */
export interface ContextQuery {
  projectId: string;
  query?: string;
  taskDescription?: string;
  openFiles?: string[];
  branchName?: string;
  recentEdits?: RecentEdit[];
  layerFilter?: ContextLayer[];
  tokenBudget?: number;
  includeTypes?: string[];
  excludeTypes?: string[];
  /** When set, only memories with overlapping tags are included */
  tags?: string[];
  /** When set (e.g. from NEURON_REPO), memories must include this tag */
  requiredRepoTag?: string;
  /** Pull highlights from linked projects (host ↔ package) */
  includeLinkedProjects?: boolean;
}

export interface RecentEdit {
  filePath: string;
  timestamp: string;
  changeType: 'create' | 'modify' | 'delete';
}

/** The compressed, AI-ready output of the context engine */
export interface ContextPacket {
  project: ProjectSummary;
  architecture: ArchitectureSummary | null;
  decisions: DecisionSummary[];
  conventions: ConventionSummary[];
  facts: FactSummary[];
  activeBugs: BugSummary[];
  relevantApis: ApiSummary[];
  relatedComponents: ComponentSummary[];
  currentTask: TaskSummary | null;
  recentChanges: ChangeSummary[];
  dependencies: DependencySummary[];
  relationships: RelationshipPath[];
  tokenEstimate: number;
  generatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  techStack: string[];
  description: string | null;
}

export interface ArchitectureSummary {
  summary: string;
  layers: string[];
  patterns: string[];
  keyDecisions: string[];
}

export interface DecisionSummary {
  id: string;
  title: string;
  chosen: string;
  reason: string;
  confidence: number;
  alternatives?: string[];
}

export interface ConventionSummary {
  id: string;
  title: string;
  description: string;
  examples?: string[];
}

export interface FactSummary {
  id: string;
  title: string;
  content: string;
  confidence: number;
}

export interface BugSummary {
  id: string;
  title: string;
  severity: string;
  status: string;
  reproduction?: string;
}

export interface ApiSummary {
  id: string;
  title: string;
  method: string;
  path: string;
  description?: string;
}

export interface ComponentSummary {
  id: string;
  title: string;
  filePath?: string;
  description: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  acceptanceCriteria?: string[];
}

export interface ChangeSummary {
  filePath: string;
  changeType: string;
  timestamp: string;
}

export interface DependencySummary {
  from: string;
  to: string;
  type: string;
}

export interface RelationshipPath {
  nodes: string[];
  edges: string[];
}

/** Scored memory result from retrieval */
export interface ScoredMemory {
  memory: Memory;
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  semanticSimilarity: number;
  keywordMatch: number;
  graphProximity: number;
  recency: number;
  importance: number;
  layerPriority: number;
  confidence: number;
  composite: number;
}

/** Input for storing a new memory */
export interface RememberInput {
  projectId: string;
  type: string;
  title: string;
  content: string;
  layer?: ContextLayer;
  confidence?: number;
  importance?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  source?: {
    type: string;
    referenceId?: string;
    actorId?: string;
  };
  relationships?: Array<{
    targetMemoryId: string;
    type: string;
  }>;
}

/** Search parameters */
export interface SearchMemoryInput {
  projectId: string;
  query: string;
  types?: string[];
  tags?: string[];
  requiredRepoTag?: string;
  includeLinkedProjects?: boolean;
  limit?: number;
  minConfidence?: number;
  includeSuperseded?: boolean;
}

export interface SearchMemoryResult {
  results: ScoredMemory[];
  totalCount: number;
  query: string;
  linkedProjectsSearched?: string[];
}

/** Forget / merge operations */
export interface ForgetMemoryInput {
  memoryId: string;
  reason?: string;
}

export interface MergeMemoryInput {
  sourceMemoryId: string;
  targetMemoryId: string;
  mergedTitle?: string;
  mergedContent?: string;
}

/** Type guards */
export function isDecisionMemory(m: Memory): m is DecisionMemory {
  return m.type === 'decision';
}

export function isBugMemory(m: Memory): m is BugMemory {
  return m.type === 'bug';
}

export function isApiMemory(m: Memory): m is ApiMemory {
  return m.type === 'api';
}

export function isComponentMemory(m: Memory): m is ComponentMemory {
  return m.type === 'component';
}

export function isTaskMemory(m: Memory): m is TaskMemory {
  return m.type === 'task';
}

/** Map domain memories to context packet summaries */
export function toDecisionSummary(m: DecisionMemory): DecisionSummary {
  return {
    id: m.id,
    title: m.title,
    chosen: (m.metadata as { chosen?: string }).chosen ?? m.content,
    reason: (m.metadata as { reason?: string }).reason ?? '',
    confidence: m.confidence,
    alternatives: (m.metadata as { alternatives?: string[] }).alternatives,
  };
}

export function toBugSummary(m: BugMemory): BugSummary {
  return {
    id: m.id,
    title: m.title,
    severity: (m.metadata as { severity?: string }).severity ?? 'medium',
    status: (m.metadata as { status?: string }).status ?? 'open',
    reproduction: (m.metadata as { reproduction?: string }).reproduction,
  };
}

export function toApiSummary(m: ApiMemory): ApiSummary {
  return {
    id: m.id,
    title: m.title,
    method: (m.metadata as { method?: string }).method ?? 'GET',
    path: (m.metadata as { path?: string }).path ?? '',
    description: (m.metadata as { description?: string }).description,
  };
}

export function toComponentSummary(m: ComponentMemory): ComponentSummary {
  return {
    id: m.id,
    title: m.title,
    filePath: (m.metadata as { filePath?: string }).filePath,
    description: m.summary ?? m.content,
  };
}

export function toTaskSummary(m: TaskMemory): TaskSummary {
  return {
    id: m.id,
    title: m.title,
    status: (m.metadata as { status?: string }).status ?? 'todo',
    acceptanceCriteria: (m.metadata as { acceptanceCriteria?: string[] }).acceptanceCriteria,
  };
}
