import { useEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  isDirectory: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  isDirectory
}: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  return (
    <div
      className="fixed rounded shadow-lg z-50 py-1 min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: 'var(--theme-bg)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-text)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isDirectory && (
        <>
          <button
            onClick={onCreateFile}
            className="context-menu-item w-full px-4 py-2 text-left text-sm flex items-center gap-2"
          >
            <span>📄</span> New File
          </button>
          <button
            onClick={onCreateFolder}
            className="context-menu-item w-full px-4 py-2 text-left text-sm flex items-center gap-2"
          >
            <span>📁</span> New Folder
          </button>
          <div className="my-1" style={{ borderTop: '1px solid var(--theme-border)' }} />
        </>
      )}
      <button
        onClick={onRename}
        className="context-menu-item w-full px-4 py-2 text-left text-sm flex items-center gap-2"
      >
        <span>✏️</span> Rename
      </button>
      <button
        onClick={onDelete}
        className="context-menu-item w-full px-4 py-2 text-left text-sm flex items-center gap-2"
        style={{ color: '#dc2626' }}
      >
        <span>🗑️</span> Delete
      </button>
    </div>
  );
}
