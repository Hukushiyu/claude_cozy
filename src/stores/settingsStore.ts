import { create } from 'zustand';
import { Theme } from '../types/theme';
import {
  isValidTheme,
  sanitizeThemeName,
  generateCustomThemeId,
  validateImportedTheme,
} from '../utils/themeValidation';

export const themes: Theme[] = [
  {
    id: 'claude-classic',
    name: 'Claude Classic',
    colors: {
      bg: '#FAFAF8',
      sidebarBg: '#D4C5B0',
      text: '#2D2D2D',
      textSecondary: '#6B6B6B',
      accent: '#C97D63',
      accentHover: '#B36B54',
      border: '#BFB5A3',
      hover: '#C9BBA8',
      userBubble: '#FFFFFF',
      assistantBubble: '#F5F5F3',
    }
  },
  {
    id: 'light',
    name: 'Light',
    colors: {
      bg: '#FFFFFF',
      sidebarBg: '#F5F5F5',
      text: '#1A1A1A',
      textSecondary: '#666666',
      accent: '#2563EB',
      accentHover: '#1D4ED8',
      border: '#E5E5E5',
      hover: '#F0F0F0',
      userBubble: '#EFF6FF',
      assistantBubble: '#F9FAFB',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      bg: '#1A1A1A',
      sidebarBg: '#0F0F0F',
      text: '#F5F5F5',
      textSecondary: '#B3B3B3',
      accent: '#60A5FA',
      accentHover: '#3B82F6',
      border: '#404040',
      hover: '#2A2A2A',
      userBubble: '#2563EB',
      assistantBubble: '#2D2D2D',
    }
  },
  {
    id: 'dark-warm',
    name: 'Dark Warm',
    colors: {
      bg: '#000000',
      sidebarBg: '#2D2520',
      text: '#E8E3D6',
      textSecondary: '#A39A8C',
      accent: '#C97D63',
      accentHover: '#B36B54',
      border: '#3D3530',
      hover: '#3A312C',
      userBubble: '#1A1614',
      assistantBubble: '#252220',
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: '#F0F4F0',
      sidebarBg: '#E1EBE1',
      text: '#1A3A1A',
      textSecondary: '#4A6A4A',
      accent: '#22863A',
      accentHover: '#176629',
      border: '#C1D9C1',
      hover: '#D5E5D5',
      userBubble: '#E6F7E6',
      assistantBubble: '#F5FAF5',
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#F0F4F8',
      sidebarBg: '#E1EAF1',
      text: '#1A2B3A',
      textSecondary: '#4A5A6A',
      accent: '#0369A1',
      accentHover: '#075985',
      border: '#BAD4E8',
      hover: '#D5E3EF',
      userBubble: '#E0F2FE',
      assistantBubble: '#F0F9FF',
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      bg: '#FFF5F0',
      sidebarBg: '#FFE8DC',
      text: '#3A1A1A',
      textSecondary: '#6A4A4A',
      accent: '#DC2626',
      accentHover: '#B91C1C',
      border: '#F4C5B5',
      hover: '#FFDDD0',
      userBubble: '#FEE2E2',
      assistantBubble: '#FFF5F5',
    }
  }
];

interface SettingsStore {
  currentTheme: Theme;
  assistantName: string;
  selectedModel: string;
  customThemes: Theme[];

  setTheme: (themeId: string) => void;
  setAssistantName: (name: string) => void;
  setSelectedModel: (modelId: string) => void;
  loadTheme: () => void;
  loadSettings: () => void;

  // Custom theme management
  loadCustomThemes: () => void;
  saveCustomTheme: (theme: Omit<Theme, 'id'>) => string;
  updateCustomTheme: (themeId: string, theme: Omit<Theme, 'id'>) => boolean;
  deleteCustomTheme: (themeId: string) => boolean;
  exportTheme: (themeId: string) => string | null;
  importTheme: (jsonString: string) => { success: boolean; error?: string; themeName?: string };
  getAllThemes: () => Theme[];
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  currentTheme: themes[0], // Default to Claude Classic
  assistantName: 'Claude', // Default assistant name
  selectedModel: 'claude-sonnet-4-6', // Default to Sonnet 4.6
  customThemes: [], // Empty array initially, loaded from localStorage

