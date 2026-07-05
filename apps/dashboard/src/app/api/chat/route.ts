import { NextResponse } from 'next/server';
import { createGroqClient } from '@neuron/context-engine';
import { getNeuronEngine } from '@/lib/neuron-engine';

export async function POST(request: Request) {
  try {
    const { message, projectId } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const llm = createGroqClient(process.env.GROQ_API_KEY);
    if (!llm) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured on server' }, { status: 503 });
    }

    const { engine, projectId: resolvedProject } = getNeuronEngine(projectId);
    const packet = await engine.getProjectContext({
      projectId: resolvedProject,
      query: message,
      tokenBudget: 4000,
    });

    const contextBlock = packet.architecture?.summary
      ?? JSON.stringify(packet, null, 2).slice(0, 6000);

    const answer = await llm.chat(
      [
        {
          role: 'system',
          content:
            'You are Neuron, a project context assistant. Answer using only the provided project context. Be concise and helpful for developers.',
        },
        {
          role: 'user',
          content: `Project context:\n${contextBlock}\n\nQuestion: ${message}`,
        },
      ],
      { maxTokens: 1024, temperature: 0.3 },
    );

    return NextResponse.json({ answer, packet });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 },
    );
  }
}
