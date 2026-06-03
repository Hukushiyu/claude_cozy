import { create } from 'zustand';
import type { CommandSuggestion } from '../types/chat';
import { SLASH_COMMANDS } from '../utils/suggestions';
import { tauriAPI } from '../utils/tauri-api';

interface SkillsStore {
  customSkills: CommandSuggestion[];
  addSkill: (skill: CommandSuggestion) => Promise<void>;
  updateSkill: (oldName: string, skill: CommandSuggestion) => Promise<void>;
  deleteSkill: (name: string) => Promise<void>;
  loadCustomSkills: () => Promise<void>;
  getAllSkills: () => CommandSuggestion[];
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  customSkills: [],

  addSkill: async (skill) => {
    console.log('[SkillsStore] Adding skill:', skill.name);
    try {
      await tauriAPI.createCustomSkill(skill);
      // Reload skills from disk
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
      // Reload skills from disk
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
      // Reload skills from disk
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

      // Convert to CommandSuggestion format
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
    // Merge built-in skills with custom skills
    // Custom skills appear after built-in to avoid overriding by default
    const all = [...SLASH_COMMANDS, ...get().customSkills];
    console.log('[SkillsStore] getAllSkills:', SLASH_COMMANDS.length, 'built-in +', get().customSkills.length, 'custom');
    return all;
  }
}));
