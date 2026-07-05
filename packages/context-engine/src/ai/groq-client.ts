import type { ChatMessage, LlmProvider } from './llm-provider.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export function createGroqClient(apiKey?: string): LlmProvider | undefined {
  const key = apiKey ?? process.env.GROQ_API_KEY;
  if (!key) return undefined;

  return {
    model: DEFAULT_MODEL,
    async chat(messages, options) {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.3,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Groq API error (${res.status}): ${body}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Groq API returned empty response');
      return content;
    },
  };
}
