
export enum ProviderType {
  GEMINI = 'Google AI Studio',
  ANTHROPIC = 'Anthropic',
  OPENAI = 'OpenAI',
  OPENROUTER = 'OpenRouter',
  OLLAMA = 'Ollama (Local)',
  LMSTUDIO = 'LM Studio (Local)'
}

export interface Rule {
  id: string;
  content: string;
  enabled: boolean;
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: WorkspaceFile[];
  content?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface AgentInstance {
  id: string;
  name: string;
  status: ClineStatus;
  messages: Message[];
  toolCalls: ToolCall[];
  config: AgentConfig;
}

export interface AgentConfig {
  provider: ProviderType;
  model: string;
  baseUrl?: string;
  temperature: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  code?: string; // Simulated custom skill logic
}

export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  timestamp: number;
}

export type ClineStatus = 'online' | 'busy' | 'error' | 'offline';
