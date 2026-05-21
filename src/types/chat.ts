export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'thought';
  content: string;
  timestamp: Date;
}

export type ToolStatus = 'running' | 'success' | 'error';

export interface ToolEvent {
  id: string;
  toolName: string;
  input: Record<string, any>;
  output?: string;
  status: ToolStatus;
  timestamp: Date;
  duration?: number; // milliseconds
  error?: string;
}

export interface ChatState {
  messages: Message[];
  toolEvents: ToolEvent[];
  streamingMessage: string | null;
  isLoading: boolean;
  isThinking: boolean; // True when Claude is processing but not streaming text yet
  thinkingStatus: string | null; // "Thinking...", "Processing...", etc.
  error: string | null;
}
