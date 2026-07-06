import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { extractBearerToken } from '@/lib/auth/api-key';
import { resolveAccessibleProjectId } from '@/lib/auth/resolve-project';
import { getNeuronEngine } from '@/lib/neuron-engine';
import { normalizeMcpClientHeader } from '@/lib/mcp-clients';
import { ProjectLinkType, getCheatsheet, getAgentInstructions, type CheatsheetSection } from '@neuron/shared';
import { mergeMemoryTags, readProjectOverride, readRepoFromRequest, resolveReadTags } from '@/lib/mcp-scope';

type KeyResolution = {
  projectId: string;
  userId: string;
};

async function resolveKey(rawKey: string | null, request?: Request): Promise<KeyResolution | null> {
  if (!rawKey?.startsWith('nrn_')) return null;

  const clientName = request
    ? normalizeMcpClientHeader(request.headers.get('x-neuron-client'))
    : null;

  const client = createServiceClient();
  const { data, error } = await client.rpc('verify_api_key' as never, {
    raw_key: rawKey,
    client_name: clientName,
  } as never);

  if (error || !data) return null;
  const row = (Array.isArray(data) ? data[0] : data) as {
    project_id: string;
    user_id?: string;
  } | undefined;
  if (!row?.project_id) return null;
  return { projectId: row.project_id, userId: row.user_id ?? '' };
}

async function resolveMcpProject(
  key: KeyResolution,
  request: Request,
  argsProjectId?: string,
): Promise<string> {
  const service = createServiceClient();
  const override = readProjectOverride(request) ?? argsProjectId;
  if (!key.userId) return key.projectId;
  return resolveAccessibleProjectId(service, key.userId, key.projectId, override);
}

function readScope(request: Request, argsTags?: string[]) {
  const repoTag = readRepoFromRequest(request);
  return resolveReadTags(argsTags, repoTag);
}

function workspaceQuery(
  projectId: string,
  args: Record<string, unknown>,
  scope: ReturnType<typeof readScope>,
) {
  return {
    projectId,
    query: args.query as string | undefined,
    taskDescription: args.task_description as string | undefined,
    openFiles: args.open_files as string[] | undefined,
    branchName: args.branch_name as string | undefined,
    tokenBudget: args.token_budget as number | undefined,
    tags: scope.overlapTags,
    requiredRepoTag: scope.requiredRepoTag,
    includeLinkedProjects: args.include_linked_projects !== false,
  };
}

