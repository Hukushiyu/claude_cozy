import { create } from 'zustand';
import type { FileNode } from '../types/ipc';
import { tauriAPI } from '../utils/tauri-api';

interface ProjectStore {
  projectPath: string | null;
  fileTree: FileNode[];
  isLoadingTree: boolean;
  error: string | null;

  selectProject: () => Promise<void>;
  loadFileTree: () => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projectPath: null,
  fileTree: [],
  isLoadingTree: false,
  error: null,

  selectProject: async () => {
    try {
      console.log('selectProject called');

      console.log('Calling tauriAPI.selectProject()');
      const path = await tauriAPI.selectProject();
      console.log('Selected path:', path);

      if (path) {
        set({ projectPath: path, fileTree: [], error: null });
        await get().loadFileTree();
      }
    } catch (error) {
      console.error('Error in selectProject:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to select project'
      });
    }
  },

  loadFileTree: async () => {
    const { projectPath } = get();

    if (!projectPath) {
      return;
    }

    set({ isLoadingTree: true, error: null });

    try {
      const tree = await tauriAPI.loadFileTree(projectPath);
      set({ fileTree: tree, isLoadingTree: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load file tree',
        isLoadingTree: false
      });
    }
  },

  clearError: () => set({ error: null })
}));
