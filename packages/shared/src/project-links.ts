export enum ProjectLinkType {
  DependsOn = 'depends_on',
  Contains = 'contains',
  Consumes = 'consumes',
  Workspace = 'workspace',
}

export const PROJECT_LINK_LABELS: Record<ProjectLinkType, string> = {
  [ProjectLinkType.DependsOn]: 'depends on',
  [ProjectLinkType.Contains]: 'contains',
  [ProjectLinkType.Consumes]: 'consumes',
  [ProjectLinkType.Workspace]: 'workspace',
};

export interface ProjectLink {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  linkType: ProjectLinkType;
  label: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  targetProject?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface RegisteredRepo {
  id: string;
  projectId: string;
  name: string;
  repoSlug: string | null;
  url: string | null;
  defaultBranch: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceScope {
  activeRepoTag?: string;
  registeredRepos: Array<{ name: string; slug: string; url: string | null }>;
  linkedProjects: Array<{
    id: string;
    name: string;
    slug: string;
    linkType: ProjectLinkType;
    label: string | null;
  }>;
}

export interface LinkedProjectContext {
  projectId: string;
  projectName: string;
  projectSlug: string;
  linkType: ProjectLinkType;
  highlights: Array<{
    id: string;
    title: string;
    type: string;
    summary?: string | null;
    score: number;
  }>;
}

export interface WorkspaceContextPacket {
  scope: WorkspaceScope;
  primary: import('./context.js').ContextPacket;
  linked: LinkedProjectContext[];
  hints: string[];
}
