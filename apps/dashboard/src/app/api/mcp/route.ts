import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { extractBearerToken } from '@/lib/auth/api-key';
import { getNeuronEngine } from '@/lib/neuron-engine';

async function resolveProjectFromKey(rawKey: string | null) {
  if (!rawKey?.startsWith('nrn_')) return null;

  const client = createServiceClient();
  const { data, error } = await client.rpc('verify_api_key' as never, {
    raw_key: rawKey,
  } as never);

  if (error || !data) return null;
  const row = (Array.isArray(data) ? data[0] : data) as { project_id: string } | undefined;
  return row?.project_id ?? null;
}

/** GET — resolve project from NEURON_API_KEY (for hosted MCP client bootstrap) */
export async function GET(request: Request) {
  const token = extractBearerToken(request);
  const projectId = await resolveProjectFromKey(token);
  if (!projectId) {
    return NextResponse.json({ error: 'Invalid NEURON_API_KEY' }, { status: 401 });
  }
  return NextResponse.json({ project_id: projectId });
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    const projectId = await resolveProjectFromKey(token);
    if (!projectId) {
      return NextResponse.json({ error: 'Invalid NEURON_API_KEY' }, { status: 401 });
    }

    const { tool, args } = await request.json();
    const { engine } = getNeuronEngine(projectId);

    switch (tool) {
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
          projectId: args.project_id ?? projectId,
          type: type as never,
          title: args.title,
          content: args.content,
          confidence: args.confidence,
          importance: args.importance,
          tags: args.tags,
          metadata: args.metadata,
        });
        return NextResponse.json({ success: true, memory });
      }
      case 'remember_relationship': {
        const memory = await engine.remember({
          projectId: args.project_id ?? projectId,
          type: 'relationship' as never,
          title: `${args.type}: ${args.source_memory_id} → ${args.target_memory_id}`,
          content: `Relationship of type ${args.type}`,
          relationships: [{ targetMemoryId: args.target_memory_id, type: args.type }],
        });
        return NextResponse.json({ success: true, memory });
      }
      case 'get_task_context': {
        const packet = await engine.getProjectContext({
          projectId: args.project_id ?? projectId,
          taskDescription: args.task_description,
          openFiles: args.open_files,
          tokenBudget: args.token_budget,
        });
        return NextResponse.json({ packet });
      }
      case 'get_file_context': {
        const packet = await engine.getProjectContext({
          projectId: args.project_id ?? projectId,
          openFiles: [args.file_path],
          query: args.file_path,
          tokenBudget: args.token_budget,
        });
        return NextResponse.json({ packet });
      }
      case 'get_architecture': {
        const packet = await engine.getProjectContext({
          projectId: args.project_id ?? projectId,
          query: 'architecture system design structure',
          tokenBudget: 2000,
        });
        return NextResponse.json({ architecture: packet.architecture });
      }
      case 'find_related': {
        const memories = await engine.findRelated(args.memory_id, args.depth);
        return NextResponse.json({ memories });
      }
      case 'search_memory': {
        const results = await engine.searchMemory(
          args.project_id ?? projectId,
          args.query,
          { types: args.types, limit: args.limit },
        );
        return NextResponse.json(results);
      }
      case 'get_project_context': {
        const packet = await engine.getProjectContext({
          projectId: args.project_id ?? projectId,
          query: args.query,
          taskDescription: args.task_description,
          openFiles: args.open_files,
          branchName: args.branch_name,
          tokenBudget: args.token_budget,
        });
        return NextResponse.json({ packet });
      }
      case 'summarize_project': {
        const summary = await engine.summarizeProject(args.project_id ?? projectId);
        return NextResponse.json({ summary });
      }
      case 'find_duplicates': {
        const duplicates = await engine.findDuplicates(args.project_id ?? projectId, args.memory_id);
        return NextResponse.json({ duplicates });
      }
      case 'extract_memories': {
        const extracted = await engine.extractMemoriesFromConversation(
          args.project_id ?? projectId,
          args.conversation,
        );
        return NextResponse.json({ extracted });
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
