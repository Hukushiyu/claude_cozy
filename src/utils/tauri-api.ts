import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { FileNode, GitStatus, ClaudeCliStatus, ToolEventData, DisplayMessage, SessionInfo } from '../types/ipc';

interface StreamEvent {
  eventType: string;
  content?: string;
  toolName?: string;
  thinkingStatus?: string;
}

export const tauriAPI = {
  // Project
  selectProject: async (): Promise<string | null> => {
    return await invoke<string | null>('select_project');
  },

  // Files
  readFile: async (filePath: string): Promise<string> => {
    return await invoke<string>('read_file', { filePath });
  },

  writeFile: async (filePath: string, content: string): Promise<void> => {
    await invoke('write_file', { filePath, content });
  },

  loadFileTree: async (path: string): Promise<FileNode[]> => {
    const nodes = await invoke<any[]>('load_file_tree', { path });
    return nodes.map(node => ({
      name: node.name,
      path: node.path,
      type: node.is_directory ? 'directory' : 'file',
      children: node.children
    }));
  },

  loadDirectory: async (directoryPath: string, rootPath: string): Promise<FileNode[]> => {
    const fullPath = `${rootPath}/${directoryPath}`;
    return await tauriAPI.loadFileTree(fullPath);
  },

  createFile: async (filePath: string): Promise<boolean> => {
    try {
      await invoke('create_file', { filePath });
      return true;
    } catch {
      return false;
    }
  },

  createFolder: async (folderPath: string): Promise<boolean> => {
    try {
      await invoke('create_folder', { folderPath });
      return true;
    } catch {
      return false;
    }
  },

  renameFile: async (oldPath: string, newPath: string): Promise<boolean> => {
    try {
      await invoke('rename_file', { oldPath, newPath });
      return true;
    } catch {
      return false;
    }
  },

  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      await invoke('delete_file', { filePath });
      return true;
    } catch {
      return false;
    }
  },

  // Chat
  sendMessage: async (message: string, projectPath: string, model: string, skipPermissions: boolean): Promise<void> => {
    await invoke('send_message', { message, projectPath, model, skipPermissions });
  },

  killClaudeProcess: async (): Promise<void> => {
    await invoke('kill_claude_process');
  },

  // History (CLI-based)
  listSessions: async (projectPath: string): Promise<SessionInfo[]> => {
    return await invoke<SessionInfo[]>('list_sessions', { projectPath });
  },

  loadSession: async (projectPath: string, sessionId: string): Promise<DisplayMessage[]> => {
    return await invoke<DisplayMessage[]>('load_session', { projectPath, sessionId });
  },

  loadCurrentSession: async (projectPath: string): Promise<DisplayMessage[]> => {
    return await invoke<DisplayMessage[]>('load_current_session', { projectPath });
  },

  clearHistory: async (projectPath: string): Promise<string> => {
    return await invoke<string>('clear_history', { projectPath });
  },

  archiveHistory: async (projectPath: string, archiveName: string): Promise<string> => {
    return await invoke<string>('archive_history', { projectPath, archiveName });
  },

  // Git
  getGitStatus: async (projectPath: string): Promise<GitStatus> => {
    const status = await invoke<Record<string, string>>('get_git_status', { projectPath });
    const mapped: GitStatus = {};

    for (const [path, code] of Object.entries(status)) {
      const statusMap: Record<string, GitStatus[string]> = {
        'M': 'modified',
        'A': 'added',
        'D': 'deleted',
        'U': 'untracked',
        'R': 'renamed'
      };
      mapped[path] = statusMap[code] || 'modified';
    }

    return mapped;
  },

  // CLI
  checkClaudeCli: async (): Promise<ClaudeCliStatus> => {
    return await invoke<ClaudeCliStatus>('check_claude_status');
  },

  openTerminalForAuth: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await invoke('open_terminal_for_auth');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // Event listeners
  onMessageChunk: async (callback: (chunk: string) => void): Promise<UnlistenFn> => {
    return await listen<StreamEvent>('chat:chunk', (event) => {
      if (event.payload.content) {
        callback(event.payload.content);
      }
    });
  },

  onMessageComplete: async (callback: () => void): Promise<UnlistenFn> => {
    return await listen<StreamEvent>('chat:result', () => {
      callback();
    });
  },

  onChatError: async (callback: (error: string) => void): Promise<UnlistenFn> => {
    return await listen<string>('chat:error', (event) => {
      callback(event.payload);
    });
  },

  onThinkingStatus: async (callback: (status: string | null) => void): Promise<UnlistenFn> => {
    return await listen<StreamEvent>('chat:thinking', (event) => {
      callback(event.payload.thinkingStatus || null);
    });
  },

  onToolEvent: async (callback: (event: ToolEventData) => void): Promise<UnlistenFn> => {
    return await listen<StreamEvent>('chat:tool', (event) => {
      if (event.payload.toolName) {
        callback({
          id: Date.now().toString(),
          toolName: event.payload.toolName,
          input: {},
          status: 'running',
          timestamp: new Date().toISOString()
        });
      }
    });
  },

  // Permission management
  getPermissionStatus: async (): Promise<boolean> => {
    return await invoke<boolean>('get_permission_status');
  },

  approvePermissions: async (temporary: boolean = false): Promise<void> => {
    await invoke('approve_permissions', { temporary });
  },

  resetPermissions: async (): Promise<void> => {
    await invoke('reset_permissions');
  },

  onPermissionRequest: async (callback: () => void): Promise<UnlistenFn> => {
    return await listen('permission:request', () => {
      callback();
    });
  },

  onPermissionReset: async (callback: () => void): Promise<UnlistenFn> => {
    return await listen('permission:reset', () => {
      callback();
    });
  },

  // Base64 file reading for images
  readFileAsBase64: async (filePath: string): Promise<string> => {
    return await invoke<string>('read_file_base64', { filePath });
  },

  getFileStats: async (_filePath: string): Promise<{ size: number; extension: string }> => {
    throw new Error('Not implemented in Tauri version');
  },

  setApiKey: async (_key: string): Promise<boolean> => {
    return false; // Not needed with CLI
  },

  hasApiKey: async (): Promise<boolean> => {
    return false; // Not needed with CLI
  },

  useCliAuth: async (): Promise<boolean> => {
    return true; // Always use CLI auth in Tauri version
  },

  setModel: async (_modelId: string): Promise<boolean> => {
    return true; // Handled in sendMessage
  },

  getModel: async (): Promise<string> => {
    return 'claude-sonnet-4-6'; // Default
  },

  focusWindow: async (): Promise<boolean> => {
    return true;
  },

  removeAllListeners: (_channel: string) => {
    // Handled by unlisten functions
  }
};

// Make it available globally for compatibility
if (typeof window !== 'undefined') {
  (window as any).tauriAPI = tauriAPI;
}
