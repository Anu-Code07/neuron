import type { ContextEngine } from '@neuron/context-engine';
import { ContextLayer, MemoryType } from '@neuron/shared';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  RememberSchema,
  RememberDecisionSchema,
  RememberBugSchema,
  RememberApiSchema,
  RememberComponentSchema,
  RememberRelationshipSchema,
  SearchMemorySchema,
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
} from './schemas.js';

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function makeRememberHandler(engine: ContextEngine, type: MemoryType) {
  return async (args: Record<string, unknown>) => {
    const parsed = RememberSchema.parse(args);
    const memory = await engine.remember({
      projectId: parsed.project_id,
      type,
      title: parsed.title,
      content: parsed.content,
      confidence: parsed.confidence,
      importance: parsed.importance,
      tags: parsed.tags,
      metadata: parsed.metadata,
      layer: ContextLayer.Project,
    });
    return textResult({ success: true, memory });
  };
}

export function registerTools(server: McpServer, engine: ContextEngine): void {
  server.tool(
    'remember_fact',
    'Store a factual piece of project knowledge',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Fact),
  );

  server.tool(
    'remember_decision',
    'Store an architectural or product decision with rationale',
    {
      project_id: RememberDecisionSchema.shape.project_id,
      title: RememberDecisionSchema.shape.title,
      content: RememberDecisionSchema.shape.content,
      chosen: RememberDecisionSchema.shape.chosen,
      alternatives: RememberDecisionSchema.shape.alternatives,
      reason: RememberDecisionSchema.shape.reason,
      confidence: RememberDecisionSchema.shape.confidence,
      tags: RememberDecisionSchema.shape.tags,
    },
    async (args) => {
      const parsed = RememberDecisionSchema.parse(args);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Decision,
        title: parsed.title,
        content: parsed.content,
        confidence: parsed.confidence,
        tags: parsed.tags,
        metadata: {
          chosen: parsed.chosen,
          alternatives: parsed.alternatives,
          reason: parsed.reason,
        },
        layer: ContextLayer.Project,
      });
      return textResult({ success: true, memory });
    },
  );

  server.tool(
    'remember_pattern',
    'Store a coding pattern or convention',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Pattern),
  );

  server.tool(
    'remember_bug',
    'Store a bug report with severity and reproduction steps',
    {
      project_id: RememberBugSchema.shape.project_id,
      title: RememberBugSchema.shape.title,
      content: RememberBugSchema.shape.content,
      severity: RememberBugSchema.shape.severity,
      status: RememberBugSchema.shape.status,
      reproduction: RememberBugSchema.shape.reproduction,
      tags: RememberBugSchema.shape.tags,
    },
    async (args) => {
      const parsed = RememberBugSchema.parse(args);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Bug,
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags,
        metadata: {
          severity: parsed.severity,
          status: parsed.status,
          reproduction: parsed.reproduction,
        },
        layer: ContextLayer.Project,
      });
      return textResult({ success: true, memory });
    },
  );

  server.tool(
    'remember_component',
    'Store a software component definition',
    {
      project_id: RememberComponentSchema.shape.project_id,
      title: RememberComponentSchema.shape.title,
      content: RememberComponentSchema.shape.content,
      file_path: RememberComponentSchema.shape.file_path,
      language: RememberComponentSchema.shape.language,
      framework: RememberComponentSchema.shape.framework,
      tags: RememberComponentSchema.shape.tags,
    },
    async (args) => {
      const parsed = RememberComponentSchema.parse(args);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Component,
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags,
        metadata: {
          filePath: parsed.file_path,
          language: parsed.language,
          framework: parsed.framework,
        },
        layer: ContextLayer.Project,
      });
      return textResult({ success: true, memory });
    },
  );

  server.tool(
    'remember_api',
    'Store an API endpoint definition',
    {
      project_id: RememberApiSchema.shape.project_id,
      title: RememberApiSchema.shape.title,
      content: RememberApiSchema.shape.content,
      method: RememberApiSchema.shape.method,
      path: RememberApiSchema.shape.path,
      description: RememberApiSchema.shape.description,
      auth_required: RememberApiSchema.shape.auth_required,
      tags: RememberApiSchema.shape.tags,
    },
    async (args) => {
      const parsed = RememberApiSchema.parse(args);
      const memory = await engine.remember({
        projectId: parsed.project_id,
        type: MemoryType.Api,
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags,
        metadata: {
          method: parsed.method,
          path: parsed.path,
          description: parsed.description,
          authRequired: parsed.auth_required,
        },
        layer: ContextLayer.Project,
      });
      return textResult({ success: true, memory });
    },
  );

  server.tool(
    'remember_task',
    'Store a task with goals and acceptance criteria',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Task),
  );

  server.tool(
    'remember_architecture',
    'Store architectural knowledge about the project',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Architecture),
  );

  server.tool(
    'remember_database',
    'Store database schema or query knowledge',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Database),
  );

  server.tool(
    'remember_relationship',
    'Create a relationship between two memories in the knowledge graph',
    RememberRelationshipSchema.shape,
    async (args) => {
      const parsed = RememberRelationshipSchema.parse(args);
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
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Note),
  );

  server.tool(
    'remember_file',
    'Store knowledge about a specific file in the codebase',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.File),
  );

  server.tool(
    'remember_conversation',
    'Extract and store knowledge from a conversation (raw chat is not stored)',
    RememberSchema.shape,
    makeRememberHandler(engine, MemoryType.Conversation),
  );

  server.tool(
    'search_memory',
    'Hybrid search across project memories (vector + keyword + graph)',
    SearchMemorySchema.shape,
    async (args) => {
      const parsed = SearchMemorySchema.parse(args);
      const results = await engine.searchMemory(parsed.project_id, parsed.query, {
        types: parsed.types,
        limit: parsed.limit,
      });
      return textResult(results);
    },
  );

  server.tool(
    'get_project_context',
    'Assemble an AI-ready context packet for the project — the core Context Engine output',
    GetProjectContextSchema.shape,
    async (args) => {
      const parsed = GetProjectContextSchema.parse(args);
      const packet = await engine.getProjectContext({
        projectId: parsed.project_id,
        query: parsed.query,
        taskDescription: parsed.task_description,
        openFiles: parsed.open_files,
        branchName: parsed.branch_name,
        tokenBudget: parsed.token_budget,
      });
      return textResult(packet);
    },
  );

  server.tool(
    'get_task_context',
    'Get context optimized for a specific task',
    GetTaskContextSchema.shape,
    async (args) => {
      const parsed = GetTaskContextSchema.parse(args);
      const packet = await engine.getProjectContext({
        projectId: parsed.project_id,
        taskDescription: parsed.task_description,
        openFiles: parsed.open_files,
        tokenBudget: parsed.token_budget,
        layerFilter: [ContextLayer.Task, ContextLayer.Branch, ContextLayer.Project],
      });
      return textResult(packet);
    },
  );

  server.tool(
    'get_file_context',
    'Get context related to a specific file',
    GetFileContextSchema.shape,
    async (args) => {
      const parsed = GetFileContextSchema.parse(args);
      const packet = await engine.getProjectContext({
        projectId: parsed.project_id,
        openFiles: [parsed.file_path],
        query: parsed.file_path,
        tokenBudget: parsed.token_budget,
      });
      return textResult(packet);
    },
  );

  server.tool(
    'get_architecture',
    'Get architecture summary for the project',
    { project_id: GetProjectContextSchema.shape.project_id },
    async (args) => {
      const parsed = GetProjectContextSchema.parse(args);
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
    SummarizeProjectSchema.shape,
    async (args) => {
      const parsed = SummarizeProjectSchema.parse(args);
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
    FindDuplicatesSchema.shape,
    async (args) => {
      const parsed = FindDuplicatesSchema.parse(args);
      const duplicates = await engine.findDuplicates(parsed.project_id, parsed.memory_id);
      return textResult({ duplicates });
    },
  );

  server.tool(
    'extract_memories',
    'Extract structured memories from a conversation and save them to the project',
    ExtractMemoriesSchema.shape,
    async (args) => {
      const parsed = ExtractMemoriesSchema.parse(args);
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
    AskProjectSchema.shape,
    async (args) => {
      const parsed = AskProjectSchema.parse(args);
      const result = await engine.askProject(parsed.project_id, parsed.question, parsed.limit);
      return textResult(result);
    },
  );

  server.tool(
    'suggest_context',
    'Recommend which memories to load for a task, with a Groq narrative summary',
    SuggestContextSchema.shape,
    async (args) => {
      const parsed = SuggestContextSchema.parse(args);
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
    CondenseMemoriesSchema.shape,
    async (args) => {
      const parsed = CondenseMemoriesSchema.parse(args);
      const result = await engine.condenseMemories(parsed.project_id, parsed.memory_ids, {
        save: parsed.save,
      });
      return textResult(result);
    },
  );

  server.tool(
    'suggest_relationships',
    'Suggest knowledge graph links for a memory using Groq',
    SuggestRelationshipsSchema.shape,
    async (args) => {
      const parsed = SuggestRelationshipsSchema.parse(args);
      const result = await engine.suggestRelationships(parsed.project_id, parsed.memory_id);
      return textResult(result);
    },
  );

  server.tool(
    'extract_from_diff',
    'Extract learnings from a git diff (preview by default, pass save=true to store)',
    ExtractFromDiffSchema.shape,
    async (args) => {
      const parsed = ExtractFromDiffSchema.parse(args);
      if (parsed.save) {
        const extracted = await engine.extractFromDiff(parsed.project_id, parsed.diff);
        return textResult({ extracted });
      }
      const drafts = await engine.previewExtractFromDiff(parsed.diff);
      return textResult({ drafts });
    },
  );
}
