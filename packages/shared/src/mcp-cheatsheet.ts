export type CheatsheetSection =
  | 'all'
  | 'start'
  | 'remember'
  | 'search'
  | 'context'
  | 'workspace'
  | 'graph'
  | 'ai'
  | 'maintain';

export interface CheatsheetTool {
  name: string;
  when: string;
  returns: string;
  tips?: string;
}

export interface CheatsheetEntry {
  section: CheatsheetSection;
  title: string;
  description: string;
  tools: CheatsheetTool[];
}

const WORKFLOW = {
  sessionStart: [
    '1. cheatsheet — read this guide (section: start)',
    '2. get_workspace_context — map repos, links, and scoped memories',
    '3. search_memory — find anything relevant to the current task',
  ],
  beforeCoding: [
    'get_task_context or get_file_context — load focused context',
    'suggest_context — let Neuron recommend which memories matter',
  ],
  afterLearning: [
    'remember_decision / remember_bug / remember_fact — persist what you learned',
    'remember_relationship — link host code to package/SDK memories',
  ],
  monorepo: [
    'NEURON_REPO env scopes memories per repo (host vs package)',
    'register_repo — register repos under one Neuron project',
    'link_project — connect separate projects (host depends_on package)',
  ],
};

const ENTRIES: CheatsheetEntry[] = [
  {
    section: 'start',
    title: 'Getting started',
    description: 'Call these first in a new session or when unsure what Neuron knows.',
    tools: [
      {
        name: 'cheatsheet',
        when: 'You are unsure which Neuron tool to call, or starting a new session',
        returns: 'This guide — tools grouped by intent with when-to-use hints',
        tips: 'Pass section: "workspace" | "remember" | "search" | "context" | "graph" | "ai" | "maintain"',
      },
      {
        name: 'get_workspace_context',
        when: 'Best first call — understand repos, project links, and repo-scoped context',
        returns: 'scope (repos + links), primary context packet, linked project highlights, hints',
        tips: 'Prefer this over get_project_context when NEURON_REPO or linked projects are in play',
      },
      {
        name: 'list_repos',
        when: 'You need valid NEURON_REPO slugs for this project',
        returns: 'Registered repositories and active repo from env',
      },
      {
        name: 'list_project_links',
        when: 'Host app depends on a separate package project',
        returns: 'Outgoing project links (depends_on, contains, etc.)',
      },
    ],
  },
  {
    section: 'remember',
    title: 'Store knowledge (write)',
    description: 'Persist durable facts so future sessions remember. Auto-tagged with NEURON_REPO when set.',
    tools: [
      {
        name: 'remember_fact',
        when: 'Stable truth about the codebase, config, or behavior',
        returns: 'Saved memory with id',
      },
      {
        name: 'remember_decision',
        when: 'Architectural or product choice with rationale (chosen, alternatives, reason)',
        returns: 'Decision memory',
      },
      {
        name: 'remember_pattern',
        when: 'Coding convention, style rule, or repeated pattern',
        returns: 'Pattern memory',
      },
      {
        name: 'remember_bug',
        when: 'Bug found — include severity, status, reproduction steps',
        returns: 'Bug memory',
        tips: 'Use when user reports SDK/UI bugs you want to recall later',
      },
      {
        name: 'remember_component',
        when: 'Module, class, or service — optional file_path, language, framework',
        returns: 'Component memory',
      },
      {
        name: 'remember_api',
        when: 'HTTP endpoint — method, path, auth_required',
        returns: 'API memory',
      },
      {
        name: 'remember_task',
        when: 'Active task with goals and acceptance criteria',
        returns: 'Task memory',
      },
      {
        name: 'remember_architecture',
        when: 'System design, layers, how pieces fit together',
        returns: 'Architecture memory',
      },
      {
        name: 'remember_database',
        when: 'Schema, tables, queries, migrations',
        returns: 'Database memory',
      },
      {
        name: 'remember_file',
        when: 'Knowledge specific to one file',
        returns: 'File memory',
      },
      {
        name: 'remember_note',
        when: 'General note that does not fit other types',
        returns: 'Note memory',
      },
      {
        name: 'remember_conversation',
        when: 'Distill chat into a stored memory (raw chat not stored)',
        returns: 'Memory from conversation summary',
      },
    ],
  },
  {
    section: 'search',
    title: 'Find knowledge (read)',
    description: 'Hybrid vector + keyword + graph search. Includes linked projects by default.',
    tools: [
      {
        name: 'search_memory',
        when: 'Look up anything — bugs, decisions, past work, keywords',
        returns: 'Ranked memories; linkedProjectsSearched when cross-project',
        tips: 'Set include_linked_projects: false to scope to current project only',
      },
      {
        name: 'ask_project',
        when: 'Natural-language question answered from memories (Groq + search)',
        returns: 'answer + source memories',
      },
      {
        name: 'find_related',
        when: 'You have a memory id and want graph neighbors',
        returns: 'Related memories via knowledge graph',
      },
      {
        name: 'find_duplicates',
        when: 'Check if a memory duplicates existing knowledge',
        returns: 'Duplicate candidates with similarity scores',
      },
    ],
  },
  {
    section: 'context',
    title: 'Assemble context packets',
    description: 'Compressed, AI-ready bundles for the current work.',
    tools: [
      {
        name: 'get_project_context',
        when: 'Need decisions, bugs, facts, APIs in one packet for the model',
        returns: 'Context packet + workspace + linkedProjects + hints',
      },
      {
        name: 'get_task_context',
        when: 'Focused on a specific task description',
        returns: 'Task-layer context packet',
      },
      {
        name: 'get_file_context',
        when: 'Working in one file — pass file_path',
        returns: 'File-scoped context packet',
      },
      {
        name: 'get_architecture',
        when: 'Quick architecture summary only',
        returns: 'Architecture summary object',
      },
      {
        name: 'summarize_project',
        when: 'Compact text overview of all project knowledge',
        returns: 'Summary string',
      },
      {
        name: 'suggest_context',
        when: 'Unsure which memories to load — get Groq narrative + recommendations',
        returns: 'narrative + recommended memories',
      },
    ],
  },
  {
    section: 'workspace',
    title: 'Repos & project links',
    description: 'Monorepo host+package isolation and cross-project dependencies.',
    tools: [
      {
        name: 'register_repo',
        when: 'Add host or package repo to this project (maps to NEURON_REPO)',
        returns: 'Registered repo with repo_slug',
        tips: 'Example: name="Scapia Host", repo_slug="scapia-nexus"',
      },
      {
        name: 'delete_repo',
        when: 'Remove a registered repo',
        returns: 'success',
      },
      {
        name: 'link_project',
        when: 'Host project depends on a separate Neuron package project',
        returns: 'Project link (depends_on | contains | consumes | workspace)',
        tips: 'Use target_project_slug when you know the slug',
      },
      {
        name: 'unlink_project',
        when: 'Remove a project link by link_id',
        returns: 'success',
      },
    ],
  },
  {
    section: 'graph',
    title: 'Knowledge graph',
    description: 'Connect memories — e.g. host checkout depends_on SDK bug.',
    tools: [
      {
        name: 'remember_relationship',
        when: 'Link two memories: uses, depends_on, implements, fixes, contains, etc.',
        returns: 'success',
        tips: 'Both memories must be in the same project; use tags/repos to separate writes',
      },
      {
        name: 'suggest_relationships',
        when: 'Groq suggests graph edges for a memory',
        returns: 'Suggested source/target/type edges',
      },
    ],
  },
  {
    section: 'ai',
    title: 'AI extraction (Groq)',
    description: 'Requires GROQ_API_KEY on Neuron backend.',
    tools: [
      {
        name: 'extract_memories',
        when: 'Paste a long conversation and save extracted memories',
        returns: 'Saved memories array',
      },
      {
        name: 'preview_memories',
        when: 'Preview extraction without saving',
        returns: 'Draft memories',
      },
      {
        name: 'extract_from_diff',
        when: 'Learn from a git diff — pass save=true to store',
        returns: 'Drafts or saved memories',
      },
      {
        name: 'condense_memories',
        when: 'Merge 2–5 overlapping memories — save=true to apply',
        returns: 'Merged draft or saved memory',
      },
      {
        name: 'suggest_tags',
        when: 'Suggest tags before remember_*',
        returns: 'Tag array',
      },
    ],
  },
  {
    section: 'maintain',
    title: 'Cleanup & merge',
    description: 'Forget noise, merge duplicates.',
    tools: [
      {
        name: 'forget_memory',
        when: 'Memory is wrong, stale, or from wrong repo/project',
        returns: 'success',
      },
      {
        name: 'merge_memory',
        when: 'Combine two duplicate memories',
        returns: 'Merged memory',
      },
    ],
  },
];

