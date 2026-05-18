import { create } from 'zustand';

export interface Theme {
  id: string;
  name: string;
  colors: {
    // Main backgrounds
    bg: string;
    sidebarBg: string;
    // Text colors
    text: string;
    textSecondary: string;
    // Accent colors
    accent: string;
    accentHover: string;
    // UI elements
    border: string;
    hover: string;
    // Chat specific
    userBubble: string;
    assistantBubble: string;
  };
}

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
  setTheme: (themeId: string) => void;
  setAssistantName: (name: string) => void;
  setSelectedModel: (modelId: string) => void;
  loadTheme: () => void;
  loadSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  currentTheme: themes[0], // Default to Claude Classic
  assistantName: 'Claude', // Default assistant name
  selectedModel: 'claude-sonnet-4-6', // Default to Sonnet 4.6

  setTheme: (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
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
      const theme = themes.find(t => t.id === savedThemeId);
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
    // Load theme
    const savedThemeId = localStorage.getItem('claude-theme');
    if (savedThemeId) {
      const theme = themes.find(t => t.id === savedThemeId);
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
  }
}));

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
}
