interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Discard',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
      onClick={onCancel}
    >
      <div
        className="rounded-lg shadow-2xl w-[380px] p-6"
        style={{ backgroundColor: 'var(--theme-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-textSecondary)' }}>
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm transition-opacity"
            style={{ backgroundColor: 'var(--theme-hover)', color: 'var(--theme-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded text-sm font-medium transition-opacity text-white"
            style={{ backgroundColor: danger ? '#dc2626' : 'var(--theme-accent)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
