import { create } from 'zustand';

interface DragStore {
  draggedFile: string | null;
  setDraggedFile: (file: string | null) => void;
}

export const useDragStore = create<DragStore>((set) => ({
  draggedFile: null,
  setDraggedFile: (file) => set({ draggedFile: file }),
}));