  setTheme: (themeId: string) => {
    const allThemes = get().getAllThemes();
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      set({ currentTheme: theme });
      // Apply theme to CSS variables
      applyTheme(theme);
      // Save to localStorage
      localStorage.setItem('claude-theme', themeId);
    }
  },

  setAssistantName: (name: string) => {
    const trimmedName = name.trim() || 'Claude'; // Fallback to Claude if empty
    set({ assistantName: trimmedName });
    localStorage.setItem('assistant-name', trimmedName);
  },

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId });
    localStorage.setItem('selected-model', modelId);
  },

  loadTheme: () => {
    const savedThemeId = localStorage.getItem('claude-theme');
    if (savedThemeId) {
      const allThemes = get().getAllThemes();
      const theme = allThemes.find(t => t.id === savedThemeId);
      if (theme) {
        set({ currentTheme: theme });
        applyTheme(theme);
      }
    } else {
      // Apply default theme
      applyTheme(themes[0]);
    }
  },

  loadSettings: () => {
    // Load custom themes first
    get().loadCustomThemes();

    // Load theme
    const savedThemeId = localStorage.getItem('claude-theme');
    if (savedThemeId) {
      const allThemes = get().getAllThemes();
      const theme = allThemes.find(t => t.id === savedThemeId);
      if (theme) {
        set({ currentTheme: theme });
        applyTheme(theme);
      }
    } else {
      applyTheme(themes[0]);
    }

    // Load assistant name
    const savedName = localStorage.getItem('assistant-name');
    if (savedName) {
      set({ assistantName: savedName });
    }

    // Load selected model
    const savedModel = localStorage.getItem('selected-model');
    if (savedModel) {
      set({ selectedModel: savedModel });
    }
  },

  // Custom theme management
  loadCustomThemes: () => {
    try {
      const saved = localStorage.getItem('custom-themes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Validate each theme
          const validThemes = parsed.filter(isValidTheme);
          set({ customThemes: validThemes });
        }
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error);
      set({ customThemes: [] });
    }
  },

  saveCustomTheme: (themeData: Omit<Theme, 'id'>) => {
    const id = generateCustomThemeId();
    const sanitizedName = sanitizeThemeName(themeData.name);

    const newTheme: Theme = {
      id,
      name: sanitizedName || 'Custom Theme',
      colors: themeData.colors,
    };

    const customThemes = [...get().customThemes, newTheme];

    try {
      localStorage.setItem('custom-themes', JSON.stringify(customThemes));
      set({ customThemes });
      return id;
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some custom themes.');
      }
      throw error;
    }
  },

  updateCustomTheme: (themeId: string, themeData: Omit<Theme, 'id'>) => {
    const customThemes = get().customThemes;
    const index = customThemes.findIndex(t => t.id === themeId);

    if (index === -1) {
      return false; // Theme not found
    }

    const sanitizedName = sanitizeThemeName(themeData.name);
    const updatedTheme: Theme = {
      id: themeId,
      name: sanitizedName || 'Custom Theme',
      colors: themeData.colors,
    };

    const updated = [...customThemes];
    updated[index] = updatedTheme;

    try {
      localStorage.setItem('custom-themes', JSON.stringify(updated));
      set({ customThemes: updated });

      // If this theme is currently active, update it
      if (get().currentTheme.id === themeId) {
        set({ currentTheme: updatedTheme });
        applyTheme(updatedTheme);
      }

      return true;
    } catch (error) {
      console.error('Failed to update custom theme:', error);
      return false;
    }
  },

  deleteCustomTheme: (themeId: string) => {
    const customThemes = get().customThemes;
    const filtered = customThemes.filter(t => t.id !== themeId);

    if (filtered.length === customThemes.length) {
      return false; // Theme not found
    }

    try {
      localStorage.setItem('custom-themes', JSON.stringify(filtered));
      set({ customThemes: filtered });

      // If deleted theme is currently active, switch to default
      if (get().currentTheme.id === themeId) {
        get().setTheme(themes[0].id);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete custom theme:', error);
      return false;
    }
  },

  exportTheme: (themeId: string) => {
    const allThemes = get().getAllThemes();
    const theme = allThemes.find(t => t.id === themeId);

    if (!theme) {
      return null;
    }

    return JSON.stringify(theme, null, 2);
  },

  importTheme: (jsonString: string) => {
    const validation = validateImportedTheme(jsonString);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const importedTheme = validation.theme;

    // Generate new ID to avoid conflicts
    const id = generateCustomThemeId();
    const sanitizedName = sanitizeThemeName(importedTheme.name);

    const newTheme: Theme = {
      id,
      name: sanitizedName || 'Imported Theme',
      colors: importedTheme.colors,
    };

    const customThemes = [...get().customThemes, newTheme];

    try {
      localStorage.setItem('custom-themes', JSON.stringify(customThemes));
      set({ customThemes });
      return { success: true, themeName: newTheme.name };
    } catch (error) {
      console.error('Failed to import theme:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return { success: false, error: 'Storage quota exceeded. Please delete some custom themes.' };
      }
      return { success: false, error: 'Failed to save imported theme.' };
    }
  },

  getAllThemes: () => {
    return [...themes, ...get().customThemes];
  },
}));

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
}
