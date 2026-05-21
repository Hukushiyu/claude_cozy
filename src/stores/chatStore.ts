import { create } from 'zustand';
import type { Message, ToolEvent } from '../types/chat';
import type { ToolEventData } from '../types/ipc';
import { tauriAPI } from '../utils/tauri-api';
import { useProjectStore } from './projectStore';
import { useSettingsStore } from './settingsStore';

interface ChatStore {
  messages: Message[];
  toolEvents: ToolEvent[];
  streamingMessage: string | null;
  isLoading: boolean;
  isThinking: boolean;
  thinkingStatus: string | null;
  error: string | null;
  thinkingClearTimeout: NodeJS.Timeout | null;

  sendMessage: (content: string) => Promise<void>;
  appendChunk: (chunk: string) => void;
  finalizeStream: () => void;
  finalizeStreamTurn: () => void;
  discardStream: () => void;
  addToolEvent: (event: ToolEventData) => void;
  updateToolEvent: (id: string, updates: Partial<ToolEvent>) => void;
  setThinkingStatus: (status: string | null) => void;
  setError: (error: string) => void;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  toolEvents: [],
  streamingMessage: null,
  isLoading: false,
  isThinking: false,
  thinkingStatus: null,
  error: null,
  thinkingClearTimeout: null,