/** Plain-language instructions injected into prompts, Cursor rules, and API bootstrap */
export function getAgentInstructions(): string {
  return `You are connected to Neuron — persistent project memory via MCP.

## Required session start (do this first)
1. Call tool \`cheatsheet\` with { "section": "start" }
2. Call tool \`get_workspace_context\` (optionally pass query or task_description)

## When to use which tool
| Your goal | Call this |
|-----------|-----------|
| Unsure what Neuron can do | cheatsheet |
| Map repos, links, loaded context | get_workspace_context |
| Find past bugs, decisions, facts | search_memory or ask_project |
| About to implement a task | get_task_context |
| Working in one file | get_file_context |
| Found a bug | remember_bug |
| Made an architecture decision | remember_decision |
| Learned a stable fact | remember_fact |
| Host code depends on package/SDK | remember_relationship (type: depends_on) |
| Wrong or unrelated memory | forget_memory |

## Monorepo (host + package in one project)
- NEURON_REPO env scopes memories to this repo (auto-tagged repo:<slug>)
- register_repo — register host and package repos
- Same API key, different NEURON_REPO per Cursor workspace

## Separate projects (host ↔ package)
- link_project (type: depends_on) — search_memory includes linked projects by default

## Rules
- Prefer Neuron memories over guessing about past work
- Always search before claiming "we never discussed X"
- Store durable learnings before ending a task`;
}

