'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderGit2, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useActiveProject } from '@/lib/hooks/use-active-project';
import { PROJECT_LINK_LABELS, ProjectLinkType } from '@neuron/shared';
import { cn } from '@/lib/utils';

export function WorkspacePanel({ className }: { className?: string }) {
  const { activeProject, activeProjectId, projects } = useActiveProject();
  const queryClient = useQueryClient();
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoSlug, setNewRepoSlug] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ['workspace-repos', activeProjectId],
    enabled: !!activeProjectId,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${activeProjectId}/repos`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.repos as Array<{ id: string; name: string; repo_slug: string | null; url: string | null }>;
    },
  });

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['workspace-links', activeProjectId],
    enabled: !!activeProjectId,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${activeProjectId}/links`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.links as Array<{
        id: string;
        link_type: ProjectLinkType;
        label: string | null;
        projects: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[];
      }>;
    },
  });

  async function addRepo(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProjectId || !newRepoName.trim() || !newRepoSlug.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRepoName.trim(), repoSlug: newRepoSlug.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewRepoName('');
      setNewRepoSlug('');
      await queryClient.invalidateQueries({ queryKey: ['workspace-repos', activeProjectId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add repo');
    } finally {
      setBusy(false);
    }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProjectId || !linkTargetId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProjectId: linkTargetId, linkType: ProjectLinkType.DependsOn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLinkTargetId('');
      await queryClient.invalidateQueries({ queryKey: ['workspace-links', activeProjectId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not link project');
    } finally {
      setBusy(false);
    }
  }

  if (!activeProject) return null;

  const otherProjects = projects.filter((p) => p.id !== activeProjectId);

  return (
    <div className={cn('space-y-4', className)}>
      <section className="sm-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FolderGit2 className="size-4 text-[#4BA0FA]" />
          <h3 className="text-[15px] font-semibold text-[#fafafa]">Repositories</h3>
        </div>
        <p className="mb-4 text-[12px] text-[#737373]">
          Each repo maps to <code className="font-mono text-[11px]">NEURON_REPO</code> in MCP — host app and packages stay isolated inside{' '}
          <strong className="text-white/70">{activeProject.name}</strong>.
        </p>

        {reposLoading ? (
          <Loader2 className="size-4 animate-spin text-white/30" />
        ) : (
          <ul className="mb-4 space-y-2">
            {repos.map((repo) => (
              <li
                key={repo.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="text-white/90">{repo.name}</span>
                <code className="font-mono text-[11px] text-[#4BA0FA]">
                  NEURON_REPO={repo.repo_slug ?? repo.name}
                </code>
              </li>
            ))}
            {!repos.length && (
              <li className="text-[12px] text-white/35">No repos yet — add host and package repos below.</li>
            )}
          </ul>
        )}

        <form onSubmit={addRepo} className="flex flex-wrap gap-2">
          <input
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            placeholder="Scapia Host"
            className="min-w-[8rem] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <input
            value={newRepoSlug}
            onChange={(e) => setNewRepoSlug(e.target.value)}
            placeholder="scapia-nexus"
            className="min-w-[8rem] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Add repo
          </button>
        </form>
      </section>

      <section className="sm-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="size-4 text-emerald-400" />
          <h3 className="text-[15px] font-semibold text-[#fafafa]">Linked projects</h3>
        </div>
        <p className="mb-4 text-[12px] text-[#737373]">
          Connect host ↔ package across separate Neuron projects. MCP search and context pull highlights from linked projects automatically.
        </p>

        {linksLoading ? (
          <Loader2 className="size-4 animate-spin text-white/30" />
        ) : (
          <ul className="mb-4 space-y-2">
            {links.map((link) => {
              const target = Array.isArray(link.projects) ? link.projects[0] : link.projects;
              return (
                <li
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <span className="text-white/90">{target?.name ?? 'Project'}</span>
                  <span className="text-[11px] text-white/40">
                    {PROJECT_LINK_LABELS[link.link_type as ProjectLinkType]}
                  </span>
                </li>
              );
            })}
            {!links.length && (
              <li className="text-[12px] text-white/35">No links — connect a package project below.</li>
            )}
          </ul>
        )}

        {otherProjects.length > 0 && (
          <form onSubmit={addLink} className="flex flex-wrap gap-2">
            <select
              value={linkTargetId}
              onChange={(e) => setLinkTargetId(e.target.value)}
              className="min-w-[12rem] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="">Select project to link…</option>
              {otherProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy || !linkTargetId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Link2 className="size-4" />
              Link
            </button>
          </form>
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
