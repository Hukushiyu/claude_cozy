import { useEffect } from 'react';

interface TabContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onChangeProject: () => void;
  onCloseTab: () => void;
  onCloseOtherTabs: () => void;
  isOnlyTab: boolean;
}

export function TabContextMenu({
  x,
  y,
  onClose,
  onChangeProject,
  onCloseTab,
  onCloseOtherTabs,
  isOnlyTab
}: TabContextMenuProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Menu */}
      <div
        className="fixed z-50 rounded-lg shadow-xl border py-1 min-w-48"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          backgroundColor: 'var(--theme-bg)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <button
          onClick={() => {
            onChangeProject();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
          style={{ color: 'var(--theme-text)' }}
        >
          <span>📁</span>
          <span>Change Project</span>
        </button>

        <div className="h-px my-1" style={{ backgroundColor: 'var(--theme-border)' }} />

        <button
          onClick={() => {
            onCloseTab();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
          style={{ color: 'var(--theme-text)' }}
        >
          <span>×</span>
          <span>Close Tab</span>
        </button>

        <button
          onClick={() => {
            onCloseOtherTabs();
            onClose();
          }}
          disabled={isOnlyTab}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: isOnlyTab ? 'var(--theme-textSecondary)' : 'var(--theme-text)' }}
        >
          <span>⊗</span>
          <span>Close Other Tabs</span>
        </button>
      </div>
    </>
  );
}
