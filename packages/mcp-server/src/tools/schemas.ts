import { z } from 'zod';

export type RegisterToolOptions = {
  /** When set (hosted MCP), project_id is inferred from NEURON_API_KEY */
  defaultProjectId?: string;
};

/** Make project_id optional in tool schemas for hosted MCP (key → project) */
export function hostedSchema<T extends z.ZodObject<z.ZodRawShape>>(schema: T, hosted: boolean) {
  if (!hosted) return schema;
  return schema.extend({ project_id: z.string().uuid().optional() });
}

export function toolShape<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  hosted: boolean,
): z.ZodRawShape {
  return hostedSchema(schema, hosted).shape;
}

export function parseToolArgs<T extends { project_id?: string }>(
  schema: z.ZodType<T>,
  args: unknown,
  defaultProjectId?: string,
): T & { project_id: string } {
  const parsed = schema.parse(args) as T;
  const project_id = parsed.project_id ?? defaultProjectId;
  if (!project_id) {
    throw new Error('project_id is required');
  }
  return { ...parsed, project_id };
}

export const RememberSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(10000),
  confidence: z.number().min(0).max(1).optional(),
  importance: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RememberDecisionSchema = RememberSchema.extend({
  chosen: z.string(),
  alternatives: z.array(z.string()).optional(),
  reason: z.string(),
});

export const RememberBugSchema = RememberSchema.extend({
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['open', 'in_progress', 'resolved', 'wont_fix']).default('open'),
  reproduction: z.string().optional(),
});

export const RememberApiSchema = RememberSchema.extend({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(),
  description: z.string().optional(),
  auth_required: z.boolean().optional(),
});

export const RememberComponentSchema = RememberSchema.extend({
  file_path: z.string().optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
});

export const RememberRelationshipSchema = z.object({
  project_id: z.string().uuid(),
  source_memory_id: z.string().uuid(),
  target_memory_id: z.string().uuid(),
  type: z.enum([
    'uses', 'references', 'depends_on', 'implements', 'supersedes',
    'related_to', 'calls', 'contains', 'blocks', 'fixes',
  ]),
});

export const ResponseFormatSchema = z.enum(['brief', 'compact', 'full']).optional();

export const SearchMemorySchema = z.object({
  project_id: z.string().uuid(),
  query: z.string().min(1),
  types: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  include_linked_projects: z.boolean().optional(),
  limit: z.number().min(1).max(50).optional(),
  format: ResponseFormatSchema,
});

export const FindMemorySchema = z.object({
  project_id: z.string().uuid(),
  query: z.string().min(1),
  types: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  include_linked_projects: z.boolean().optional(),
  limit: z.number().min(1).max(20).optional(),
  format: ResponseFormatSchema,
});

export const GetProjectContextSchema = z.object({
  project_id: z.string().uuid(),
  query: z.string().optional(),
  task_description: z.string().optional(),
  open_files: z.array(z.string()).optional(),
  branch_name: z.string().optional(),
  token_budget: z.number().min(500).max(32000).optional(),
  tags: z.array(z.string()).optional(),
  include_linked_projects: z.boolean().optional(),
  format: ResponseFormatSchema,
});

export const GetWorkspaceContextSchema = GetProjectContextSchema.extend({
  task_description: z.string().optional(),
});

export const ListReposSchema = z.object({
  project_id: z.string().uuid(),
});

export const RegisterRepoSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  repo_slug: z.string().min(1).max(64),
  url: z.string().url().optional(),
  default_branch: z.string().optional(),
});

export const DeleteRepoSchema = z.object({
  repo_id: z.string().uuid(),
});

export const ListProjectLinksSchema = z.object({
  project_id: z.string().uuid(),
});

export const LinkProjectSchema = z.object({
  project_id: z.string().uuid(),
  target_project_id: z.string().uuid().optional(),
  target_project_slug: z.string().optional(),
  link_type: z
    .enum(['depends_on', 'contains', 'consumes', 'workspace'])
    .default('depends_on'),
  label: z.string().max(200).optional(),
});

export const UnlinkProjectSchema = z.object({
  link_id: z.string().uuid(),
});

export const CheatsheetSchema = z.object({
  section: z
    .enum(['all', 'start', 'remember', 'search', 'context', 'workspace', 'graph', 'ai', 'maintain'])
    .optional(),
});

export const GetTaskContextSchema = z.object({
  project_id: z.string().uuid(),
  task_description: z.string(),
  open_files: z.array(z.string()).optional(),
  token_budget: z.number().min(500).max(32000).optional(),
  tags: z.array(z.string()).optional(),
  format: ResponseFormatSchema,
});

export const GetFileContextSchema = z.object({
  project_id: z.string().uuid(),
  file_path: z.string(),
  token_budget: z.number().min(500).max(32000).optional(),
});

export const FindRelatedSchema = z.object({
  memory_id: z.string().uuid(),
  depth: z.number().min(1).max(3).optional(),
});

export const ForgetMemorySchema = z.object({
  memory_id: z.string().uuid(),
  reason: z.string().optional(),
});

export const MergeMemorySchema = z.object({
  source_memory_id: z.string().uuid(),
  target_memory_id: z.string().uuid(),
});

export const SummarizeProjectSchema = z.object({
  project_id: z.string().uuid(),
});

export const FindDuplicatesSchema = z.object({
  project_id: z.string().uuid(),
  memory_id: z.string().uuid().optional(),
});

export const ExtractMemoriesSchema = z.object({
  project_id: z.string().uuid(),
  conversation: z.string().min(1).max(50000),
});

export const PreviewMemoriesSchema = z.object({
  conversation: z.string().min(1).max(50000),
});

export const SuggestTagsSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(10000),
});

export const AskProjectSchema = z.object({
  project_id: z.string().uuid(),
  question: z.string().min(1).max(2000),
  limit: z.number().min(1).max(20).optional(),
  format: ResponseFormatSchema,
});

export const SuggestContextSchema = z.object({
  project_id: z.string().uuid(),
  task_description: z.string().min(1).max(2000),
  open_files: z.array(z.string()).optional(),
  limit: z.number().min(1).max(15).optional(),
});

export const CondenseMemoriesSchema = z.object({
  project_id: z.string().uuid(),
  memory_ids: z.array(z.string().uuid()).min(2).max(5),
  save: z.boolean().optional(),
});

export const SuggestRelationshipsSchema = z.object({
  project_id: z.string().uuid(),
  memory_id: z.string().uuid(),
});

export const ExtractFromDiffSchema = z.object({
  project_id: z.string().uuid(),
  diff: z.string().min(1).max(50000),
  save: z.boolean().optional(),
});
