import { create } from 'zustand';
import type { Message, ToolEvent } from '../types/chat';
import type { ToolEventData } from '../types/ipc';
import { tauriAPI } from '../utils/tauri-api';
import { useTabStore } from './tabStore';

// Per-tab chat state
interface TabChatState {
  messages: Message[];
  toolEvents: ToolEvent[];
  streamingMessage: string | null;
  isLoading: boolean;
  isThinking: boolean;
  thinkingStatus: string | null;
  error: string | null;
  thinkingClearTimeout: NodeJS.Timeout | null;
  isStopped: boolean;
}

interface ChatStore {
  // Map of tabId -> TabChatState
  tabStates: Record<string, TabChatState>;

  // Methods
  sendMessage: (content: string) => Promise<void>;
  appendChunk: (chunk: string) => void;
  appendThought: (text: string) => void;
  finalizeStream: () => void;
  finalizeStreamTurn: () => void;
  discardStream: () => void;
  addToolEvent: (event: ToolEventData) => void;
  updateToolEvent: (id: string, updates: Partial<ToolEvent>) => void;
  setThinkingStatus: (status: string | null) => void;
  setError: (error: string) => void;
  loadHistory: () => Promise<void>;
  loadSessionById: (sessionId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  clearError: () => void;
  stopClaude: () => Promise<void>;

  // Tab management
  initTabState: (tabId: string) => void;
  removeTabState: (tabId: string) => void;
  getActiveTabState: () => TabChatState;
}

// Create default empty state for a tab
const createEmptyTabState = (): TabChatState => ({
  messages: [],
  toolEvents: [],
  streamingMessage: null,
  isLoading: false,
  isThinking: false,
  thinkingStatus: null,
  error: null,
  thinkingClearTimeout: null,
  isStopped: false
});

// Helper to get active tab state
const getActiveTabState = (tabStates: Record<string, TabChatState>): TabChatState => {
  const activeTabId = useTabStore.getState().activeTabId;
  if (!activeTabId || !tabStates[activeTabId]) {
    return createEmptyTabState();
  }
  return tabStates[activeTabId];
};

export const useChatStore = create<ChatStore>((set, get) => ({
  tabStates: {},

  // Get active tab state - components should use this with selectors
  getActiveTabState: () => {
    return getActiveTabState(get().tabStates);
  },

  // Initialize state for a new tab
  initTabState: (tabId: string) => {
    console.log('[chatStore] Initializing state for tab:', tabId);
    set(state => ({
      tabStates: {
        ...state.tabStates,
        [tabId]: createEmptyTabState()
      }
    }));
  },

  // Remove state when tab is closed
  removeTabState: (tabId: string) => {
    console.log('[chatStore] Removing state for tab:', tabId);
    set(state => {
      const { [tabId]: removed, ...remaining } = state.tabStates;
      // Clear any pending timeout
      if (removed?.thinkingClearTimeout) {
        clearTimeout(removed.thinkingClearTimeout);
      }
      return { tabStates: remaining };
    });
  },

  sendMessage: async (content: string) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId) {
      console.error('[chatStore] No active tab');
      return;
    }

    // Ensure tab state exists
    if (!get().tabStates[activeTabId]) {
      get().initTabState(activeTabId);
    }

    // Handle slash commands
    if (content.trim().startsWith('/reset-permissions')) {
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            messages: [
              ...state.tabStates[activeTabId].messages,
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
          }
        }
      }));
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Clear any existing timeout for this tab
    const existingTimeout = get().tabStates[activeTabId]?.thinkingClearTimeout;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Pick a random fun thinking status
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
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          messages: [...state.tabStates[activeTabId].messages, userMessage],
          isLoading: true,
          isThinking: true,
          thinkingStatus: randomStatus,
          streamingMessage: '',
          error: null,
          thinkingClearTimeout: null
        }
      }
    }));

    // Get project path from active tab
    const activeTab = useTabStore.getState().getActiveTab();
    if (!activeTab) {
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            error: 'No project selected. Please select a project first.',
            isLoading: false,
            isThinking: false,
            thinkingStatus: null,
            streamingMessage: null
          }
        }
      }));
      return;
    }

    const projectPath = activeTab.projectPath;
    const model = activeTab.selectedModel;

    // Note: /usage is a built-in Claude Code slash command
    // We don't intercept it - just pass it through to Claude CLI
    // Claude Code will handle it and return usage statistics

    try {
      console.log('[chatStore] Sending message to Claude CLI');
      console.log('[chatStore] Content:', content);
      console.log('[chatStore] Project path:', projectPath);
      console.log('[chatStore] Model:', model);

      await tauriAPI.sendMessage(content, projectPath, model, true);

      console.log('[chatStore] sendMessage returned successfully');
    } catch (error) {
      console.error('[chatStore] sendMessage error:', error);
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            error: error instanceof Error ? error.message : 'Failed to send message',
            isLoading: false,
            isThinking: false,
            thinkingStatus: null,
            streamingMessage: null
          }
        }
      }));
    }
  },

  appendChunk: (chunk: string) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    console.log('[chatStore] Received chunk:', chunk.substring(0, 50));

    const tabState = get().tabStates[activeTabId];

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...tabState,
          streamingMessage: (tabState.streamingMessage || '') + chunk
        }
      }
    }));

    // Only start timeout once on first chunk
    if (tabState.isThinking && !tabState.thinkingClearTimeout) {
      const timeout = setTimeout(() => {
        set(state => ({
          tabStates: {
            ...state.tabStates,
            [activeTabId]: {
              ...state.tabStates[activeTabId],
              isThinking: false,
              thinkingStatus: null,
              thinkingClearTimeout: null
            }
          }
        }));
      }, 1500);

      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            thinkingClearTimeout: timeout
          }
        }
      }));
    }
  },

  appendThought: (text: string) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    const thought: Message = {
      id: crypto.randomUUID(),
      role: 'thought',
      content: text,
      timestamp: new Date()
    };

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          messages: [...state.tabStates[activeTabId].messages, thought]
        }
      }
    }));
  },

  discardStream: () => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          streamingMessage: ''
        }
      }
    }));
  },

  finalizeStreamTurn: () => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    const tabState = get().tabStates[activeTabId];
    const streamingMessage = tabState.streamingMessage;

    if (!streamingMessage || streamingMessage.trim().length === 0) {
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            streamingMessage: ''
          }
        }
      }));
      return;
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: streamingMessage.trim(),
      timestamp: new Date()
    };

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          messages: [...state.tabStates[activeTabId].messages, assistantMessage],
          streamingMessage: ''
        }
      }
    }));
  },

  finalizeStream: () => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    const tabState = get().tabStates[activeTabId];
    const streamingMessage = tabState.streamingMessage;
    console.log('[chatStore] Finalizing stream, message length:', streamingMessage?.length || 0);

    // Clear any pending timeout
    if (tabState.thinkingClearTimeout) {
      clearTimeout(tabState.thinkingClearTimeout);
    }

    if (!streamingMessage || streamingMessage.trim().length === 0) {
      console.warn('[chatStore] No streaming message to finalize!');
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            isLoading: false,
            isThinking: false,
            thinkingStatus: null,
            streamingMessage: null,
            thinkingClearTimeout: null
          }
        }
      }));
      return;
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: streamingMessage.trim(),
      timestamp: new Date()
    };

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          messages: [...state.tabStates[activeTabId].messages, assistantMessage],
          streamingMessage: null,
          isLoading: false,
          isThinking: false,
          thinkingStatus: null,
          thinkingClearTimeout: null
        }
      }
    }));
  },

  addToolEvent: (eventData: ToolEventData) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    const toolEvent: ToolEvent = {
      ...eventData,
      timestamp: new Date(eventData.timestamp)
    };

    set(state => {
      const tabState = state.tabStates[activeTabId];
      const existingIndex = tabState.toolEvents.findIndex(e => e.id === toolEvent.id);

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...tabState.toolEvents];
        updated[existingIndex] = toolEvent;
        return {
          tabStates: {
            ...state.tabStates,
            [activeTabId]: {
              ...tabState,
              toolEvents: updated
            }
          }
        };
      } else {
        // Add new
        return {
          tabStates: {
            ...state.tabStates,
            [activeTabId]: {
              ...tabState,
              toolEvents: [...tabState.toolEvents, toolEvent]
            }
          }
        };
      }
    });
  },

  updateToolEvent: (id: string, updates: Partial<ToolEvent>) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          toolEvents: state.tabStates[activeTabId].toolEvents.map(event =>
            event.id === id ? { ...event, ...updates } : event
          )
        }
      }
    }));
  },

  setThinkingStatus: (status: string | null) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    // Cancel any pending timeout
    const existingTimeout = get().tabStates[activeTabId]?.thinkingClearTimeout;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          isThinking: status !== null,
          thinkingStatus: status,
          thinkingClearTimeout: null
        }
      }
    }));
  },

  setError: (error: string) => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          error,
          isLoading: false,
          isThinking: false,
          thinkingStatus: null,
          streamingMessage: null
        }
      }
    }));
  },

  loadHistory: async () => {
    const activeTabId = useTabStore.getState().activeTabId;
    const activeTab = useTabStore.getState().getActiveTab();

    if (!activeTabId || !activeTab) {
      console.log('[chatStore] No active tab, skipping history load');
      return;
    }

    // Ensure tab state exists
    if (!get().tabStates[activeTabId]) {
      get().initTabState(activeTabId);
    }

    const projectPath = activeTab.projectPath;

    try {
      console.log('[chatStore] Loading conversation history from CLI');
      const displayMessages = await tauriAPI.loadCurrentSession(projectPath);

      if (displayMessages && displayMessages.length > 0) {
        const messages = displayMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));

        set(state => ({
          tabStates: {
            ...state.tabStates,
            [activeTabId]: {
              ...state.tabStates[activeTabId],
              messages,
              toolEvents: [],
              error: null,
              isLoading: false,
              isThinking: false,
              thinkingStatus: null,
              streamingMessage: null,
              thinkingClearTimeout: null
            }
          }
        }));

        console.log(`[chatStore] Loaded ${messages.length} messages from CLI history`);
      } else {
        console.log('[chatStore] No history found in CLI');
        set(state => ({
          tabStates: {
            ...state.tabStates,
            [activeTabId]: createEmptyTabState()
          }
        }));

        // Reset token count when loading empty session
        const { updateTab } = useTabStore.getState();
        updateTab(activeTabId, { totalTokens: 0 });
      }
    } catch (error) {
      console.error('[chatStore] Failed to load history:', error);
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            error: error instanceof Error ? error.message : 'Failed to load history'
          }
        }
      }));
    }
  },

  loadSessionById: async (sessionId: string) => {
    const activeTabId = useTabStore.getState().activeTabId;
    const activeTab = useTabStore.getState().getActiveTab();

    if (!activeTabId || !activeTab) {
      console.log('[chatStore] No active tab, skipping session load');
      return;
    }

    // Ensure tab state exists
    if (!get().tabStates[activeTabId]) {
      get().initTabState(activeTabId);
    }

    const projectPath = activeTab.projectPath;

    try {
      console.log(`[chatStore] Loading session: ${sessionId}`);
      const displayMessages = await tauriAPI.loadSession(projectPath, sessionId);

      if (displayMessages && displayMessages.length > 0) {
        const messages = displayMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));

        set(state => ({
          tabStates: {
            ...state.tabStates,
            [activeTabId]: {
              ...state.tabStates[activeTabId],
              messages,
              toolEvents: [],
              error: null,
              isLoading: false,
              isThinking: false,
              thinkingStatus: null,
              streamingMessage: null,
              thinkingClearTimeout: null
            }
          }
        }));

        // Reset token count when loading a different session
        const { updateTab } = useTabStore.getState();
        updateTab(activeTabId, { totalTokens: 0 });

        console.log(`[chatStore] Loaded ${messages.length} messages from session ${sessionId}`);
      } else {
        console.log(`[chatStore] Session ${sessionId} is empty`);
        set(state => ({
          tabStates: {
            ...state.tabStates,
            [activeTabId]: createEmptyTabState()
          }
        }));
        // Reset token count for empty session
        const { updateTab } = useTabStore.getState();
        updateTab(activeTabId, { totalTokens: 0 });
      }
    } catch (error) {
      console.error('[chatStore] Failed to load session:', error);
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            error: error instanceof Error ? error.message : 'Failed to load session'
          }
        }
      }));
    }
  },

  clearHistory: async () => {
    const activeTabId = useTabStore.getState().activeTabId;
    const activeTab = useTabStore.getState().getActiveTab();

    if (!activeTabId || !activeTab) {
      console.log('[chatStore] No active tab, skipping clear');
      return;
    }

    console.log('[chatStore] clearHistory called for tab:', activeTabId);

    // Clear any pending timeout
    const tabState = get().tabStates[activeTabId];
    if (tabState?.thinkingClearTimeout) {
      clearTimeout(tabState.thinkingClearTimeout);
    }

    try {
      // Kill Claude process first
      await tauriAPI.killClaudeProcess();

      // Clear history for this project
      await tauriAPI.clearHistory(activeTab.projectPath);

      // Reset tab state
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: createEmptyTabState()
        }
      }));

      // Reset token count for this tab
      const { updateTab } = useTabStore.getState();
      updateTab(activeTabId, { totalTokens: 0 });

      console.log('[chatStore] State reset complete for tab:', activeTabId);
    } catch (error) {
      console.error('[chatStore] clearHistory failed:', error);
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...createEmptyTabState(),
            error: error instanceof Error ? error.message : 'Failed to clear history'
          }
        }
      }));
    }
  },

  clearError: () => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    set(state => ({
      tabStates: {
        ...state.tabStates,
        [activeTabId]: {
          ...state.tabStates[activeTabId],
          error: null
        }
      }
    }));
  },

  stopClaude: async () => {
    const activeTabId = useTabStore.getState().activeTabId;
    if (!activeTabId || !get().tabStates[activeTabId]) return;

    console.log('[chatStore] stopClaude called - killing process');

    // Clear any pending timeout
    const tabState = get().tabStates[activeTabId];
    if (tabState?.thinkingClearTimeout) {
      clearTimeout(tabState.thinkingClearTimeout);
    }

    try {
      // Kill the Claude process
      await tauriAPI.killClaudeProcess();

      // Set stopped indicator
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            isStopped: true,
            isLoading: false,
            isThinking: true,
            thinkingStatus: '⏹️ Stopped by user',
            thinkingClearTimeout: null
          }
        }
      }));

      // Clear stopped indicator after 3 seconds
      setTimeout(() => {
        const currentActiveTabId = useTabStore.getState().activeTabId;
        if (currentActiveTabId === activeTabId) {
          set(state => ({
            tabStates: {
              ...state.tabStates,
              [activeTabId]: {
                ...state.tabStates[activeTabId],
                isStopped: false,
                isThinking: false,
                thinkingStatus: null
              }
            }
          }));
        }
      }, 3000);

      console.log('[chatStore] Claude process stopped');
    } catch (error) {
      console.error('[chatStore] Failed to stop Claude:', error);
      set(state => ({
        tabStates: {
          ...state.tabStates,
          [activeTabId]: {
            ...state.tabStates[activeTabId],
            error: error instanceof Error ? error.message : 'Failed to stop Claude'
          }
        }
      }));
    }
  }
}));
