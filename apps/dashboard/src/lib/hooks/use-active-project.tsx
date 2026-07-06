'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'neuron_active_project_id';

export type ActiveProject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: string;
};

type ActiveProjectContextValue = {
  projects: ActiveProject[];
  activeProject: ActiveProject | null;
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
  setActiveProjectId: (id: string) => void;
  createProject: (name: string) => Promise<ActiveProject | null>;
  reload: () => Promise<void>;
};

const ActiveProjectContext = createContext<ActiveProjectContextValue | null>(null);

async function fetchProjects(): Promise<ActiveProject[]> {
  const res = await fetch('/api/projects');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Could not load projects');
  return data.projects ?? [];
}

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-projects'],
    queryFn: fetchProjects,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!projects.length) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const validStored = stored && projects.some((p) => p.id === stored);
    setActiveProjectIdState(validStored ? stored : projects[0].id);
  }, [projects]);

  const setActiveProjectId = useCallback(
    (id: string) => {
      localStorage.setItem(STORAGE_KEY, id);
      setActiveProjectIdState(id);
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const createProject = useCallback(
    async (name: string) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not create project');
      const project = data.project as ActiveProject;
      await refetch();
      setActiveProjectId(project.id);
      return project;
    },
    [refetch, setActiveProjectId],
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null,
    [projects, activeProjectId],
  );

  const value: ActiveProjectContextValue = {
    projects,
    activeProject,
    activeProjectId: activeProject?.id ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    setActiveProjectId,
    createProject,
    reload: async () => {
      await refetch();
    },
  };

  return (
    <ActiveProjectContext.Provider value={value}>{children}</ActiveProjectContext.Provider>
  );
}

export function useActiveProject() {
  const ctx = useContext(ActiveProjectContext);
  if (!ctx) {
    throw new Error('useActiveProject must be used within ActiveProjectProvider');
  }
  return ctx;
}
