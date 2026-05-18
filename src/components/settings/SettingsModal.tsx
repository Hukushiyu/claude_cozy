import { useEffect, useState } from 'react';
import { useSettingsStore, themes } from '../../stores/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentTheme, assistantName, setTheme, setAssistantName } = useSettingsStore();
  const [nameInput, setNameInput] = useState(assistantName);

  useEffect(() => {
    if (!isOpen) return;

    // Sync input with store when modal opens
    setNameInput(assistantName);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, assistantName]);

  const handleSaveName = () => {
    setAssistantName(nameInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-lg shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Assistant Name Section */}
          <div className="mb-8">
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

          {/* Theme Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
              Theme
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--theme-textSecondary)' }}>
              Choose a color scheme for the app
            </p>

            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className="p-4 rounded-lg border-2 transition-all hover:scale-105"
                  style={{
                    borderColor: currentTheme.id === theme.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                    backgroundColor: currentTheme.id === theme.id ? 'var(--theme-hover)' : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                      {theme.name}
                    </span>
                    {currentTheme.id === theme.id && (
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
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
      </div>
    </div>
  );
}
