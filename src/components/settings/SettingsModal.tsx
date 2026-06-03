import { useEffect, useState } from 'react';
import { useSettingsStore, themes } from '../../stores/settingsStore';
import { Theme, ThemeColors } from '../../types/theme';
import { ThemeEditor } from './ThemeEditor';
import { ThemeImportExport } from './ThemeImportExport';
import { UpdateChecker } from './UpdateChecker';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'themes' | 'personalization' | 'updates';
type ThemeView = 'list' | 'editor';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    currentTheme,
    assistantName,
    customThemes,
    setTheme,
    setAssistantName,
    saveCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    getAllThemes,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>('themes');
  const [themeView, setThemeView] = useState<ThemeView>('list');
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [nameInput, setNameInput] = useState(assistantName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Sync input with store when modal opens
    setNameInput(assistantName);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (themeView === 'editor') {
          setThemeView('list');
          setEditingTheme(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, assistantName, themeView]);

  const handleSaveName = () => {
    setAssistantName(nameInput);
  };

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setThemeView('editor');
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setThemeView('editor');
  };

  const handleDeleteTheme = (themeId: string) => {
    const success = deleteCustomTheme(themeId);
    if (success) {
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveTheme = (name: string, colors: ThemeColors) => {
    if (editingTheme) {
      // Updating existing theme
      const success = updateCustomTheme(editingTheme.id, { name, colors });
      if (success) {
        setThemeView('list');
        setEditingTheme(null);
        // Auto-close after successful edit so user sees changes in full UI
        onClose();
      }
    } else {
      // Creating new theme
      const newId = saveCustomTheme({ name, colors });
      if (newId) {
        setThemeView('list');
        // Switch to the new theme
        setTheme(newId);
        // Auto-close after successful creation so user sees their theme in full UI
        onClose();
      }
    }
  };

  const handleCancelEditor = () => {
    setThemeView('list');
    setEditingTheme(null);
  };

  const isCustomTheme = (themeId: string) => {
    return customThemes.some(t => t.id === themeId);
  };

  if (!isOpen) return null;

  const allThemes = getAllThemes();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-lg shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--theme-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center flex-shrink-0"
          style={{ backgroundColor: 'var(--theme-accent)', color: '#FFFFFF' }}
        >
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        {themeView === 'list' && (
          <div
            className="flex border-b"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <button
              onClick={() => setActiveTab('themes')}
              className="px-6 py-3 font-medium transition-colors relative"
              style={{
                color: activeTab === 'themes' ? 'var(--theme-accent)' : 'var(--theme-textSecondary)',
                backgroundColor: activeTab === 'themes' ? 'var(--theme-hover)' : 'transparent',
              }}
            >
              Themes
              {activeTab === 'themes' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('personalization')}
              className="px-6 py-3 font-medium transition-colors relative"
              style={{
                color: activeTab === 'personalization' ? 'var(--theme-accent)' : 'var(--theme-textSecondary)',
                backgroundColor: activeTab === 'personalization' ? 'var(--theme-hover)' : 'transparent',
              }}
            >
              Personalization
              {activeTab === 'personalization' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className="px-6 py-3 font-medium transition-colors relative"
              style={{
                color: activeTab === 'updates' ? 'var(--theme-accent)' : 'var(--theme-textSecondary)',
                backgroundColor: activeTab === 'updates' ? 'var(--theme-hover)' : 'transparent',
              }}
            >
              Updates
              {activeTab === 'updates' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                />
              )}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Themes Tab - List View */}
          {activeTab === 'themes' && themeView === 'list' && (
            <div>
              {/* Create Theme Button */}
              <button
                onClick={handleCreateTheme}
                className="w-full mb-6 px-4 py-3 rounded-lg border-2 border-dashed transition-all hover:scale-[1.02]"
                style={{
                  borderColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent)',
                  backgroundColor: 'transparent',
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">+</span>
                  <span className="font-medium">Create Custom Theme</span>
                </div>
              </button>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {allThemes.map((theme) => {
                  const isBuiltIn = !isCustomTheme(theme.id);
                  const isActive = currentTheme.id === theme.id;

                  return (
                    <div key={theme.id} className="relative">
                      <button
                        onClick={() => setTheme(theme.id)}
                        className="w-full p-4 rounded-lg border-2 transition-all hover:scale-105"
                        style={{
                          borderColor: isActive ? 'var(--theme-accent)' : 'var(--theme-border)',
                          backgroundColor: isActive ? 'var(--theme-hover)' : 'transparent'
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                              {theme.name}
                            </span>
                            {isBuiltIn && (
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: 'var(--theme-accent)',
                                  color: '#FFFFFF',
                                }}
                              >
                                Built-in
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <span style={{ color: 'var(--theme-accent)' }}>✓</span>
                          )}
                        </div>

                        {/* Color swatches */}
                        <div className="flex gap-2">
                          <div
                            className="w-8 h-8 rounded border"
                            style={{
                              backgroundColor: theme.colors.bg,
                              borderColor: 'var(--theme-border)'
                            }}
                            title="Background"
                          />
                          <div
                            className="w-8 h-8 rounded border"
                            style={{
                              backgroundColor: theme.colors.accent,
                              borderColor: 'var(--theme-border)'
                            }}
                            title="Accent"
                          />
                          <div
                            className="w-8 h-8 rounded border"
                            style={{
                              backgroundColor: theme.colors.userBubble,
                              borderColor: 'var(--theme-border)'
                            }}
                            title="User bubble"
                          />
                          <div
                            className="w-8 h-8 rounded border"
                            style={{
                              backgroundColor: theme.colors.assistantBubble,
                              borderColor: 'var(--theme-border)'
                            }}
                            title="Assistant bubble"
                          />
                        </div>
                      </button>

                      {/* Edit/Delete buttons for custom themes */}
                      {!isBuiltIn && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTheme(theme);
                            }}
                            className="p-1.5 rounded transition-opacity"
                            style={{
                              backgroundColor: 'var(--theme-bg)',
                              color: 'var(--theme-text)',
                              border: `1px solid var(--theme-border)`,
                            }}
                            title="Edit theme"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(theme.id);
                            }}
                            className="p-1.5 rounded transition-opacity"
                            style={{
                              backgroundColor: 'var(--theme-bg)',
                              color: '#DC2626',
                              border: `1px solid var(--theme-border)`,
                            }}
                            title="Delete theme"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Import/Export Section */}
              <div
                className="pt-6 border-t"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
                  Import / Export
                </h4>
                <ThemeImportExport
                  onImport={importTheme}
                  onExport={exportTheme}
                  currentThemeId={currentTheme.id}
                />
              </div>
            </div>
          )}

          {/* Themes Tab - Editor View */}
          {activeTab === 'themes' && themeView === 'editor' && (
            <ThemeEditor
              theme={editingTheme || undefined}
              onSave={handleSaveTheme}
              onCancel={handleCancelEditor}
            />
          )}

          {/* Personalization Tab */}
          {activeTab === 'personalization' && (
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
                Assistant Name
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-textSecondary)' }}>
                Customize what you call your AI assistant
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Claude"
                  maxLength={30}
                  className="flex-1 px-4 py-2 rounded border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveName();
                    }
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 rounded font-medium transition-opacity"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
                  }}
                >
                  Save
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--theme-textSecondary)' }}>
                Current: <span className="font-medium" style={{ color: 'var(--theme-text)' }}>{assistantName}</span>
              </p>
            </div>
          )}

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div>
              <UpdateChecker />
            </div>
          )}
        </div>

        {/* Footer (only show in list view) */}
        {themeView === 'list' && (
          <div
            className="border-t px-6 py-3 flex justify-end items-center flex-shrink-0"
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
                e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <div
              className="rounded-lg shadow-2xl w-[400px] p-6"
              style={{ backgroundColor: 'var(--theme-bg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
                Delete Theme?
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--theme-textSecondary)' }}>
                This action cannot be undone. The theme will be permanently deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 rounded transition-opacity"
                  style={{
                    backgroundColor: 'var(--theme-hover)',
                    color: 'var(--theme-text)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTheme(showDeleteConfirm)}
                  className="px-4 py-2 rounded font-medium transition-opacity"
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
