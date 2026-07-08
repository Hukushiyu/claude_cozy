import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useFileEditor, isImageFile, isPdfFile } from '../../hooks/useFileEditor';
import { getLanguageExtension } from '../../utils/codeMirrorLanguage';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FileEditorPaneProps {
  filePath: string;
  fileName: string;
  onCloseRequest: () => void; // called when user wants to close via toolbar
}

export function FileEditorPane({ filePath, fileName, onCloseRequest }: FileEditorPaneProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { currentTheme } = useSettingsStore();

  const { content, imageData, pdfBlobUrl, isLoading, error, isDirty, setContent, save, discard, isSaving } = useFileEditor(filePath, fileName);

  // Ctrl+S / Cmd+S
  useEffect(() => {
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
  }, [isDirty, save]);

  const handleSave = async () => {
    try {
      setSaveError(null);
      await save();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCloseRequest();
    }
  };

  const isImage = isImageFile(fileName);
  const isPdf = isPdfFile(fileName);
  const languageExt = getLanguageExtension(fileName);
  const isDarkTheme = currentTheme.colors.bg < '#888888';

  const cmTheme = isDarkTheme ? oneDark : EditorView.theme({
    '&': { backgroundColor: '#ffffff', color: '#1f2937', height: '100%' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': { caretColor: 'var(--theme-accent)', minHeight: '100%' },
    '.cm-cursor': { borderLeftColor: 'var(--theme-accent)' },
    '.cm-gutters': { backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', color: '#6b7280' },
    '.cm-activeLineGutter': { backgroundColor: '#f3f4f6' },
    '.cm-activeLine': { backgroundColor: '#f9fafb' },
    '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(139, 115, 85, 0.2)' },
  });

  return (
    <div className="flex flex-col h-full min-h-0" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-sidebarBg)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
            {fileName}
          </span>
          {isDirty && (
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--theme-accent)' }} title="Unsaved changes">
              ●
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {!isImage && !isPdf && (
            <span className="text-xs" style={{ color: 'var(--theme-textSecondary)' }}>
              Ctrl+S to save
            </span>
          )}
          {!isImage && !isPdf && isDirty && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 rounded text-xs font-medium transition-opacity"
              style={{ backgroundColor: 'var(--theme-accent)', color: '#fff', opacity: isSaving ? 0.6 : 1 }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={handleCloseRequest}
            className="ml-1 px-2 py-1 rounded text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-textSecondary)' }}
            title="Close file"
          >
            ✕
          </button>
        </div>
      </div>

      {saveError && (
        <div className="px-4 py-2 text-xs flex-shrink-0" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
          Save failed: {saveError}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--theme-textSecondary)' }}>
            Loading...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <div className="text-sm" style={{ color: '#dc2626' }}>{error}</div>
          </div>
        )}
        {!isLoading && !error && isImage && imageData && (
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--theme-hover)' }}>
            <img
              src={imageData}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        {!isLoading && !error && isPdf && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            title={fileName}
            className="w-full h-full border-0"
            onLoad={() => console.log('[FileEditorPane] PDF iframe loaded:', fileName)}
            onError={() => console.error('[FileEditorPane] PDF iframe failed to load:', fileName)}
          />
        )}
        {!isLoading && !error && !isImage && !isPdf && (
          <CodeMirror
            value={content}
            height="100%"
            extensions={[
              ...(languageExt ? [languageExt] : []),
              EditorView.lineWrapping,
            ]}
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
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard unsaved changes?"
        message="You have unsaved changes. They will be permanently lost if you close this file."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          discard();
          setShowDiscardConfirm(false);
          onCloseRequest();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
}
