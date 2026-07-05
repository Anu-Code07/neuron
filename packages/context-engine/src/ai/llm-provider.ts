export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmProvider {
  chat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<string>;
  readonly model: string;
}
