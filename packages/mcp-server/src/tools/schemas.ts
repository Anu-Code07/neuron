import { z } from 'zod';

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

export const SearchMemorySchema = z.object({
  project_id: z.string().uuid(),
  query: z.string().min(1),
  types: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).optional(),
});

export const GetProjectContextSchema = z.object({
  project_id: z.string().uuid(),
  query: z.string().optional(),
  task_description: z.string().optional(),
  open_files: z.array(z.string()).optional(),
  branch_name: z.string().optional(),
  token_budget: z.number().min(500).max(32000).optional(),
});

export const GetTaskContextSchema = z.object({
  project_id: z.string().uuid(),
  task_description: z.string(),
  open_files: z.array(z.string()).optional(),
  token_budget: z.number().min(500).max(32000).optional(),
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
