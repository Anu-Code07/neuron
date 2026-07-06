'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: ['knowledge-graph'],
    queryFn: async () => {
      const supabase = createClient();
      const [memRes, relRes] = await Promise.all([
        supabase
          .from('memories')
          .select('id, title, type, content, confidence, importance, tags, layer, updated_at')
          .eq('status', 'active')
          .order('importance', { ascending: false })
          .limit(80),
        supabase
          .from('relationships')
          .select('source_memory_id, target_memory_id, type')
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
  });
}

export function useMemoriesList() {
  return useQuery({
    queryKey: ['memories-all'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('id, title, content, type, confidence, importance, tags, layer, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as GraphMemory[];
    },
    staleTime: 20_000,
  });
}
