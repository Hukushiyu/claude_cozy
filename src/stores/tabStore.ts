import { create } from 'zustand';
import { useChatStore } from './chatStore';
import type { FileNode } from '../types/ipc';
import { tauriAPI } from '../utils/tauri-api';

export interface Tab {
  id: string;
  projectPath: string;
  displayName: string;
  sessionId: string | null;
  permissionMode: string;
  selectedModel: string;
  createdAt: number;
  totalTokens?: number; // Running total of tokens used in this session
}

interface TabFileTreeState {
  fileTree: FileNode[];
  isLoadingTree: boolean;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  maxTabs: number;

  // Per-tab file trees
  fileTreeStates: Record<string, TabFileTreeState>;

  // Tab CRUD operations
  addTab: (projectPath: string, permissionMode?: string, selectedModel?: string) => string;
  removeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;

  // Getters
  getActiveTab: () => Tab | null;
  getTab: (tabId: string) => Tab | null;
  canAddTab: () => boolean;
  getActiveFileTreeState: () => TabFileTreeState;

  // File tree operations
  setFileTree: (tabId: string, fileTree: FileNode[]) => void;
  setLoadingTree: (tabId: string, isLoading: boolean) => void;

  // Persistence
  loadTabs: () => void;
  saveTabs: () => void;
}

const MAX_TABS = 6;

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  maxTabs: MAX_TABS,
  fileTreeStates: {},

  addTab: (projectPath: string, permissionMode = 'acceptEdits', selectedModel = 'claude-sonnet-4-6'): string => {
    const state = get();

    // Check max tabs limit
    if (state.tabs.length >= MAX_TABS) {
      console.warn('[TabStore] Cannot add tab: maximum of', MAX_TABS, 'tabs reached');
      throw new Error(`Maximum of ${MAX_TABS} tabs reached`);
    }

    // Generate unique ID
    const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Extract folder name from path
    const pathParts = projectPath.replace(/\\/g, '/').split('/');
    const displayName = pathParts[pathParts.length - 1] || 'Untitled';

    const newTab: Tab = {
      id,
      projectPath,
      displayName,
      sessionId: null,
      permissionMode,
      selectedModel,
      createdAt: Date.now()
    };

    console.log('[TabStore] Adding tab:', newTab);

    set(state => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id
    }));

    // Initialize chat state for this tab
    useChatStore.getState().initTabState(id);

    // Initialize file tree state for this tab
    set(state => ({
      fileTreeStates: {
        ...state.fileTreeStates,
        [id]: { fileTree: [], isLoadingTree: false }
      }
    }));

    // Sync permission mode with backend
    tauriAPI.setPermissionMode(permissionMode).catch(err => {
      console.error('[TabStore] Failed to set initial permission mode:', err);
    });

    // Persist to localStorage
    get().saveTabs();

    return id;
  },

  removeTab: (tabId: string) => {
    const state = get();
    const tabIndex = state.tabs.findIndex(t => t.id === tabId);

    if (tabIndex === -1) {
      console.warn('[TabStore] Tab not found:', tabId);
      return;
    }

    console.log('[TabStore] Removing tab:', tabId);

    const newTabs = state.tabs.filter(t => t.id !== tabId);
    let newActiveTabId = state.activeTabId;

    // If removing active tab, switch to another
    if (state.activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Switch to next tab, or previous if removing last tab
        newActiveTabId = tabIndex < newTabs.length
          ? newTabs[tabIndex].id
          : newTabs[newTabs.length - 1].id;
      } else {
        newActiveTabId = null;
      }
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId
    });

    // Remove chat state for this tab
    useChatStore.getState().removeTabState(tabId);

    // Remove file tree state for this tab
    set(state => {
      const { [tabId]: removed, ...remaining } = state.fileTreeStates;
      return { fileTreeStates: remaining };
    });

    // Persist to localStorage
    get().saveTabs();
  },

  switchTab: (tabId: string) => {
    const state = get();
    const tab = state.tabs.find(t => t.id === tabId);

    if (!tab) {
      console.warn('[TabStore] Cannot switch to tab, not found:', tabId);
      return;
    }

    console.log('[TabStore] Switching to tab:', tabId, 'with permission mode:', tab.permissionMode);

    set({ activeTabId: tabId });

    // Sync this tab's permission mode with backend
    tauriAPI.setPermissionMode(tab.permissionMode).catch(err => {
      console.error('[TabStore] Failed to sync permission mode on tab switch:', err);
    });

    // Persist active tab
    get().saveTabs();
  },

  updateTab: (tabId: string, updates: Partial<Tab>) => {
    const state = get();
    const tabIndex = state.tabs.findIndex(t => t.id === tabId);

    if (tabIndex === -1) {
      console.warn('[TabStore] Cannot update tab, not found:', tabId);
      return;
    }

    console.log('[TabStore] Updating tab:', tabId, updates);

    const updatedTabs = [...state.tabs];
    updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...updates };

    set({ tabs: updatedTabs });

    // Persist to localStorage
    get().saveTabs();
  },

  getActiveTab: () => {
    const state = get();
    if (!state.activeTabId) return null;
    return state.tabs.find(t => t.id === state.activeTabId) || null;
  },

  getTab: (tabId: string) => {
    const state = get();
    return state.tabs.find(t => t.id === tabId) || null;
  },

  canAddTab: () => {
    const state = get();
    return state.tabs.length < MAX_TABS;
  },

  getActiveFileTreeState: () => {
    const state = get();
    if (!state.activeTabId || !state.fileTreeStates[state.activeTabId]) {
      return { fileTree: [], isLoadingTree: false };
    }
    return state.fileTreeStates[state.activeTabId];
  },

  setFileTree: (tabId: string, fileTree: FileNode[]) => {
    set(state => ({
      fileTreeStates: {
        ...state.fileTreeStates,
        [tabId]: {
          ...state.fileTreeStates[tabId],
          fileTree
        }
      }
    }));
  },

  setLoadingTree: (tabId: string, isLoading: boolean) => {
    set(state => ({
      fileTreeStates: {
        ...state.fileTreeStates,
        [tabId]: {
          ...state.fileTreeStates[tabId],
          isLoadingTree: isLoading
        }
      }
    }));
  },

  loadTabs: () => {
    try {
      const saved = localStorage.getItem('claude-tabs');
      if (saved) {
        const data = JSON.parse(saved);
        console.log('[TabStore] Loaded', data.tabs?.length || 0, 'tabs from localStorage');
        set({
          tabs: data.tabs || [],
          activeTabId: data.activeTabId || null
        });
      } else {
        console.log('[TabStore] No saved tabs found in localStorage');
      }
    } catch (error) {
      console.error('[TabStore] Failed to load tabs:', error);
      set({ tabs: [], activeTabId: null });
    }
  },

  saveTabs: () => {
    try {
      const state = get();
      const data = {
        tabs: state.tabs,
        activeTabId: state.activeTabId
      };
      localStorage.setItem('claude-tabs', JSON.stringify(data));
      console.log('[TabStore] Saved', state.tabs.length, 'tabs to localStorage');
    } catch (error) {
      console.error('[TabStore] Failed to save tabs:', error);
    }
  }
}));
