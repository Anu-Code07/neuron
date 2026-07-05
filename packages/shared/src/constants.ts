/** Context layers — ordered by scope specificity */
export enum ContextLayer {
  User = 1,
  Organization = 2,
  Project = 3,
  Branch = 4,
  Task = 5,
  Conversation = 6,
}

/** All storable memory types in the knowledge graph */
export enum MemoryType {
  Architecture = 'architecture',
  CodingStandard = 'coding_standard',
  TechStack = 'tech_stack',
  Component = 'component',
  Api = 'api',
  Database = 'database',
  BusinessRule = 'business_rule',
  Fact = 'fact',
  Decision = 'decision',
  Pattern = 'pattern',
  Task = 'task',
  Feature = 'feature',
  Bug = 'bug',
  Conversation = 'conversation',
  Relationship = 'relationship',
  Entity = 'entity',
  Dependency = 'dependency',
  Roadmap = 'roadmap',
  Note = 'note',
  File = 'file',
}

/** Relationship types between knowledge graph entities */
export enum RelationshipType {
  Uses = 'uses',
  References = 'references',
  DependsOn = 'depends_on',
  Implements = 'implements',
  Supersedes = 'supersedes',
  RelatedTo = 'related_to',
  Calls = 'calls',
  Contains = 'contains',
  Blocks = 'blocks',
  Fixes = 'fixes',
}

/** Memory retention status */
export enum MemoryStatus {
  Active = 'active',
  Superseded = 'superseded',
  Merged = 'merged',
  Forgotten = 'forgotten',
  Expired = 'expired',
}

/** Organization member roles */
export enum OrgRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
  Viewer = 'viewer',
}

/** Project member roles */
export enum ProjectRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
}

/** Default TTL in hours per memory type (-1 = permanent) */
export const MEMORY_TTL_HOURS: Record<MemoryType, number> = {
  [MemoryType.Architecture]: -1,
  [MemoryType.CodingStandard]: -1,
  [MemoryType.TechStack]: -1,
  [MemoryType.Component]: -1,
  [MemoryType.Api]: -1,
  [MemoryType.Database]: -1,
  [MemoryType.BusinessRule]: -1,
  [MemoryType.Fact]: -1,
  [MemoryType.Decision]: -1,
  [MemoryType.Pattern]: -1,
  [MemoryType.Task]: 168,
  [MemoryType.Feature]: -1,
  [MemoryType.Bug]: -1,
  [MemoryType.Conversation]: 24,
  [MemoryType.Relationship]: -1,
  [MemoryType.Entity]: -1,
  [MemoryType.Dependency]: -1,
  [MemoryType.Roadmap]: -1,
  [MemoryType.Note]: -1,
  [MemoryType.File]: -1,
};

/** Retrieval weight multiplier per memory type */
export const MEMORY_RETRIEVAL_WEIGHT: Record<MemoryType, number> = {
  [MemoryType.Architecture]: 0.9,
  [MemoryType.CodingStandard]: 0.8,
  [MemoryType.TechStack]: 0.85,
  [MemoryType.Component]: 0.7,
  [MemoryType.Api]: 0.85,
  [MemoryType.Database]: 0.85,
  [MemoryType.BusinessRule]: 0.75,
  [MemoryType.Fact]: 0.6,
  [MemoryType.Decision]: 0.95,
  [MemoryType.Pattern]: 0.8,
  [MemoryType.Task]: 1.0,
  [MemoryType.Feature]: 0.7,
  [MemoryType.Bug]: 0.9,
  [MemoryType.Conversation]: 0.3,
  [MemoryType.Relationship]: 0.4,
  [MemoryType.Entity]: 0.5,
  [MemoryType.Dependency]: 0.7,
  [MemoryType.Roadmap]: 0.5,
  [MemoryType.Note]: 0.4,
  [MemoryType.File]: 0.65,
};

/** Layer priority for retrieval scoring */
export const LAYER_PRIORITY: Record<ContextLayer, number> = {
  [ContextLayer.User]: 0.3,
  [ContextLayer.Organization]: 0.4,
  [ContextLayer.Project]: 0.6,
  [ContextLayer.Branch]: 0.8,
  [ContextLayer.Task]: 1.0,
  [ContextLayer.Conversation]: 0.5,
};
