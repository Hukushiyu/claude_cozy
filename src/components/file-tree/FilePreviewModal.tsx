import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useFileEditor, isImageFile, isTextFile } from '../../hooks/useFileEditor';
import { getLanguageExtension } from '../../utils/codeMirrorLanguage';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
}

export function FilePreviewModal({ isOpen, onClose, filePath, fileName }: FilePreviewModalProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | null>(null);
  const { currentTheme } = useSettingsStore();

  const { content, imageData, isLoading, error, isDirty, setContent, save, discard, isSaving } = useFileEditor(
    isOpen ? filePath : '',
    fileName
  );

  // Escape key — route through confirm if dirty
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isDirty) {
          setPendingAction('close');
          setShowDiscardConfirm(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isDirty]);

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) {
          try {
            setSaveError(null);
            await save();
          } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, save]);

  if (!isOpen) return null;

  const handleCloseRequest = () => {
    if (isDirty) {
      setPendingAction('close');
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirmed = () => {
    discard();
    setShowDiscardConfirm(false);
    if (pendingAction === 'close') onClose();
    setPendingAction(null);
  };

  const handleDiscardCancelled = () => {
    setShowDiscardConfirm(false);
    setPendingAction(null);
  };

  const handleSave = async () => {
    try {
      setSaveError(null);
      await save();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = isImageFile(fileName);
  const isText = isTextFile(fileName);
  const languageExt = getLanguageExtension(fileName);

  const isDarkTheme = currentTheme.colors.bg < '#888888';
  const cmTheme = isDarkTheme ? oneDark : EditorView.theme({
    '&': { backgroundColor: '#ffffff', color: '#1f2937' },
    '.cm-content': { caretColor: 'var(--theme-accent)' },
    '.cm-cursor': { borderLeftColor: 'var(--theme-accent)' },
    '.cm-gutters': { backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', color: '#6b7280' },
    '.cm-activeLineGutter': { backgroundColor: '#f3f4f6' },
    '.cm-activeLine': { backgroundColor: '#f9fafb' },
    '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(139, 115, 85, 0.2)' },
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseRequest}>
        <div
          className="rounded-lg shadow-2xl w-[90%] h-[85vh] overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--theme-bg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex justify-between items-center flex-shrink-0"
            style={{ backgroundColor: 'var(--theme-accent)', color: '#fff' }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold truncate">{fileName}</h2>
                {isDirty && (
                  <span className="text-white/80 text-sm flex-shrink-0" title="Unsaved changes">●</span>
                )}
              </div>
              <p className="text-sm text-white/70 mt-1 truncate max-w-2xl">{filePath}</p>
            </div>
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              {isDirty && isText && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded text-sm font-medium transition-opacity"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', opacity: isSaving ? 0.6 : 1 }}
                  title="Save file (Ctrl+S)"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
              <button
                onClick={handleCloseRequest}
                className="text-white/80 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {saveError && (
            <div className="px-6 py-2 text-sm flex-shrink-0" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              Save failed: {saveError}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {isLoading && (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--theme-textSecondary)' }}>
                Loading file...
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-lg mb-2" style={{ color: '#dc2626' }}>⚠️ Error Loading File</div>
                  <div style={{ color: 'var(--theme-textSecondary)' }}>{error}</div>
                </div>
              </div>
            )}

            {!isLoading && !error && isImage && imageData && (
              <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--theme-hover)' }}>
                <img src={imageData} alt={fileName} className="max-w-full max-h-full object-contain" />
              </div>
            )}

            {!isLoading && !error && isText && (
              <CodeMirror
                value={content}
                height="100%"
                extensions={[...(languageExt ? [languageExt] : []), EditorView.lineWrapping]}
                theme={cmTheme}
                onChange={setContent}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  indentOnInput: true,
                }}
                style={{ height: '100%', fontSize: '13px' }}
              />
            )}

            {!isLoading && !error && !content && !imageData && (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--theme-textSecondary)' }}>
                File is empty
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="border-t px-6 py-3 flex justify-between items-center flex-shrink-0"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-hover)' }}
          >
            <div className="text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
              {isImage ? `Image · ${ext.toUpperCase()}` : content ? `${content.split('\n').length} lines · ${content.length} bytes${isDirty ? ' · Unsaved changes' : ''}` : ''}
            </div>
            <button
              onClick={handleCloseRequest}
              className="px-4 py-2 rounded transition-opacity text-white"
              style={{ backgroundColor: 'var(--theme-accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard unsaved changes?"
        message="You have unsaved changes to this file. They will be permanently lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={handleDiscardConfirmed}
        onCancel={handleDiscardCancelled}
      />
    </>
  );
}
