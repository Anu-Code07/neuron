import { ContextLayer, MemoryStatus, MemoryType, OrgRole, ProjectRole } from './constants.js';

import type { ContextPacket } from './context.js';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferences: UserPreferences;
}

export interface UserPreferences {
  favoriteAi?: string;
  languages?: string[];
  codingStyle?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'staff';
  theme?: 'light' | 'dark' | 'system';
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  ownerId: string;
}

export interface OrganizationMember extends BaseEntity {
  organizationId: string;
  userId: string;
  role: OrgRole;
}

export interface Project extends BaseEntity {
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  techStack: string[];
  settings: ProjectSettings;
}

export interface ProjectSettings {
  defaultBranch?: string;
  contextTokenBudget?: number;
  autoExtract?: boolean;
  embeddingModel?: string;
}

export interface ProjectMember extends BaseEntity {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export interface Repository extends BaseEntity {
  projectId: string;
  name: string;
  url: string | null;
  defaultBranch: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
}

/** Base memory record — all typed memories extend this */
export interface Memory extends BaseEntity {
  projectId: string;
  type: MemoryType;
  layer: ContextLayer;
  title: string;
  content: string;
  summary: string | null;
  status: MemoryStatus;
  confidence: number;
  importance: number;
  accessCount: number;
  lastAccessedAt: string | null;
  expiresAt: string | null;
  source: MemorySource;
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface MemorySource {
  type: 'conversation' | 'file' | 'commit' | 'pr' | 'manual' | 'extraction' | 'import';
  referenceId?: string;
  actorId?: string;
}

export interface DecisionMemory extends Omit<Memory, 'type' | 'metadata'> {
  type: MemoryType.Decision;
  metadata: DecisionMetadata & Record<string, unknown>;
}

export interface DecisionMetadata {
  chosen: string;
  alternatives?: string[];
  reason: string;
  impact?: string;
}

export interface BugMemory extends Omit<Memory, 'type' | 'metadata'> {
  type: MemoryType.Bug;
  metadata: BugMetadata & Record<string, unknown>;
}

export interface BugMetadata {
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  reproduction?: string;
  affectedComponents?: string[];
}

export interface ApiMemory extends Omit<Memory, 'type' | 'metadata'> {
  type: MemoryType.Api;
  metadata: ApiMetadata & Record<string, unknown>;
}

export interface ApiMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  requestBody?: string;
  responseBody?: string;
  authRequired?: boolean;
}

export interface ComponentMemory extends Omit<Memory, 'type' | 'metadata'> {
  type: MemoryType.Component;
  metadata: ComponentMetadata & Record<string, unknown>;
}

export interface ComponentMetadata {
  filePath?: string;
  language?: string;
  framework?: string;
  exports?: string[];
}

export interface FileMemory extends Omit<Memory, 'type' | 'metadata'> {
  type: MemoryType.File;
  metadata: FileMetadata & Record<string, unknown>;
}

export interface FileMetadata {
  path: string;
  language?: string;
  lastModified?: string;
  lineCount?: number;
}

export interface TaskMemory extends Omit<Memory, 'type' | 'metadata'> {
  type: MemoryType.Task;
  metadata: TaskMetadata & Record<string, unknown>;
}

export interface TaskMetadata {
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  acceptanceCriteria?: string[];
  assigneeId?: string;
}

export interface Relationship extends BaseEntity {
  projectId: string;
  sourceMemoryId: string;
  targetMemoryId: string;
  type: string;
  metadata: Record<string, unknown>;
}

export interface Embedding extends BaseEntity {
  memoryId: string;
  projectId: string;
  vector: number[];
  model: string;
}

export interface ContextSnapshot extends BaseEntity {
  projectId: string;
  branchName: string | null;
  taskId: string | null;
  packet: ContextPacket;
  tokenEstimate: number;
}

export interface AuditLog extends BaseEntity {
  projectId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
}

export interface ApiKey extends BaseEntity {
  projectId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}
