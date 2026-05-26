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

// Types for grouped tool display
export interface ToolEventGroup {
  type: 'tool-group';
  tools: ToolEvent[];
  id: string;
}

export interface ConsolidatedTool {
  toolName: string;
  instances: ToolEvent[];
  count: number;
  // Overall status: 'running' if any running, 'error' if any errors, otherwise 'success'
  status: ToolStatus;
}

export type CombinedChatItem =
  | { type: 'message'; data: Message; timestamp: Date }
  | { type: 'tool'; data: ToolEvent; timestamp: Date };

export type GroupedChatItem =
  | { type: 'message'; data: Message; timestamp: Date }
  | { type: 'tool-group'; data: ConsolidatedTool[]; timestamp: Date; id: string };

// Types for autocomplete suggestions
export interface CommandSuggestion {
  type: 'command';
  name: string;
  description: string;
  icon: string;
}

export interface FileSuggestion {
  type: 'file';
  name: string;
  relativePath: string;
  absolutePath: string;
  icon: string;
}

export type Suggestion = CommandSuggestion | FileSuggestion;