  sendMessage: async (content: string) => {
    // Handle slash commands
    if (content.trim().startsWith('/reset-permissions')) {
      // In Tauri, permissions are handled differently
      // Just show a message that permissions are always enabled
      set(state => ({
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: '/reset-permissions',
            timestamp: new Date()
          },
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '✓ Tool permissions are always enabled in this version. No reset needed.',
            timestamp: new Date()
          }
        ]
      }));
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Clear any existing timeout
    const existingTimeout = get().thinkingClearTimeout;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Pick a random fun thinking status to show immediately
    const thinkingStatuses = [
      'Pondering',
      'Flummoxing',
      'Cogitating',
      'Reasoning',
      'Analyzing',
      'Deliberating',
      'Contemplating',
      'Mulling',
      'Reflecting',
      'Considering',
      'Puzzling',
      'Ruminating'
    ];
    const randomStatus = thinkingStatuses[Math.floor(Math.random() * thinkingStatuses.length)];

    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      isThinking: true,
      thinkingStatus: randomStatus, // Show random fun status immediately
      streamingMessage: '',
      error: null,
      thinkingClearTimeout: null
    }));

    // Get required parameters from other stores
    const projectPath = useProjectStore.getState().projectPath;
    const model = useSettingsStore.getState().selectedModel;

    if (!projectPath) {
      set({
        error: 'No project selected. Please select a project first.',
        isLoading: false,
        isThinking: false,
        thinkingStatus: null,
        streamingMessage: null
      });
      return;
    }

    // Event listeners are now set up in ChatInterface component
    // Just send the message
    try {
      console.log('[chatStore] Sending message to Claude CLI');
      console.log('[chatStore] Content:', content);
      console.log('[chatStore] Project path:', projectPath);
      console.log('[chatStore] Model:', model);

      // Tauri requires explicit parameters
      await tauriAPI.sendMessage(content, projectPath, model, true); // skipPermissions = true

      console.log('[chatStore] sendMessage returned successfully');
    } catch (error) {
      console.error('[chatStore] sendMessage error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        isThinking: false,
        thinkingStatus: null,
        streamingMessage: null
      });
    }
  },

  appendChunk: (chunk: string) => {
    console.log('[chatStore] Received chunk:', chunk.substring(0, 50));

    const state = get();

    // Add the chunk to streaming message first
    set({
      streamingMessage: (state.streamingMessage || '') + chunk
    });

    // Only start the timeout once (on first chunk) and make it longer
    if (state.isThinking && !state.thinkingClearTimeout) {
      const timeout = setTimeout(() => {
        set({
          isThinking: false,
          thinkingStatus: null,
          thinkingClearTimeout: null
        });
      }, 1500); // 1.5 seconds - longer delay for better visibility

      set({ thinkingClearTimeout: timeout });
    }
  },

  discardStream: () => {
    set({ streamingMessage: '' });
  },

  finalizeStreamTurn: () => {
    const state = get();
    const streamingMessage = state.streamingMessage;

    if (!streamingMessage || streamingMessage.trim().length === 0) {
      set({ streamingMessage: '' });
      return;
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: streamingMessage.trim(),
      timestamp: new Date()
    };

    // Finalize this turn's bubble and reset streaming, but keep isLoading true
    set(state => ({
      messages: [...state.messages, assistantMessage],
      streamingMessage: '',
    }));
  },

  finalizeStream: () => {
    const state = get();
    const streamingMessage = state.streamingMessage;
    console.log('[chatStore] Finalizing stream, message length:', streamingMessage?.length || 0);

    // Clear any pending thinking timeout
    if (state.thinkingClearTimeout) {
      clearTimeout(state.thinkingClearTimeout);
    }

    if (!streamingMessage || streamingMessage.trim().length === 0) {
      console.warn('[chatStore] No streaming message to finalize!');
      set({
        isLoading: false,
        isThinking: false,
        thinkingStatus: null,
        streamingMessage: null,
        thinkingClearTimeout: null
      });
      return;
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: streamingMessage.trim(),
      timestamp: new Date()
    };

    set(state => ({
      messages: [...state.messages, assistantMessage],
      streamingMessage: null,
      isLoading: false,
      isThinking: false,
      thinkingStatus: null,
      thinkingClearTimeout: null
    }));

    // CLI automatically saves history in .jsonl files - no need to manually save

    // Event listeners are managed by ChatInterface component, not cleaned up here
  },

  addToolEvent: (eventData: ToolEventData) => {
    const toolEvent: ToolEvent = {
      ...eventData,
      timestamp: new Date(eventData.timestamp)
    };

    set(state => {
      const existingIndex = state.toolEvents.findIndex(e => e.id === toolEvent.id);

      if (existingIndex >= 0) {
        // Update existing tool event
        const updated = [...state.toolEvents];
        updated[existingIndex] = toolEvent;
        return { toolEvents: updated };
      } else {
        // Add new tool event
        return { toolEvents: [...state.toolEvents, toolEvent] };
      }
    });
  },

  updateToolEvent: (id: string, updates: Partial<ToolEvent>) => {
    set(state => ({
      toolEvents: state.toolEvents.map(event =>
        event.id === id ? { ...event, ...updates } : event
      )
    }));
  },

  setThinkingStatus: (status: string | null) => {
    // Always cancel any pending clear-timeout when status changes
    const existingTimeout = get().thinkingClearTimeout;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    set({
      isThinking: status !== null,
      thinkingStatus: status,
      thinkingClearTimeout: null
    });
  },

  setError: (error: string) => {
    set({
      error,
      isLoading: false,
      isThinking: false,
      thinkingStatus: null,
      streamingMessage: null
    });
  },

  loadHistory: async () => {
    const projectPath = useProjectStore.getState().projectPath;

    if (!projectPath) {
      console.log('[chatStore] No project selected, skipping history load');
      return;
    }

    try {
      console.log('[chatStore] Loading conversation history from CLI');
      const displayMessages = await tauriAPI.loadCurrentSession(projectPath);

      if (displayMessages && displayMessages.length > 0) {
        // Convert DisplayMessage[] to Message[]
        const messages = displayMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));

        set({
          messages,
          toolEvents: [], // CLI history doesn't include tool events separately
          error: null,
          // Reset loading states when loading history
          isLoading: false,
          isThinking: false,
          thinkingStatus: null,
          streamingMessage: null,
          thinkingClearTimeout: null
        });

        console.log(`[chatStore] Loaded ${messages.length} messages from CLI history`);
      } else {
        console.log('[chatStore] No history found in CLI');
        // Clear messages if no history exists
        set({
          messages: [],
          toolEvents: [],
          isLoading: false,
          isThinking: false,
          thinkingStatus: null,
          streamingMessage: null,
          thinkingClearTimeout: null
        });
      }
    } catch (error) {
      console.error('[chatStore] Failed to load history:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load history'
      });
    }
  },

  clearHistory: async () => {
    console.log('[chatStore] clearHistory called');
    const startTime = Date.now();

    const projectPath = useProjectStore.getState().projectPath;

    // Clear any pending timeout BEFORE resetting state
    const state = get();
    if (state.thinkingClearTimeout) {
      console.log('[chatStore] Clearing pending timeout');
      clearTimeout(state.thinkingClearTimeout);
    }

    try {
      // Kill Claude process first
      await tauriAPI.killClaudeProcess();

      // Call IPC to clear history file
      if (projectPath) {
        await tauriAPI.clearHistory(projectPath);
      }
      console.log(`[chatStore] IPC completed in ${Date.now() - startTime}ms`);

      // Reset EVERYTHING in one atomic update
      set({
        messages: [],
        toolEvents: [],
        error: null,
        isLoading: false,
        isThinking: false,
        thinkingStatus: null,
        streamingMessage: null,
        thinkingClearTimeout: null
      });
      console.log('[chatStore] State reset complete');
    } catch (error) {
      console.error('[chatStore] clearHistory failed:', error);
      set({
        messages: [],
        toolEvents: [],
        error: error instanceof Error ? error.message : 'Failed to clear history',
        isLoading: false,
        isThinking: false,
        thinkingStatus: null,
        streamingMessage: null,
        thinkingClearTimeout: null
      });
    }
  },

  clearError: () => set({ error: null })
}));
