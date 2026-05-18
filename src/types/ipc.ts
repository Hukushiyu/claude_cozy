export interface ToolEventData {
  id: string;
  toolName: string;
  input: Record<string, any>;
  output?: string;
  status: 'running' | 'success' | 'error';
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface ConversationHistory {
  projectPath: string;
  lastUpdated: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  toolEvents: ToolEventData[];
}

// CLI History types
export interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  id: string;
}

export interface SessionInfo {
  session_id: string;
  message_count: number;
  first_timestamp: string;
  last_timestamp: string;
}

export interface GitStatus {
  [filePath: string]: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
}

export interface ClaudeCliStatus {
  installed: boolean;
  authenticated: boolean;
  error?: string;
}

export interface ElectronAPI {
  sendMessage: (message: string) => Promise<void>;
  onMessageChunk: (callback: (chunk: string) => void) => void;
  onMessageComplete: (callback: () => void) => void;
  onChatError: (callback: (error: string) => void) => void;
  onPermissionRequest: (callback: (request: any) => void) => void;
  onToolEvent: (callback: (event: ToolEventData) => void) => void;
  onThinkingStatus: (callback: (status: string | null) => void) => void;
  respondToPermission: (approved: boolean) => Promise<boolean>;
  resetPermissions: () => Promise<boolean>;
  getPermissionStatus: () => Promise<boolean>;
  onPermissionReset: (callback: () => void) => void;
  loadFileTree: (path: string) => Promise<FileNode[]>;
  loadDirectory: (directoryPath: string, rootPath: string) => Promise<FileNode[]>;
  readFile: (filePath: string) => Promise<string>;
  readFileAsBase64: (filePath: string) => Promise<string>;
  getFileStats: (filePath: string) => Promise<{ size: number; extension: string }>;
  selectProject: () => Promise<string | null>;
  setApiKey: (key: string) => Promise<boolean>;
  hasApiKey: () => Promise<boolean>;
  useCliAuth: () => Promise<boolean>;
  checkClaudeCli: () => Promise<ClaudeCliStatus>;
  openTerminalForAuth: () => Promise<{ success: boolean; error?: string }>;
  setModel: (modelId: string) => Promise<boolean>;
  getModel: () => Promise<string>;
  saveHistory: (messages: any[], toolEvents: any[]) => Promise<boolean>;
  loadHistory: () => Promise<ConversationHistory | null>;
  clearHistory: () => Promise<boolean>;
  archiveHistory: () => Promise<string>;
  getGitStatus: (projectPath: string) => Promise<GitStatus>;
  createFile: (filePath: string) => Promise<boolean>;
  createFolder: (folderPath: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  focusWindow: () => Promise<boolean>;
  removeAllListeners: (channel: string) => void;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
