'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useActiveProject } from '@/lib/hooks/use-active-project';

export interface GraphMemory {
  id: string;
  title: string;
  type: string;
  content: string;
  confidence: number;
  importance: number;
  tags: string[];
  layer: string;
  updated_at: string;
}

export interface GraphRelationship {
  source_memory_id: string;
  target_memory_id: string;
  type: string;
}

export function useKnowledgeGraph() {
  const { activeProjectId } = useActiveProject();

  return useQuery({
    queryKey: ['knowledge-graph', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return { memories: [], relationships: [] };

      const supabase = createClient();
      const [memRes, relRes] = await Promise.all([
        supabase
          .from('memories')
          .select('id, title, type, content, confidence, importance, tags, layer, updated_at')
          .eq('project_id', activeProjectId)
          .eq('status', 'active')
          .order('importance', { ascending: false })
          .limit(80),
        supabase
          .from('relationships')
          .select('source_memory_id, target_memory_id, type')
          .eq('project_id', activeProjectId)
          .limit(200),
      ]);

      if (memRes.error) throw memRes.error;
      if (relRes.error) throw relRes.error;

      const memories = (memRes.data ?? []) as GraphMemory[];
      const memoryIds = new Set(memories.map((m) => m.id));
      const relationships = ((relRes.data ?? []) as GraphRelationship[]).filter(
        (r) => memoryIds.has(r.source_memory_id) && memoryIds.has(r.target_memory_id),
      );

      return { memories, relationships };
    },
    staleTime: 20_000,
    enabled: !!activeProjectId,
  });
}

export function useMemoriesList() {
  const { activeProjectId } = useActiveProject();

  return useQuery({
    queryKey: ['memories-all', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('id, title, content, type, confidence, importance, tags, layer, updated_at')
        .eq('project_id', activeProjectId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as GraphMemory[];
    },
    staleTime: 20_000,
    enabled: !!activeProjectId,
  });
}
