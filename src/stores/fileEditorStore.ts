import { create } from 'zustand';

const STORAGE_KEY = 'cozy-file-editor-buffers';
const MAX_STORAGE_BYTES = 512 * 1024; // 500 KB cap across all dirty buffers

interface BufferEntry {
  content: string;
  savedContent: string; // last content written to disk
}

interface FileEditorStore {
  buffers: Record<string, BufferEntry>;

  // Called once when file loads from disk — only seeds if no buffer exists yet
  initBuffer: (filePath: string, diskContent: string) => void;

  // Called on every editor keystroke
  setBufferContent: (filePath: string, content: string) => void;

  // Called after a successful write to disk
  markSaved: (filePath: string) => void;

  // Called on discard — removes buffer entirely
  discardBuffer: (filePath: string) => void;

  // Read helpers
  getBuffer: (filePath: string) => BufferEntry | undefined;
  isDirty: (filePath: string) => boolean;
  getDirtyPaths: () => string[];
}

// --- localStorage helpers ---

function loadFromStorage(): Record<string, BufferEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BufferEntry>;
  } catch {
    return {};
  }
}

function saveToStorage(buffers: Record<string, BufferEntry>) {
  // Only persist dirty buffers to stay lean
  const dirty: Record<string, BufferEntry> = {};
  let totalBytes = 0;

  for (const [path, entry] of Object.entries(buffers)) {
    if (entry.content !== entry.savedContent) {
      const entryBytes = path.length + entry.content.length + entry.savedContent.length;
      totalBytes += entryBytes;
      if (totalBytes <= MAX_STORAGE_BYTES) {
        dirty[path] = entry;
      }
      // Silently drop entries that would exceed the cap — in-memory buffer still works
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dirty));
  } catch {
    // localStorage full — in-memory buffer still works for the session
  }
}

function removeFromStorage(filePath: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as Record<string, BufferEntry>;
    delete stored[filePath];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // ignore
  }
}

// --- Store ---

export const useFileEditorStore = create<FileEditorStore>((set, get) => ({
  // Seed from localStorage on startup so dirty buffers survive restarts
  buffers: loadFromStorage(),

  initBuffer: (filePath, diskContent) => {
    const existing = get().buffers[filePath];
    // If we already have a buffer (e.g. restored from localStorage), keep it
    if (existing !== undefined) return;

    set(state => ({
      buffers: {
        ...state.buffers,
        [filePath]: { content: diskContent, savedContent: diskContent },
      }
    }));
    // No need to persist a clean buffer
  },

  setBufferContent: (filePath, content) => {
    set(state => {
      const existing = state.buffers[filePath];
      const savedContent = existing?.savedContent ?? content;
      const updated = {
        ...state.buffers,
        [filePath]: { content, savedContent },
      };
      saveToStorage(updated);
      return { buffers: updated };
    });
  },

  markSaved: (filePath) => {
    set(state => {
      const existing = state.buffers[filePath];
      if (!existing) return state;
      const updated = {
        ...state.buffers,
        [filePath]: { content: existing.content, savedContent: existing.content },
      };
      removeFromStorage(filePath);
      return { buffers: updated };
    });
  },

  discardBuffer: (filePath) => {
    set(state => {
      const updated = { ...state.buffers };
      delete updated[filePath];
      removeFromStorage(filePath);
      return { buffers: updated };
    });
  },

  getBuffer: (filePath) => get().buffers[filePath],

  isDirty: (filePath) => {
    const entry = get().buffers[filePath];
    if (!entry) return false;
    return entry.content !== entry.savedContent;
  },

  getDirtyPaths: () => {
    return Object.entries(get().buffers)
      .filter(([, entry]) => entry.content !== entry.savedContent)
      .map(([path]) => path);
  },
}));
