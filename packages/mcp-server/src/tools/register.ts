import type { ContextEngine } from '@neuron/context-engine';
import { ContextLayer, MemoryType, ProjectLinkType, mergeMemoryTags, resolveReadTags } from '@neuron/shared';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  RememberSchema,
  RememberDecisionSchema,
  RememberBugSchema,
  RememberApiSchema,
  RememberComponentSchema,
  RememberRelationshipSchema,
  SearchMemorySchema,
  FindMemorySchema,
  GetProjectContextSchema,
  GetTaskContextSchema,
  GetFileContextSchema,
  FindRelatedSchema,
  ForgetMemorySchema,
  MergeMemorySchema,
  SummarizeProjectSchema,
  FindDuplicatesSchema,
  ExtractMemoriesSchema,
  PreviewMemoriesSchema,
  SuggestTagsSchema,
  AskProjectSchema,
  SuggestContextSchema,
  CondenseMemoriesSchema,
  SuggestRelationshipsSchema,
  ExtractFromDiffSchema,
  GetWorkspaceContextSchema,
  ListReposSchema,
  RegisterRepoSchema,
  DeleteRepoSchema,
  ListProjectLinksSchema,
  LinkProjectSchema,
  UnlinkProjectSchema,
  CheatsheetSchema,
} from './schemas.js';
import {
  type RegisterToolOptions,
  isHostedRegistration,
  parseProjectArgs,
  projectIdZod,
  toolShape,
  withOptionalProjectId,
} from './hosted-args.js';
import { getCheatsheet, getAgentInstructions } from '@neuron/shared';
import {
  formatAskResponse,
  formatContextResponse,
  formatRememberResponse,
  formatWorkspaceResponse,
  mcpText,
  resolveMcpFormat,
} from './response.js';
import { compactSearchResult } from '@neuron/shared';

function textResult(data: unknown, format?: ReturnType<typeof resolveMcpFormat>) {
  return mcpText(data, format ?? resolveMcpFormat());
}

function readFilters(explicitTags?: string[], repoTag?: string) {
  const { requiredRepoTag, overlapTags } = resolveReadTags(explicitTags, repoTag);
  return { requiredRepoTag, tags: overlapTags };
}

function makeRememberHandler(
  engine: ContextEngine,
  type: MemoryType,
  hosted: boolean,
  defaultProjectId?: string,
  defaultRepoTag?: string,
) {
  return async (args: Record<string, unknown>) => {
    const schema = withOptionalProjectId(RememberSchema, hosted);
    const parsed = parseProjectArgs(schema, args, defaultProjectId);
    const memory = await engine.remember({
      projectId: parsed.project_id,
      type,
      title: parsed.title,
      content: parsed.content,
      confidence: parsed.confidence,
      importance: parsed.importance,
      tags: mergeMemoryTags(parsed.tags, defaultRepoTag),
      metadata: parsed.metadata,
      layer: ContextLayer.Project,
    });
    const fmt = resolveMcpFormat();
    return textResult(formatRememberResponse(memory, fmt), fmt);
  };
}

