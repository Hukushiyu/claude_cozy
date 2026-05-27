import { useState, useEffect, useRef } from 'react';
import type { PermissionMode } from '../../types/permissions';
import { PERMISSION_MODE_DISPLAYS } from '../../types/permissions';

export function PermissionStatusButton() {
  const [permissionMode, setPermissionModeState] = useState<PermissionMode>(
    (localStorage.getItem('permissionMode') as PermissionMode) || 'acceptEdits'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setPermissionMode = (mode: PermissionMode) => {
    setPermissionModeState(mode);
    localStorage.setItem('permissionMode', mode);
    console.log('[PermissionStatusButton] Permission mode set to:', mode);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentDisplay = PERMISSION_MODE_DISPLAYS[permissionMode];

  // Color mapping based on mode
  const getColorStyle = (mode: PermissionMode) => {
    const colorMap = {
      default: { bg: 'rgba(156, 163, 175, 0.1)', border: 'rgb(156, 163, 175)', text: 'rgb(107, 114, 128)' },
      acceptEdits: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)', text: 'rgb(29, 78, 216)' },
      bypassPermissions: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgb(245, 158, 11)', text: 'rgb(180, 83, 9)' },
      plan: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgb(168, 85, 247)', text: 'rgb(126, 34, 206)' },
      auto: { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgb(20, 184, 166)', text: 'rgb(13, 148, 136)' },
      dontAsk: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)', text: 'rgb(185, 28, 28)' },
    };
    return colorMap[mode];
  };

  const currentColor = getColorStyle(permissionMode);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium"
        style={{
          backgroundColor: currentColor.bg,
          borderColor: currentColor.border,
          color: currentColor.text
        }}
        title={currentDisplay.description}
      >
        <span className="text-sm">{currentDisplay.icon}</span>
        <span>{currentDisplay.text}</span>
        <svg
          className="w-3 h-3 ml-1 transition-transform"
          style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg border shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="py-1">
            {(Object.keys(PERMISSION_MODE_DISPLAYS) as PermissionMode[]).map((mode) => {
              const display = PERMISSION_MODE_DISPLAYS[mode];
              const isSelected = permissionMode === mode;
              const modeColor = getColorStyle(mode);

              return (
                <button
                  key={mode}
                  onClick={() => setPermissionMode(mode)}
                  className="w-full px-4 py-2.5 text-left transition-all flex items-start gap-3"
                  style={{
                    backgroundColor: isSelected ? 'var(--theme-hover)' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${modeColor.border}` : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span className="text-lg flex-shrink-0">{display.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>
                        {display.text}
                      </span>
                      {isSelected && (
                        <span className="text-xs" style={{ color: modeColor.border }}>✓</span>
                      )}
                    </div>
                    <p className="text-xs leading-tight" style={{ color: 'var(--theme-textSecondary)' }}>
                      {display.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