/** GET — resolve project + workspace map from NEURON_API_KEY */
export async function GET(request: Request) {
  const token = extractBearerToken(request);
  const key = await resolveKey(token, request);
  if (!key) {
    return NextResponse.json({ error: 'Invalid NEURON_API_KEY' }, { status: 401 });
  }

  try {
    const projectId = await resolveMcpProject(key, request);
    const { engine } = getNeuronEngine(projectId);
    const [repos, links] = await Promise.all([
      engine.listRepos(projectId),
      engine.listProjectLinks(projectId),
    ]);
    const repoTag = readRepoFromRequest(request);
    return NextResponse.json({
      project_id: projectId,
      active_repo: repoTag ?? null,
      agentInstructions: getAgentInstructions(),
      cheatsheet: getCheatsheet('start'),
      repos: repos.map((r) => ({ name: r.name, slug: r.repoSlug, url: r.url })),
      linked_projects: links.map((l) => ({
        id: l.targetProject?.id ?? l.targetProjectId,
        name: l.targetProject?.name,
        slug: l.targetProject?.slug,
        link_type: l.linkType,
        label: l.label,
      })),
      requiredFirstTools: ['cheatsheet', 'get_workspace_context'],
      hint: 'Agents: call cheatsheet(section:"start") then get_workspace_context before other Neuron tools.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Project not accessible' },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    const key = await resolveKey(token, request);
    if (!key) {
      return NextResponse.json({ error: 'Invalid NEURON_API_KEY' }, { status: 401 });
    }

    const { tool, args } = await request.json();
    const projectId = await resolveMcpProject(key, request, args.project_id);
    const repoTag = readRepoFromRequest(request);
    const { engine } = getNeuronEngine(projectId);

    switch (tool) {
      case 'cheatsheet': {
        const section = (args.section ?? 'all') as CheatsheetSection;
        const sheet = getCheatsheet(section);
        return NextResponse.json({
          ...sheet,
          reminder: 'You read the cheatsheet — next call get_workspace_context before other Neuron tools.',
        });
      }
      case 'remember_fact':
      case 'remember_decision':
      case 'remember_pattern':
      case 'remember_bug':
      case 'remember_component':
      case 'remember_api':
      case 'remember_task':
      case 'remember_architecture':
      case 'remember_database':
      case 'remember_note':
      case 'remember_file':
      case 'remember_conversation': {
        const type = tool.replace('remember_', '');
        const memory = await engine.remember({
          projectId,
          type: type as never,
          title: args.title,
          content: args.content,
          confidence: args.confidence,
          importance: args.importance,
          tags: mergeMemoryTags(args.tags, repoTag),
          metadata: args.metadata,
        });
        return NextResponse.json({ success: true, memory });
      }
      case 'remember_relationship': {
        const memory = await engine.remember({
          projectId,
          type: 'relationship' as never,
          title: `${args.type}: ${args.source_memory_id} → ${args.target_memory_id}`,
          content: `Relationship of type ${args.type}`,
          relationships: [{ targetMemoryId: args.target_memory_id, type: args.type }],
        });
        return NextResponse.json({ success: true, memory });
      }
      case 'get_task_context': {
        const scope = readScope(request, args.tags);
        const packet = await engine.getProjectContext({
          projectId,
          taskDescription: args.task_description,
          openFiles: args.open_files,
          tokenBudget: args.token_budget,
          tags: scope.overlapTags,
          requiredRepoTag: scope.requiredRepoTag,
        });
        return NextResponse.json({ packet });
      }
      case 'get_file_context': {
        const scope = readScope(request, args.tags);
        const packet = await engine.getProjectContext({
          projectId,
          openFiles: [args.file_path],
          query: args.file_path,
          tokenBudget: args.token_budget,
          tags: scope.overlapTags,
          requiredRepoTag: scope.requiredRepoTag,
        });
        return NextResponse.json({ packet });
      }
      case 'get_architecture': {
        const scope = readScope(request, args.tags);
        const packet = await engine.getProjectContext({
          projectId,
          query: 'architecture system design structure',
          tokenBudget: 2000,
          tags: scope.overlapTags,
          requiredRepoTag: scope.requiredRepoTag,
        });
        return NextResponse.json({ architecture: packet.architecture });
      }
      case 'find_related': {
        const memories = await engine.findRelated(args.memory_id, args.depth);
        return NextResponse.json({ memories });
      }
      case 'search_memory': {
        const scope = readScope(request, args.tags);
        const results = await engine.searchMemory(projectId, args.query, {
          types: args.types,
          tags: scope.overlapTags,
          requiredRepoTag: scope.requiredRepoTag,
          includeLinkedProjects: args.include_linked_projects !== false,
          limit: args.limit,
        });
        return NextResponse.json(results);
      }
      case 'get_project_context': {
        const scope = readScope(request, args.tags);
        const workspace = await engine.getWorkspaceContext(workspaceQuery(projectId, args, scope));
        return NextResponse.json({
          ...workspace.primary,
          workspace: workspace.scope,
          linkedProjects: workspace.linked,
          hints: workspace.hints,
        });
      }
      case 'get_workspace_context': {
        const scope = readScope(request, args.tags);
        const workspace = await engine.getWorkspaceContext(workspaceQuery(projectId, args, scope));
        return NextResponse.json(workspace);
      }
      case 'list_repos': {
        const repos = await engine.listRepos(projectId);
        return NextResponse.json({
          repos,
          activeRepo: repoTag ?? null,
        });
      }
      case 'register_repo': {
        const repo = await engine.registerRepo(projectId, {
          name: args.name,
          repoSlug: args.repo_slug,
          url: args.url,
          defaultBranch: args.default_branch,
        });
        return NextResponse.json({ success: true, repo });
      }
      case 'delete_repo': {
        await engine.deleteRepo(args.repo_id);
        return NextResponse.json({ success: true });
      }
      case 'list_project_links': {
        const links = await engine.listProjectLinks(projectId);
        return NextResponse.json({ links });
      }
      case 'link_project': {
        let targetId = args.target_project_id as string | undefined;
        if (!targetId && args.target_project_slug) {
          const target = await engine.resolveProjectBySlug(args.target_project_slug as string);
          if (!target) {
            return NextResponse.json(
              { error: `Project not found: ${args.target_project_slug}` },
              { status: 404 },
            );
          }
          targetId = target.id;
        }
        if (!targetId) {
          return NextResponse.json(
            { error: 'target_project_id or target_project_slug required' },
            { status: 400 },
          );
        }
        const link = await engine.linkProject(
          projectId,
          targetId,
          (args.link_type as ProjectLinkType) ?? ProjectLinkType.DependsOn,
          args.label,
        );
        return NextResponse.json({ success: true, link });
      }
      case 'unlink_project': {
        await engine.unlinkProject(args.link_id);
        return NextResponse.json({ success: true });
      }
      case 'summarize_project': {
        const summary = await engine.summarizeProject(projectId);
        return NextResponse.json({ summary });
      }
      case 'find_duplicates': {
        const duplicates = await engine.findDuplicates(projectId, args.memory_id);
        return NextResponse.json({ duplicates });
      }
      case 'extract_memories': {
        const extracted = await engine.extractMemoriesFromConversation(projectId, args.conversation);
        return NextResponse.json({ extracted });
      }
      case 'preview_memories': {
        const drafts = await engine.previewExtractMemories(args.conversation);
        return NextResponse.json({ drafts });
      }
      case 'suggest_tags': {
        const tags = await engine.suggestTags(args.title, args.content);
        return NextResponse.json({ tags });
      }
      case 'ask_project': {
        const result = await engine.askProject(projectId, args.question, args.limit);
        return NextResponse.json(result);
      }
      case 'suggest_context': {
        const result = await engine.suggestContext(projectId, args.task_description, {
          openFiles: args.open_files,
          limit: args.limit,
        });
        return NextResponse.json(result);
      }
      case 'condense_memories': {
        const result = await engine.condenseMemories(projectId, args.memory_ids, {
          save: args.save,
        });
        return NextResponse.json(result);
      }
      case 'suggest_relationships': {
        const result = await engine.suggestRelationships(projectId, args.memory_id);
        return NextResponse.json(result);
      }
      case 'extract_from_diff': {
        if (args.save) {
          const extracted = await engine.extractFromDiff(projectId, args.diff);
          return NextResponse.json({ extracted });
        }
        const drafts = await engine.previewExtractFromDiff(args.diff);
        return NextResponse.json({ drafts });
      }
      case 'merge_memory': {
        const dupes = await engine.findDuplicates(projectId, args.source_memory_id);
        const likelyDupe = dupes.find((d) => d.memoryId === args.target_memory_id);
        const merged = await engine.merge(args.source_memory_id, args.target_memory_id, {
          force: args.force ?? !likelyDupe,
        });
        return NextResponse.json({ success: true, memory: merged, wasDuplicate: !!likelyDupe });
      }
      case 'forget_memory': {
        await engine.forget(args.memory_id, args.reason);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'MCP request failed' },
      { status: 500 },
    );
  }
}