export function registerTools(
  server: McpServer,
  engine: ContextEngine,
  options?: RegisterToolOptions,
): void {
  const hosted = isHostedRegistration(options);
  const defaultProjectId = options?.defaultProjectId;
  const defaultRepoTag = options?.defaultRepoTag;

  server.registerTool(
    'cheatsheet',
    {
      title: 'START HERE — Neuron tool guide',
      description:
        'CALL THIS FIRST before any other Neuron tool. Returns agent instructions, when-to-use for every tool, workflows, NEURON_REPO scoping, and a decision tree. Use section "start" for essentials, "all" for full reference.',
      inputSchema: CheatsheetSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const parsed = CheatsheetSchema.parse(args);
      const sheet = getCheatsheet(parsed.section ?? 'all');
      return textResult({
        ...sheet,
        reminder: 'Next: call get_workspace_context before other Neuron tools.',
      });
    },
  );

  server.registerPrompt(
    'neuron_session_start',
    {
      title: 'Start Neuron session',
      description:
        'Run at the beginning of a task — loads Neuron agent instructions (same as cheatsheet section start)',
    },
    async () => ({
      messages: [
        {
          role: 'user' as const,
          content: { type: 'text' as const, text: getAgentInstructions() },
        },
      ],
    }),
  );

  server.tool(
    'remember_fact',
    'Store a factual piece of project knowledge',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Fact, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_decision',
    'Store an architectural or product decision with rationale',
    {
      project_id: projectIdZod(hosted),
      title: RememberDecisionSchema.shape.title,
      content: RememberDecisionSchema.shape.content,
      chosen: RememberDecisionSchema.shape.chosen,
      alternatives: RememberDecisionSchema.shape.alternatives,
      reason: RememberDecisionSchema.shape.reason,
      confidence: RememberDecisionSchema.shape.confidence,
      tags: RememberDecisionSchema.shape.tags,
    },
    async (args) => {
      const schema = withOptionalProjectId(RememberDecisionSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Decision,
        title: parsed.title,
        content: parsed.content,
        confidence: parsed.confidence,
        tags: mergeMemoryTags(parsed.tags, defaultRepoTag),
        metadata: {
          chosen: parsed.chosen,
          alternatives: parsed.alternatives,
          reason: parsed.reason,
        },
        layer: ContextLayer.Project,
      });
      const fmt = resolveMcpFormat();
      return textResult(formatRememberResponse(memory, fmt), fmt);
    },
  );

  server.tool(
    'remember_pattern',
    'Store a coding pattern or convention',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Pattern, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_bug',
    'Store a bug report with severity and reproduction steps',
    {
      project_id: projectIdZod(hosted),
      title: RememberBugSchema.shape.title,
      content: RememberBugSchema.shape.content,
      severity: RememberBugSchema.shape.severity,
      status: RememberBugSchema.shape.status,
      reproduction: RememberBugSchema.shape.reproduction,
      tags: RememberBugSchema.shape.tags,
    },
    async (args) => {
      const schema = withOptionalProjectId(RememberBugSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Bug,
        title: parsed.title,
        content: parsed.content,
        tags: mergeMemoryTags(parsed.tags, defaultRepoTag),
        metadata: {
          severity: parsed.severity,
          status: parsed.status,
          reproduction: parsed.reproduction,
        },
        layer: ContextLayer.Project,
      });
      const fmt = resolveMcpFormat();
      return textResult(formatRememberResponse(memory, fmt), fmt);
    },
  );

  server.tool(
    'remember_component',
    'Store a software component definition',
    {
      project_id: projectIdZod(hosted),
      title: RememberComponentSchema.shape.title,
      content: RememberComponentSchema.shape.content,
      file_path: RememberComponentSchema.shape.file_path,
      language: RememberComponentSchema.shape.language,
      framework: RememberComponentSchema.shape.framework,
      tags: RememberComponentSchema.shape.tags,
    },
    async (args) => {
      const schema = withOptionalProjectId(RememberComponentSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Component,
        title: parsed.title,
        content: parsed.content,
        tags: mergeMemoryTags(parsed.tags, defaultRepoTag),
        metadata: {
          filePath: parsed.file_path,
          language: parsed.language,
          framework: parsed.framework,
        },
        layer: ContextLayer.Project,
      });
      const fmt = resolveMcpFormat();
      return textResult(formatRememberResponse(memory, fmt), fmt);
    },
  );

  server.tool(
    'remember_api',
    'Store an API endpoint definition',
    {
      project_id: projectIdZod(hosted),
      title: RememberApiSchema.shape.title,
      content: RememberApiSchema.shape.content,
      method: RememberApiSchema.shape.method,
      path: RememberApiSchema.shape.path,
      description: RememberApiSchema.shape.description,
      auth_required: RememberApiSchema.shape.auth_required,
      tags: RememberApiSchema.shape.tags,
    },
    async (args) => {
      const schema = withOptionalProjectId(RememberApiSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Api,
        title: parsed.title,
        content: parsed.content,
        tags: mergeMemoryTags(parsed.tags, defaultRepoTag),
        metadata: {
          method: parsed.method,
          path: parsed.path,
          description: parsed.description,
          authRequired: parsed.auth_required,
        },
        layer: ContextLayer.Project,
      });
      const fmt = resolveMcpFormat();
      return textResult(formatRememberResponse(memory, fmt), fmt);
    },
  );

  server.tool(
    'remember_task',
    'Store a task with goals and acceptance criteria',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Task, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_architecture',
    'Store architectural knowledge about the project',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Architecture, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_database',
    'Store database schema or query knowledge',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Database, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_relationship',
    'Create a relationship between two memories in the knowledge graph',
    toolShape(RememberRelationshipSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(RememberRelationshipSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Relationship,
        title: `${parsed.type}: ${parsed.source_memory_id} → ${parsed.target_memory_id}`,
        content: `Relationship of type ${parsed.type}`,
        relationships: [
          { targetMemoryId: parsed.target_memory_id, type: parsed.type },
        ],
        layer: ContextLayer.Project,
      });
      return textResult({ success: true });
    },
  );

  server.tool(
    'remember_note',
    'Store a general note',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Note, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_file',
    'Store knowledge about a specific file in the codebase',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.File, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'remember_conversation',
    'Extract and store knowledge from a conversation (raw chat is not stored)',
    toolShape(RememberSchema, hosted),
    makeRememberHandler(engine, MemoryType.Conversation, hosted, defaultProjectId, defaultRepoTag),
  );

  server.tool(
    'search_memory',
    'Hybrid Groq+vector search — default format=brief returns a tight AI summary + memory cards (saves tokens)',
    toolShape(SearchMemorySchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(SearchMemorySchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const filters = readFilters(parsed.tags, defaultRepoTag);
      const fmt = resolveMcpFormat(parsed.format);

      if (fmt === 'brief') {
        const found = await engine.findMemory(parsed.project_id, parsed.query, {
          types: parsed.types,
          tags: filters.tags,
          requiredRepoTag: filters.requiredRepoTag,
          includeLinkedProjects: parsed.include_linked_projects ?? true,
          limit: parsed.limit,
          withBrief: true,
        });
        return textResult(found, fmt);
      }

      const results = await engine.searchMemory(parsed.project_id, parsed.query, {
        types: parsed.types,
        tags: filters.tags,
        requiredRepoTag: filters.requiredRepoTag,
        includeLinkedProjects: parsed.include_linked_projects ?? true,
        limit: parsed.limit,
      });
      return textResult(fmt === 'full' ? results : compactSearchResult(results), fmt);
    },
  );

  server.tool(
    'find_memory',
    'Best fuzzy finder — Groq rewrite + HyDE + title sweep, returns brief + structured memory cards',
    toolShape(FindMemorySchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(FindMemorySchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const filters = readFilters(parsed.tags, defaultRepoTag);
      const fmt = resolveMcpFormat(parsed.format);
      const found = await engine.findMemory(parsed.project_id, parsed.query, {
        types: parsed.types,
        tags: filters.tags,
        requiredRepoTag: filters.requiredRepoTag,
        includeLinkedProjects: parsed.include_linked_projects ?? true,
        limit: parsed.limit,
        withBrief: fmt !== 'compact',
      });
      return textResult(found, fmt);
    },
  );

  server.tool(
    'get_project_context',
    'Assemble an AI-ready context packet — includes linked project context by default',
    toolShape(GetProjectContextSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(GetProjectContextSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const filters = readFilters(parsed.tags, defaultRepoTag);
      const fmt = resolveMcpFormat(parsed.format);
      const workspace = await engine.getWorkspaceContext({
        projectId: parsed.project_id,
        query: parsed.query,
        taskDescription: parsed.task_description,
        openFiles: parsed.open_files,
        branchName: parsed.branch_name,
        tokenBudget: parsed.token_budget,
        tags: filters.tags,
        requiredRepoTag: filters.requiredRepoTag,
        includeLinkedProjects: parsed.include_linked_projects ?? true,
      });
      const payload =
        fmt === 'full'
          ? {
              ...workspace.primary,
              workspace: workspace.scope,
              linkedProjects: workspace.linked,
              hints: workspace.hints,
              sessionInsights: workspace.sessionInsights,
            }
          : formatWorkspaceResponse(workspace, fmt);
      return textResult(payload, fmt);
    },
  );

  server.tool(
    'get_workspace_context',
    'Session start — Groq infers your task, preloads relevant memories, surfaces warnings. format=brief (default) saves tokens',
    toolShape(GetWorkspaceContextSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(GetWorkspaceContextSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const filters = readFilters(parsed.tags, defaultRepoTag);
      const fmt = resolveMcpFormat(parsed.format);
      const workspace = await engine.getWorkspaceContext({
        projectId: parsed.project_id,
        query: parsed.query,
        taskDescription: parsed.task_description,
        openFiles: parsed.open_files,
        branchName: parsed.branch_name,
        tokenBudget: parsed.token_budget,
        tags: filters.tags,
        requiredRepoTag: filters.requiredRepoTag,
        includeLinkedProjects: parsed.include_linked_projects ?? true,
      });
      return textResult(formatWorkspaceResponse(workspace, fmt), fmt);
    },
  );

  server.tool(
    'get_task_context',
    'Get context optimized for a specific task',
    toolShape(GetTaskContextSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(GetTaskContextSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const filters = readFilters(parsed.tags, defaultRepoTag);
      const fmt = resolveMcpFormat(parsed.format);
      const packet = await engine.getProjectContext({
        projectId: parsed.project_id,
        taskDescription: parsed.task_description,
        openFiles: parsed.open_files,
        tokenBudget: parsed.token_budget,
        layerFilter: [ContextLayer.Task, ContextLayer.Branch, ContextLayer.Project],
        tags: filters.tags,
        requiredRepoTag: filters.requiredRepoTag,
      });
      return textResult(formatContextResponse(packet, fmt), fmt);
    },
  );

  server.tool(
    'get_file_context',
    'Get context related to a specific file',
    toolShape(GetFileContextSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(GetFileContextSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const filters = readFilters(undefined, defaultRepoTag);
      const packet = await engine.getProjectContext({
        projectId: parsed.project_id,
        openFiles: [parsed.file_path],
        query: parsed.file_path,
        tokenBudget: parsed.token_budget,
        tags: filters.tags,
        requiredRepoTag: filters.requiredRepoTag,
      });
      return textResult(packet);
    },
  );

  server.tool(
    'get_architecture',
    'Get architecture summary for the project',
    { project_id: projectIdZod(hosted) },
    async (args) => {
      const schema = withOptionalProjectId(GetProjectContextSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const packet = await engine.getProjectContext({
        projectId: parsed.project_id,
        query: 'architecture system design structure',
        tokenBudget: 2000,
      });
      return textResult(packet.architecture);
    },
  );

  server.tool(
    'find_related',
    'Find memories related to a given memory via knowledge graph traversal',
    FindRelatedSchema.shape,
    async (args) => {
      const parsed = FindRelatedSchema.parse(args);
      const related = await engine.findRelated(parsed.memory_id, parsed.depth);
      return textResult({ memories: related });
    },
  );

  server.tool(
    'summarize_project',
    'Generate a compact text summary of project knowledge',
    toolShape(SummarizeProjectSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(SummarizeProjectSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const summary = await engine.summarizeProject(parsed.project_id);
      return textResult({ summary });
    },
  );

  server.tool(
    'forget_memory',
    'Mark a memory as forgotten (active forgetting)',
    ForgetMemorySchema.shape,
    async (args) => {
      const parsed = ForgetMemorySchema.parse(args);
      await engine.forget(parsed.memory_id, parsed.reason);
      return textResult({ success: true });
    },
  );

  server.tool(
    'merge_memory',
    'Merge two duplicate memories into one',
    MergeMemorySchema.shape,
    async (args) => {
      const parsed = MergeMemorySchema.parse(args);
      const merged = await engine.merge(parsed.source_memory_id, parsed.target_memory_id);
      return textResult({ success: true, memory: merged });
    },
  );

  server.tool(
    'find_duplicates',
    'Detect likely duplicate memories using Groq AI',
    toolShape(FindDuplicatesSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(FindDuplicatesSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const duplicates = await engine.findDuplicates(parsed.project_id, parsed.memory_id);
      return textResult({ duplicates });
    },
  );

  server.tool(
    'extract_memories',
    'Extract structured memories from a conversation and save them to the project',
    toolShape(ExtractMemoriesSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(ExtractMemoriesSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const extracted = await engine.extractMemoriesFromConversation(
        parsed.project_id,
        parsed.conversation,
      );
      return textResult({ extracted });
    },
  );

  server.tool(
    'preview_memories',
    'Preview memory drafts from a conversation without saving (Groq extraction)',
    PreviewMemoriesSchema.shape,
    async (args) => {
      const parsed = PreviewMemoriesSchema.parse(args);
      const drafts = await engine.previewExtractMemories(parsed.conversation);
      return textResult({ drafts });
    },
  );

  server.tool(
    'suggest_tags',
    'Suggest tags for a memory title and content using Groq',
    SuggestTagsSchema.shape,
    async (args) => {
      const parsed = SuggestTagsSchema.parse(args);
      const tags = await engine.suggestTags(parsed.title, parsed.content);
      return textResult({ tags });
    },
  );

  server.tool(
    'ask_project',
    'Ask a natural-language question answered from project memories (Groq + search)',
    toolShape(AskProjectSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(AskProjectSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const result = await engine.askProject(parsed.project_id, parsed.question, parsed.limit);
      const fmt = resolveMcpFormat(parsed.format);
      return textResult(formatAskResponse(result, fmt), fmt);
    },
  );

  server.tool(
    'suggest_context',
    'Recommend which memories to load for a task, with a Groq narrative summary',
    toolShape(SuggestContextSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(SuggestContextSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const result = await engine.suggestContext(parsed.project_id, parsed.task_description, {
        openFiles: parsed.open_files,
        limit: parsed.limit,
      });
      return textResult(result);
    },
  );

  server.tool(
    'condense_memories',
    'Merge 2–5 overlapping memories into one (preview by default, pass save=true to apply)',
    toolShape(CondenseMemoriesSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(CondenseMemoriesSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const result = await engine.condenseMemories(parsed.project_id, parsed.memory_ids, {
        save: parsed.save,
      });
      return textResult(result);
    },
  );

  server.tool(
    'suggest_relationships',
    'Suggest knowledge graph links for a memory using Groq',
    toolShape(SuggestRelationshipsSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(SuggestRelationshipsSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const result = await engine.suggestRelationships(parsed.project_id, parsed.memory_id);
      return textResult(result);
    },
  );

  server.tool(
    'extract_from_diff',
    'Extract learnings from a git diff (preview by default, pass save=true to store)',
    toolShape(ExtractFromDiffSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(ExtractFromDiffSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      if (parsed.save) {
        const extracted = await engine.extractFromDiff(parsed.project_id, parsed.diff);
        return textResult({ extracted });
      }
      const drafts = await engine.previewExtractFromDiff(parsed.diff);
      return textResult({ drafts });
    },
  );

  server.tool(
    'list_repos',
    'List registered repositories in this project (each maps to a NEURON_REPO tag)',
    toolShape(ListReposSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(ListReposSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const repos = await engine.listRepos(parsed.project_id);
      return textResult({
        repos,
        activeRepo: defaultRepoTag,
        hint: 'Set NEURON_REPO to a repo_slug when connecting MCP from that codebase.',
      });
    },
  );

  server.tool(
    'register_repo',
    'Register a repository under this project — enables NEURON_REPO scoping for host/package monorepos',
    toolShape(RegisterRepoSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(RegisterRepoSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const repo = await engine.registerRepo(parsed.project_id, {
        name: parsed.name,
        repoSlug: parsed.repo_slug,
        url: parsed.url,
        defaultBranch: parsed.default_branch,
      });
      return textResult({ success: true, repo });
    },
  );

  server.tool(
    'delete_repo',
    'Remove a registered repository from this project',
    toolShape(DeleteRepoSchema, hosted),
    async (args) => {
      const parsed = DeleteRepoSchema.parse(args);
      await engine.deleteRepo(parsed.repo_id);
      return textResult({ success: true });
    },
  );

  server.tool(
    'list_project_links',
    'List linked projects (e.g. host app depends_on payment SDK package)',
    toolShape(ListProjectLinksSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(ListProjectLinksSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);
      const links = await engine.listProjectLinks(parsed.project_id);
      return textResult({ links });
    },
  );

  server.tool(
    'link_project',
    'Connect this project to another — host depends_on package, workspace groups repos',
    toolShape(LinkProjectSchema, hosted),
    async (args) => {
      const schema = withOptionalProjectId(LinkProjectSchema, hosted);
      const parsed = parseProjectArgs(schema, args, defaultProjectId);

      let targetId = parsed.target_project_id;
      if (!targetId && parsed.target_project_slug) {
        const target = await engine.resolveProjectBySlug(parsed.target_project_slug);
        if (!target) {
          throw new Error(`Project not found with slug: ${parsed.target_project_slug}`);
        }
        targetId = target.id;
      }
      if (!targetId) {
        throw new Error('Provide target_project_id or target_project_slug');
      }

      const link = await engine.linkProject(
        parsed.project_id,
        targetId,
        parsed.link_type as ProjectLinkType,
        parsed.label,
      );
      return textResult({ success: true, link });
    },
  );

  server.tool(
    'unlink_project',
    'Remove a link between projects',
    toolShape(UnlinkProjectSchema, hosted),
    async (args) => {
      const parsed = UnlinkProjectSchema.parse(args);
      await engine.unlinkProject(parsed.link_id);
      return textResult({ success: true });
    },
  );
}
