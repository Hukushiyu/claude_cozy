import { useEffect, useRef } from 'react';
import { StructuredRow } from '../../types/chat';

interface AutocompleteDropdownProps {
  rows: StructuredRow[];
  activeIndex: number;
  onSelect: (row: StructuredRow) => void;
  onClose: () => void;
  position: { top: number; left: number };
  type: 'command' | 'file';
}

export function AutocompleteDropdown({
  rows,
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

  // Scroll active focusable row into view
  useEffect(() => {
    if (dropdownRef.current) {
      const el = dropdownRef.current.querySelector(`[data-focus-index="${activeIndex}"]`) as HTMLElement;
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  // File suggestions pass-through (rows contains flat-command wrappers for files)
  if (type === 'file') {
    return (
      <div
        ref={dropdownRef}
        className="fixed border rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-50"
        style={{
          bottom: `${window.innerHeight - position.top + 4}px`,
          left: position.left,
          minWidth: '300px',
          maxWidth: '500px',
          backgroundColor: 'var(--theme-bg)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {rows.length === 0 ? (
          <div className="px-4 py-3 text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
            No files found
          </div>
        ) : (
          <div>
            {rows.map((row, index) => {
              if (row.kind !== 'flat-command') return null;
              const s = row.suggestion;
              if (s.type !== 'file') return null;
              return (
                <div
                  key={s.relativePath}
                  data-focus-index={index}
                  className="px-4 py-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: index === activeIndex ? 'var(--theme-hover)' : 'transparent',
                    borderLeft: index === activeIndex ? '2px solid var(--theme-accent)' : '2px solid transparent',
                  }}
                  onClick={() => onSelect(row)}
                  onMouseEnter={() => {
                    window.dispatchEvent(new CustomEvent('autocomplete-hover', { detail: index }));
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>{s.name}</div>
                      <div className="text-xs font-mono truncate" style={{ color: 'var(--theme-textSecondary)' }}>
                        {s.relativePath}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Command suggestions (plugin-aware)
  return (
    <div
      ref={dropdownRef}
      className="fixed border rounded-lg shadow-lg max-h-[400px] overflow-y-auto z-50"
      style={{
        bottom: `${window.innerHeight - position.top + 4}px`,
        left: position.left,
        minWidth: '320px',
        maxWidth: '520px',
        backgroundColor: 'var(--theme-bg)',
        borderColor: 'var(--theme-border)',
      }}
    >
      {rows.length === 0 ? (
        <div className="px-4 py-3 text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
          No commands found
        </div>
      ) : (
        <div>
          {rows.map((row, index) => {
            if (row.kind === 'plugin-header') {
              return (
                <div
                  key={`plugin-${row.pluginName}-${row.commandName}`}
                  data-focus-index={index}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: index === activeIndex ? 'var(--theme-hover)' : 'transparent',
                    borderLeft: index === activeIndex ? '2px solid var(--theme-accent)' : '2px solid transparent',
                  }}
                  onClick={() => onSelect(row)}
                  onMouseEnter={() => {
                    window.dispatchEvent(new CustomEvent('autocomplete-hover', { detail: index }));
                  }}
                >
                  {/* Plugin header row */}
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">🔌</span>
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--theme-text)' }}>
                        {row.commandName}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: '#fff',
                          opacity: 0.85
                        }}
                      >
                        PLUGIN
                      </span>
                    </div>
                    {row.description && (
                      <div className="text-xs truncate pl-7 mt-0.5" style={{ color: 'var(--theme-textSecondary)' }}>
                        {row.description}
                      </div>
                    )}
                  </div>

                  {/* Skill sub-rows — always visible under plugin header */}
                  {row.skills.length > 0 && (
                    <div
                      className="border-t"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      {row.skills.map((skill) => {
                        // Find the global focus index for this skill sub-row
                        const skillRowIndex = rows.findIndex(
                          r => r.kind === 'skill-row' && r.name === skill.name && r.parentPlugin === row.pluginName
                        );
                        const isSkillActive = skillRowIndex !== -1 && skillRowIndex === activeIndex;
                        return (
                          <div
                            key={`skill-${skill.name}`}
                            data-focus-index={skillRowIndex !== -1 ? skillRowIndex : undefined}
                            className="px-4 py-1.5 cursor-pointer transition-colors"
                            style={{
                              paddingLeft: '2.5rem',
                              backgroundColor: isSkillActive ? 'var(--theme-hover)' : 'transparent',
                              borderLeft: isSkillActive ? '2px solid var(--theme-accent)' : '2px solid transparent',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const skillRow = rows.find(
                                r => r.kind === 'skill-row' && r.name === skill.name && r.parentPlugin === row.pluginName
                              );
                              if (skillRow) onSelect(skillRow);
                            }}
                            onMouseEnter={() => {
                              if (skillRowIndex !== -1) {
                                window.dispatchEvent(new CustomEvent('autocomplete-hover', { detail: skillRowIndex }));
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--theme-textSecondary)' }}>└</span>
                              <span className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>
                                {skill.name}
                              </span>
                            </div>
                            {skill.description && (
                              <div className="text-xs truncate mt-0.5" style={{ paddingLeft: '1.25rem', color: 'var(--theme-textSecondary)' }}>
                                {skill.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (row.kind === 'skill-row') {
              // Skill sub-rows are rendered inside plugin-header above; skip standalone render
              return null;
            }

            if (row.kind === 'flat-command') {
              const s = row.suggestion;
              if (s.type !== 'command') return null;
              const badgeLabel = s.commandType === 'skill' ? 'SKILL' : s.commandType === 'builtin' ? 'BUILTIN' : null;
              return (
                <div
                  key={`cmd-${s.name}`}
                  data-focus-index={index}
                  className="px-4 py-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: index === activeIndex ? 'var(--theme-hover)' : 'transparent',
                    borderLeft: index === activeIndex ? '2px solid var(--theme-accent)' : '2px solid transparent',
                  }}
                  onClick={() => onSelect(row)}
                  onMouseEnter={() => {
                    window.dispatchEvent(new CustomEvent('autocomplete-hover', { detail: index }));
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{s.icon}</span>
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--theme-text)' }}>
                        {s.name}
                      </span>
                      {badgeLabel && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                          style={{
                            backgroundColor: 'var(--theme-accent)',
                            color: '#fff',
                            opacity: 0.85
                          }}
                        >
                          {badgeLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs truncate pl-7" style={{ color: 'var(--theme-textSecondary)' }}>
                      {s.description}
                    </div>
                    {s.commandType === 'skill' && s.usage && (
                      <div className="text-xs font-mono truncate pl-7" style={{ color: 'var(--theme-textSecondary)', opacity: 0.75 }}>
                        {s.usage}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
