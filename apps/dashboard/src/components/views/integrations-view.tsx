'use client';

import { Code2, Globe, GitBranch, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';

const integrations = [
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Connect Neuron MCP to Cursor for in-IDE context',
    icon: Terminal,
    status: 'available',
  },
  {
    id: 'claude',
    name: 'Claude Desktop',
    description: 'Use Neuron as memory layer in Claude',
    icon: Code2,
    status: 'available',
  },
  {
    id: 'vscode',
    name: 'VS Code',
    description: 'MCP-compatible VS Code extensions',
    icon: Code2,
    status: 'coming',
  },
  {
    id: 'chrome',
    name: 'Browser Extension',
    description: 'Capture context from the web',
    icon: Globe,
    status: 'coming',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync PRs, commits, and repo context',
    icon: GitBranch,
    status: 'available',
  },
];

export function IntegrationsView() {
  const { setViewMode } = useViewMode();

  return (
    <div className="custom-scrollbar mx-auto max-w-4xl flex-1 overflow-y-auto p-4 md:p-6">
      <h2 className="text-xl font-semibold text-[#fafafa]">Integrations</h2>
      <p className="mt-1 text-[13px] text-[#737373]">Connect AI tools to your Neuron context engine</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {integrations.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => item.id === 'cursor' && setViewMode('mcp')}
            className="sm-tile flex items-start gap-4 p-4 text-left"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0F1217] text-[#4BA0FA]">
              <item.icon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-[#fafafa]">{item.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    item.status === 'available'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-[#0F1217] text-[#737373]'
                  }`}
                >
                  {item.status === 'available' ? 'Available' : 'Soon'}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#737373]">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
