import { create } from 'zustand';
import { listen } from '@tauri-apps/api/event';
import type { CommandSuggestion, PluginInfo } from '../types/chat';
import { SLASH_COMMANDS, BUILTIN_COMMANDS } from '../utils/suggestions';
import { tauriAPI } from '../utils/tauri-api';

interface SkillsStore {
  customSkills: CommandSuggestion[];
  plugins: PluginInfo[];
  addSkill: (skill: CommandSuggestion) => Promise<void>;
  updateSkill: (oldName: string, skill: CommandSuggestion) => Promise<void>;
  deleteSkill: (name: string) => Promise<void>;
  loadCustomSkills: () => Promise<void>;
  getAllSkills: () => CommandSuggestion[];
  getPlugins: () => PluginInfo[];
  initPluginListener: () => () => void;
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  customSkills: [],
  plugins: [],

  addSkill: async (skill) => {
    console.log('[SkillsStore] Adding skill:', skill.name);
    try {
      await tauriAPI.createCustomSkill(skill);
      await get().loadCustomSkills();
    } catch (error) {
      console.error('[SkillsStore] Failed to add skill:', error);
      throw error;
    }
  },

  updateSkill: async (oldName, skill) => {
    console.log('[SkillsStore] Updating skill:', oldName, '→', skill.name);
    try {
      await tauriAPI.updateCustomSkill(oldName, skill);
      await get().loadCustomSkills();
    } catch (error) {
      console.error('[SkillsStore] Failed to update skill:', error);
      throw error;
    }
  },

  deleteSkill: async (name) => {
    console.log('[SkillsStore] Deleting skill:', name);
    try {
      await tauriAPI.deleteCustomSkill(name);
      await get().loadCustomSkills();
    } catch (error) {
      console.error('[SkillsStore] Failed to delete skill:', error);
      throw error;
    }
  },

  loadCustomSkills: async () => {
    try {
      const skills = await tauriAPI.listCustomSkills();
      console.log('[SkillsStore] Loaded', skills.length, 'custom skills:', skills);

      const commandSkills: CommandSuggestion[] = skills.map(skill => ({
        type: 'command' as const,
        commandType: 'skill' as const,
        name: skill.name,
        icon: skill.icon || '✨',
        description: skill.description,
        category: skill.category,
        usage: skill.usage,
        examples: skill.examples
      }));

      set({ customSkills: commandSkills });
    } catch (error) {
      console.error('[SkillsStore] Failed to load custom skills:', error);
      set({ customSkills: [] });
    }
  },

  getAllSkills: () => {
    const all = [...SLASH_COMMANDS, ...BUILTIN_COMMANDS, ...get().customSkills];
    console.log('[SkillsStore] getAllSkills:', SLASH_COMMANDS.length, 'built-in +', BUILTIN_COMMANDS.length, 'builtins +', get().customSkills.length, 'custom');
    return all;
  },

  getPlugins: () => {
    return get().plugins;
  },

  initPluginListener: () => {
    let unlisten: (() => void) | null = null;

    listen<PluginInfo[]>('chat:plugins-loaded', (event) => {
      console.log('[SkillsStore] Received plugins:', event.payload.length);
      set({ plugins: event.payload });
    }).then(fn => { unlisten = fn; });

    return () => {
      if (unlisten) unlisten();
    };
  },
}));
