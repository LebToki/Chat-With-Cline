
export enum ProviderType {
  GEMINI = 'Gemini',
  ANTHROPIC = 'Anthropic',
  OPENAI = 'OpenAI',
  OPENROUTER = 'OpenRouter'
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
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  timestamp: number;
}

export type ClineStatus = 'online' | 'busy' | 'error' | 'offline';
