'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, FolderPlus, Loader2 } from 'lucide-react';
import { useActiveProject } from '@/lib/hooks/use-active-project';
import { cn } from '@/lib/utils';

export function ProjectSwitcher({ className }: { className?: string }) {
  const {
    projects,
    activeProject,
    loading,
    setActiveProjectId,
    createProject,
  } = useActiveProject();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createProject(newName.trim());
      setNewName('');
      setCreating(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[14rem] items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-left transition-colors hover:bg-white/10"
      >
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/90 sm:text-sm">
          {loading ? 'Loading…' : (activeProject?.name ?? 'Select project')}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-white/40" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close project menu"
            onClick={() => {
              setOpen(false);
              setCreating(false);
            }}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/10 bg-[#12161C] p-1.5 shadow-2xl">
            <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
              Projects
            </p>
            {projects.map((project) => {
              const active = project.id === activeProject?.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5',
                    active && 'bg-white/5',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-white/90">{project.name}</span>
                  {active && <Check className="size-4 shrink-0 text-emerald-400" />}
                </button>
              );
            })}

            <div className="my-1 border-t border-white/10" />

            {creating ? (
              <form onSubmit={handleCreate} className="space-y-2 p-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="SubSavr, scapia-nexus…"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || !newName.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/15 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : 'Create project'}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                <FolderPlus className="size-4" />
                New project
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
