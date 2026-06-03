import { useEffect, useRef } from 'react';
import { Suggestion } from '../../types/chat';

interface AutocompleteDropdownProps {
  suggestions: Suggestion[];
  activeIndex: number;
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
  position: { top: number; left: number };
  type: 'command' | 'file';
}

export function AutocompleteDropdown({
  suggestions,
  activeIndex,
  onSelect,
  onClose,
  position,
  type
}: AutocompleteDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (dropdownRef.current) {
      const activeItem = dropdownRef.current.children[0]?.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-50"
      style={{
        bottom: `${window.innerHeight - position.top + 4}px`, // 4px gap above cursor
        left: position.left,
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      {suggestions.length === 0 ? (
        <div className="px-4 py-3 text-gray-500 text-sm">
          No {type === 'command' ? 'commands' : 'files'} found
        </div>
      ) : (
        <div>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.type === 'command' ? suggestion.name : suggestion.relativePath}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === activeIndex
                  ? 'bg-blue-100 border-l-2 border-blue-500'
                  : 'hover:bg-blue-50'
              }`}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => {
                // Mouse hover updates active index
                const event = new CustomEvent('autocomplete-hover', { detail: index });
                window.dispatchEvent(event);
              }}
            >
              {type === 'command' && suggestion.type === 'command' ? (
                <div className="flex flex-col gap-1">
                  {/* Icon + Name + Badge Row */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                    <span className="font-semibold text-sm truncate">{suggestion.name}</span>
                    {suggestion.commandType === 'skill' && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: '#fff',
                          opacity: 0.85
                        }}
                      >
                        SKILL
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-xs text-gray-600 truncate pl-7">
                    {suggestion.description}
                  </div>

                  {/* Usage (Skills Only) */}
                  {suggestion.commandType === 'skill' && suggestion.usage && (
                    <div className="text-xs font-mono text-gray-500 truncate pl-7 mt-0.5">
                      {suggestion.usage}
                    </div>
                  )}
                </div>
              ) : suggestion.type === 'file' ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{suggestion.name}</div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      {suggestion.relativePath}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
