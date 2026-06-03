import { useEffect, useState } from 'react';
import { useSkillsStore } from '../../stores/skillsStore';
import { SLASH_COMMANDS } from '../../utils/suggestions';
import type { CommandSuggestion } from '../../types/chat';
import { ask } from '@tauri-apps/plugin-dialog';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SkillFormData {
  name: string;
  icon: string;
  description: string;
  category: string;
  usage: string;
  examples: string;
}

interface SkillCardProps {
  skill: CommandSuggestion;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function SkillCard({ skill, readOnly, onEdit, onDelete }: SkillCardProps) {
  return (
    <div
      className="p-3 rounded-lg border transition-colors"
      style={{
        backgroundColor: 'var(--theme-hover)',
        borderColor: 'var(--theme-border)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{skill.icon}</span>
          <code
            className="font-mono text-sm font-medium"
            style={{ color: 'var(--theme-text)' }}
          >
            {skill.name}
          </code>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: readOnly ? 'rgba(147, 51, 234, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: readOnly ? 'rgb(147, 51, 234)' : 'rgb(59, 130, 246)'
            }}
          >
            {readOnly ? 'BUILT-IN' : 'CUSTOM'}
          </span>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="text-sm px-2 py-1 rounded transition-colors"
              style={{
                color: 'var(--theme-accent)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-sm px-2 py-1 rounded transition-colors text-red-600"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
      <p
        className="text-sm mb-1"
        style={{ color: 'var(--theme-textSecondary)' }}
      >
        {skill.description}
      </p>
      {skill.usage && (
        <code
          className="text-xs font-mono block mt-2"
          style={{ color: 'var(--theme-textSecondary)' }}
        >
          {skill.usage}
        </code>
      )}
      {skill.examples && skill.examples.length > 0 && (
        <div className="mt-2 space-y-1">
          {skill.examples.slice(0, 2).map((example, i) => (
            <code
              key={i}
              className="text-xs font-mono block"
              style={{ color: 'var(--theme-textSecondary)' }}
            >
              • {example}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillsModal({ isOpen, onClose }: SkillsModalProps) {
  const { customSkills, addSkill, updateSkill, deleteSkill } = useSkillsStore();
  const [editingSkill, setEditingSkill] = useState<CommandSuggestion | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showEmojiPicker) {
        const target = e.target as HTMLElement;
        if (!target.closest('.emoji-picker-container')) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Common emojis for skills
  const skillEmojis = [
    '✨', '🚀', '🔧', '⚙️', '🛠️', '💡', '🎯', '📝', '🔍', '🎨',
    '📊', '🔐', '⚡', '🌟', '🎪', '🎭', '🎬', '🎮', '🎲', '🎯',
    '📦', '📁', '📂', '📋', '📌', '📍', '🔖', '🏷️', '💾', '💿',
    '🔑', '🔒', '🔓', '🔨', '🔩', '⚙️', '🧰', '🧲', '🧪', '🧬'
  ];

  // Validate skill name (alphanumeric, hyphens only, no spaces)
  const validateSkillName = (name: string): string => {
    // Remove leading slash if present
    const withoutSlash = name.startsWith('/') ? name.substring(1) : name;
    // Replace spaces with hyphens, remove invalid characters
    return withoutSlash
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''); // Remove any non-alphanumeric except hyphens
  };

  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    icon: '✨',
    description: '',
    category: 'custom',
    usage: '',
    examples: ''
  });

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreating || editingSkill) {
          resetForm();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isCreating, editingSkill, onClose]);

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '✨',
      description: '',
      category: 'custom',
      usage: '',
      examples: ''
    });
    setIsCreating(false);
    setEditingSkill(null);
  };

  const loadFormData = (skill: CommandSuggestion) => {
    setFormData({
      name: skill.name,
      icon: skill.icon,
      description: skill.description,
      category: skill.category || 'custom',
      usage: skill.usage || '',
      examples: skill.examples ? skill.examples.join('\n') : ''
    });
  };

  const handleEdit = (skill: CommandSuggestion) => {
    setEditingSkill(skill);
    loadFormData(skill);
    setIsCreating(false);
  };

  const handleSave = async () => {
    const skillName = formData.name.startsWith('/') ? formData.name : `/${formData.name}`;

    const skill: CommandSuggestion = {
      type: 'command',
      commandType: 'skill',
      name: skillName,
      icon: formData.icon,
      description: formData.description,
      category: formData.category,
      usage: formData.usage.trim() || undefined,
      examples: formData.examples.trim()
        ? formData.examples.split('\n').filter(e => e.trim()).map(e => e.trim())
        : undefined
    };

    try {
      if (editingSkill) {
        await updateSkill(editingSkill.name, skill);
      } else {
        await addSkill(skill);
      }
      resetForm();
    } catch (error) {
      console.error('[SkillsModal] Failed to save skill:', error);
      alert(`Failed to save skill: ${error}`);
    }
  };

  const handleDelete = async (skill: CommandSuggestion) => {
    const confirmed = await ask(
      `Delete "${skill.name}"?\n\nThis action cannot be undone.`,
      {
        title: 'Delete Custom Skill?',
        kind: 'warning',
        okLabel: 'Delete',
        cancelLabel: 'Cancel'
      }
    );

    if (confirmed) {
      try {
        await deleteSkill(skill.name);
      } catch (error) {
        console.error('[SkillsModal] Failed to delete skill:', error);
        alert(`Failed to delete skill: ${error}`);
      }
    }
  };

  // Validation
  const isValid = formData.name.trim().length >= 2 &&
                  formData.description.trim().length > 0 &&
                  formData.icon.trim().length > 0;

  const skillName = formData.name.startsWith('/') ? formData.name : `/${formData.name}`;
  const isDuplicate = [...SLASH_COMMANDS, ...customSkills].some(s =>
    s.name.toLowerCase() === skillName.toLowerCase() && s.name !== editingSkill?.name
  );

  // Filter skills by search query
  const builtInSkills = SLASH_COMMANDS.filter(s => s.commandType === 'skill');
  const filteredBuiltIn = searchQuery
    ? builtInSkills.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : builtInSkills;

  const filteredCustom = searchQuery
    ? customSkills.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customSkills;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => {
        if (!isCreating && !editingSkill) onClose();
      }}
    >
      <div
        className="rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--theme-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center flex-shrink-0"
          style={{ backgroundColor: 'var(--theme-accent)', color: '#FFFFFF' }}
        >
          <h2 className="text-xl font-semibold">🛠️ Skills Manager</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search + New Button */}
          {!isCreating && !editingSkill && (
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)'
                }}
              />
              <button
                onClick={() => {
                  resetForm();
                  setIsCreating(true);
                }}
                className="px-4 py-2 rounded font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                + New Custom Skill
              </button>
            </div>
          )}

          {/* Form (when creating or editing) */}
          {(isCreating || editingSkill) && (
            <div
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: 'var(--theme-hover)' }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: 'var(--theme-text)' }}
              >
                {editingSkill ? '✏️ Edit Skill' : '✨ New Custom Skill'}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const validated = validateSkillName(e.target.value);
                      setFormData({ ...formData, name: validated });
                    }}
                    placeholder="my-custom-skill"
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 font-mono"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: isDuplicate ? '#ef4444' : 'var(--theme-border)',
                      color: 'var(--theme-text)'
                    }}
                    maxLength={50}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
                    Only lowercase letters, numbers, and hyphens. Spaces auto-convert to hyphens.
                  </p>
                  {isDuplicate && (
                    <span className="text-xs text-red-600 mt-1 block">
                      Skill name already exists
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Icon *
                  </label>
                  <div className="relative emoji-picker-container">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-32 px-3 py-2 rounded border focus:outline-none focus:ring-2 text-center text-2xl flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text)'
                      }}
                    >
                      {formData.icon}
                      <span className="text-xs">▼</span>
                    </button>

                    {showEmojiPicker && (
                      <div
                        className="absolute z-10 mt-1 p-2 rounded-lg border shadow-lg max-w-xs"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)'
                        }}
                      >
                        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                          {skillEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, icon: emoji });
                                setShowEmojiPicker(false);
                              }}
                              className="w-8 h-8 text-xl hover:bg-opacity-50 rounded transition-colors"
                              style={{
                                backgroundColor: formData.icon === emoji ? 'var(--theme-accent)' : 'transparent'
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this skill does"
                    rows={2}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)'
                    }}
                    maxLength={200}
                  />
                  <span
                    className="text-xs mt-1 block"
                    style={{ color: 'var(--theme-textSecondary)' }}
                  >
                    {formData.description.length}/200 characters
                  </span>
                </div>

                {/* Category */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)'
                    }}
                  >
                    <option value="custom">Custom</option>
                    <option value="configuration">Configuration</option>
                    <option value="code-review">Code Review</option>
                    <option value="workflow">Workflow</option>
                    <option value="documentation">Documentation</option>
                  </select>
                </div>

                {/* Usage */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Usage (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.usage}
                    onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    placeholder="/my-skill <required> [optional]"
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 font-mono text-sm"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)'
                    }}
                    maxLength={100}
                  />
                </div>

                {/* Examples */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Examples (optional, one per line)
                  </label>
                  <textarea
                    value={formData.examples}
                    onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                    placeholder="/my-skill example1&#10;/my-skill arg example2"
                    rows={3}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 resize-none font-mono text-sm"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)'
                    }}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={!isValid || isDuplicate}
                    className="px-4 py-2 rounded font-medium transition-opacity"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: '#FFFFFF',
                      opacity: (!isValid || isDuplicate) ? 0.5 : 1,
                      cursor: (!isValid || isDuplicate) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {editingSkill ? 'Update' : 'Save'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 rounded font-medium transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--theme-border)'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skills List (when not creating/editing) */}
          {!isCreating && !editingSkill && (
            <div className="space-y-6">
              {/* Built-in Skills */}
              <section>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: 'var(--theme-text)' }}
                >
                  📌 Built-in Skills (Read-only)
                </h3>
                {filteredBuiltIn.length === 0 ? (
                  <p style={{ color: 'var(--theme-textSecondary)' }}>
                    No built-in skills match your search.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredBuiltIn.map(skill => (
                      <SkillCard key={skill.name} skill={skill} readOnly />
                    ))}
                  </div>
                )}
              </section>

              {/* Custom Skills */}
              <section>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: 'var(--theme-text)' }}
                >
                  ⭐ Your Custom Skills
                </h3>
                {customSkills.length === 0 ? (
                  <p style={{ color: 'var(--theme-textSecondary)' }}>
                    No custom skills yet. Click "+ New Custom Skill" to create your first skill!
                  </p>
                ) : filteredCustom.length === 0 ? (
                  <p style={{ color: 'var(--theme-textSecondary)' }}>
                    No custom skills match your search.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredCustom.map(skill => (
                      <SkillCard
                        key={skill.name}
                        skill={skill}
                        onEdit={() => handleEdit(skill)}
                        onDelete={() => handleDelete(skill)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t px-6 py-3 flex justify-end flex-shrink-0"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-hover)'
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded transition-opacity"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