export function getCheatsheet(section: CheatsheetSection = 'all') {
  const filtered =
    section === 'all' ? ENTRIES : ENTRIES.filter((e) => e.section === section);

  return {
    version: '0.1.10',
    /** Read this first — optimized for Cursor / Claude agents */
    forAgents: getAgentInstructions(),
    requiredFirstSteps: [
      'cheatsheet(section: "start")',
      'get_workspace_context',
    ],
    tagline: 'Neuron — persistent memory for Cursor, Claude, and MCP clients',
    env: {
      NEURON_API_KEY: 'Required — authenticates MCP to your Neuron project',
      NEURON_API_URL: 'Hosted API (default: neuron-azure.vercel.app)',
      NEURON_REPO: 'Scopes read/write to one repo in a monorepo (auto-tagged as repo:<slug>)',
      NEURON_PROJECT_ID: 'Optional — override which project the API key targets',
      NEURON_MCP_CLIENT: 'Set automatically: cursor | claude',
    },
    workflow: WORKFLOW,
    decisionTree: [
      { if: 'New session or confused', then: 'cheatsheet → get_workspace_context' },
      { if: 'Need to find something', then: 'search_memory or ask_project' },
      { if: 'About to implement a task', then: 'get_task_context or suggest_context' },
      { if: 'Editing one file', then: 'get_file_context' },
      { if: 'Learned something important', then: 'remember_decision | remember_bug | remember_fact' },
      { if: 'Host code uses a package', then: 'remember_relationship type depends_on' },
      { if: 'Monorepo host + package', then: 'register_repo + NEURON_REPO per Cursor workspace' },
      { if: 'Separate Neuron projects', then: 'link_project type depends_on' },
      { if: 'Wrong/stray memory', then: 'forget_memory' },
    ],
    sections: filtered,
    toolCount: ENTRIES.reduce((n, e) => n + e.tools.length, 0),
  };
}
