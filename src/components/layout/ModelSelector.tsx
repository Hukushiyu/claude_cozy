import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

const MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6', description: 'Balanced - Recommended' },
  { id: 'claude-opus-4-7', name: 'Opus 4.7', description: 'Most capable' },
  { id: 'claude-haiku-4-5', name: 'Haiku 4.5', description: 'Fastest' },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId); // This updates localStorage via the store
    setIsOpen(false);

    // Show brief "changed" indicator
    setJustChanged(true);
    setTimeout(() => setJustChanged(false), 2000);

    // No backend call needed - model is passed to sendMessage() in chatStore
  };

  return (
    <div className="relative app-no-drag" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border"
        style={{
          backgroundColor: justChanged ? 'rgba(34, 197, 94, 0.1)' : 'var(--theme-bg)',
          borderColor: justChanged ? 'rgb(34, 197, 94)' : 'var(--theme-border)',
          color: 'var(--theme-text)'
        }}
        onMouseEnter={(e) => {
          if (!justChanged) {
            e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (!justChanged) {
            e.currentTarget.style.backgroundColor = 'var(--theme-bg)';
          }
        }}
        title="Select Claude model"
      >
        <span className="text-xs font-medium">
          🤖 {currentModel.name}
          {justChanged && <span className="ml-1 text-green-600">✓</span>}
        </span>
        <span className="text-xs" style={{ opacity: 0.6 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 rounded-lg shadow-xl border overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
            minWidth: '200px'
          }}
        >
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model.id)}
              className="w-full px-4 py-3 text-left transition-colors border-b last:border-b-0"
              style={{
                backgroundColor: selectedModel === model.id ? 'var(--theme-accent)' : 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: selectedModel === model.id ? 'white' : 'var(--theme-text)'
              }}
              onMouseEnter={(e) => {
                if (selectedModel !== model.id) {
                  e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModel !== model.id) {
                  e.currentTarget.style.backgroundColor = 'var(--theme-bg)';
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{model.name}</span>
                {selectedModel === model.id && (
                  <span className="text-xs">✓</span>
                )}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{
                  opacity: selectedModel === model.id ? 0.9 : 0.7
                }}
              >
                {model.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
