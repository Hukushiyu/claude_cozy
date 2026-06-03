import { useState, useEffect } from 'react';
import { Theme, ThemeColors } from '../../types/theme';
import { ThemePreview } from './ThemePreview';

interface ThemeEditorProps {
  theme?: Theme; // If provided, editing existing theme
  onSave: (name: string, colors: ThemeColors) => void;
  onCancel: () => void;
}

interface ColorField {
  key: keyof ThemeColors;
  label: string;
  description: string;
}

const COLOR_FIELDS: ColorField[] = [
  { key: 'bg', label: 'Background', description: 'Main app background' },
  { key: 'sidebarBg', label: 'Sidebar Background', description: 'File tree background' },
  { key: 'text', label: 'Text', description: 'Primary text, button labels, dropdown text' },
  { key: 'textSecondary', label: 'Secondary Text', description: 'Token counter, descriptions, subtle text' },
  { key: 'accent', label: 'Primary Buttons', description: 'Settings & Help buttons, selected dropdown items' },
  { key: 'accentHover', label: 'Primary Hover', description: 'Hover state for primary buttons' },
  { key: 'border', label: 'Borders & Secondary', description: 'Dropdown borders, secondary button outlines' },
  { key: 'hover', label: 'Secondary Hover', description: 'Hover for dropdowns & secondary buttons' },
  { key: 'userBubble', label: 'User Message', description: 'Your message bubble background' },
  { key: 'assistantBubble', label: 'Assistant Message', description: 'AI message bubble background' },
];

export function ThemeEditor({ theme, onSave, onCancel }: ThemeEditorProps) {
  const [name, setName] = useState(theme?.name || '');
  const [colors, setColors] = useState<ThemeColors>(
    theme?.colors || {
      bg: '#F5F1EB',
      sidebarBg: '#E8E3D6',
      text: '#2D2D2D',
      textSecondary: '#666666',
      accent: '#8B7355',
      accentHover: '#6F5D47',
      border: '#D1C7B7',
      hover: '#DDD8CC',
      userBubble: '#FFFFFF',
      assistantBubble: '#F0EBE3',
    }
  );

  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Theme name is required');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Theme name must be 30 characters or less');
      return;
    }

    setError('');
    onSave(trimmedName, colors);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>
          {theme ? 'Edit Theme' : 'Create Custom Theme'}
        </h3>
        <p className="text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
          Pick colors for each UI element
        </p>
      </div>

      {/* Theme Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
          Theme Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="My Custom Theme"
          maxLength={30}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: error ? '#DC2626' : 'var(--theme-border)',
            color: 'var(--theme-text)',
          }}
          autoFocus
        />
        {error && (
          <p className="text-xs mt-1" style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto mb-4">
        {/* Color Pickers */}
        <div className="space-y-3 mb-6">
          {COLOR_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                  {field.label}
                </label>
                <p className="text-xs" style={{ color: 'var(--theme-textSecondary)' }}>
                  {field.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-2"
                  style={{ borderColor: 'var(--theme-border)' }}
                  title={`Pick ${field.label} color`}
                />
                <input
                  type="text"
                  value={colors[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value.toUpperCase())}
                  className="w-24 px-2 py-1 rounded border text-sm font-mono focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Live Preview */}
        <ThemePreview colors={colors} />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded transition-opacity"
          style={{
            backgroundColor: 'var(--theme-hover)',
            color: 'var(--theme-text)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded font-medium transition-opacity"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: '#FFFFFF',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
          }}
        >
          {theme ? 'Save Changes' : 'Create Theme'}
        </button>
      </div>
    </div>
  );
}
