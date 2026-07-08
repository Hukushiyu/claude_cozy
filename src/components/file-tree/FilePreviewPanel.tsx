import { useCallback, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useFileEditor, isImageFile, isTextFile, isPdfFile } from '../../hooks/useFileEditor';
import { getLanguageExtension } from '../../utils/codeMirrorLanguage';
import { useSettingsStore } from '../../stores/settingsStore';

interface FilePreviewPanelProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
  onExpand: () => void;
}

const PANEL_MIN = 100;
const PANEL_MAX = 600;

export function FilePreviewPanel({ filePath, fileName, onClose, onExpand }: FilePreviewPanelProps) {
  const [panelHeight, setPanelHeight] = useState(() => {
    const saved = localStorage.getItem('previewPanelHeight');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [isClosing, setIsClosing] = useState(false);
  const { currentTheme } = useSettingsStore();

  const animateClose = (callback?: () => void) => {
    if (callback) callback(); // fire immediately (e.g. open editor tab)
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 500);
  };

  const { content, imageData, pdfBlobUrl, isLoading, error } = useFileEditor(filePath, fileName);

  useEffect(() => {
    localStorage.setItem('previewPanelHeight', String(panelHeight));
  }, [panelHeight]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = panelHeight;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      setPanelHeight(Math.min(PANEL_MAX, Math.max(PANEL_MIN, startHeight + delta)));
    };
    const onMouseUp = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      setPanelHeight(Math.min(PANEL_MAX, Math.max(PANEL_MIN, startHeight + delta)));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [panelHeight]);

  const isImage = isImageFile(fileName);
  const isText = isTextFile(fileName);
  const isPdf = isPdfFile(fileName);
  const languageExt = getLanguageExtension(fileName);

  // Use dark theme when app theme is dark-ish (bg is dark)
  const isDarkTheme = currentTheme.colors.bg < '#888888';
  const cmTheme = isDarkTheme ? oneDark : EditorView.theme({
    '&': { backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' },
    '.cm-content': { caretColor: 'var(--theme-accent)' },
    '.cm-cursor': { borderLeftColor: 'var(--theme-accent)' },
    '.cm-gutters': { backgroundColor: 'var(--theme-sidebarBg)', borderRight: '1px solid var(--theme-border)', color: 'var(--theme-textSecondary)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--theme-hover)' },
    '.cm-activeLine': { backgroundColor: 'var(--theme-hover)' },
    '.cm-selectionBackground, ::selection': { backgroundColor: 'var(--theme-accent)33' },
  });

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        height: panelHeight,
        backgroundColor: 'var(--theme-sidebarBg)',
        transform: isClosing ? 'translateX(-100%)' : 'translateX(0)',
        transition: isClosing ? 'transform 0.5s ease-in-out' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleResizeStart}
        className="h-1 flex-shrink-0 cursor-row-resize hover:bg-blue-400 active:bg-blue-500 transition-colors border-t"
        style={{ backgroundColor: 'transparent', borderColor: 'var(--theme-border)' }}
        title="Drag to resize"
      />

      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold tracking-wide flex-shrink-0" style={{ color: 'var(--theme-textSecondary)' }}>
            PREVIEW
          </span>
          <span className="text-xs truncate" style={{ color: 'var(--theme-text)' }} title={fileName}>
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button
            onClick={() => animateClose(onExpand)}
            className="px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-bg)'; }}
            title={isText ? 'Open in editor tab' : 'Expand view'}
          >
            {isText ? 'Edit' : 'Expand'}
          </button>
          <button
            onClick={() => animateClose()}
            className="text-sm leading-none hover:opacity-70 transition-opacity"
            style={{ color: 'var(--theme-textSecondary)' }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--theme-textSecondary)' }}>
            Loading...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full p-3 text-center">
            <div className="text-xs" style={{ color: 'var(--theme-textSecondary)' }}>{error}</div>
          </div>
        )}

        {!isLoading && !error && isImage && imageData && (
          <div className="flex items-center justify-center h-full p-2" style={{ backgroundColor: 'var(--theme-hover)' }}>
            <img
              src={imageData}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {!isLoading && !error && isText && (
          <CodeMirror
            value={content}
            height="100%"
            extensions={[
              ...(languageExt ? [languageExt] : []),
              EditorView.lineWrapping,
            ]}
            theme={cmTheme}
            editable={false}
            readOnly={true}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              bracketMatching: true,
              closeBrackets: false,
              autocompletion: false,
              indentOnInput: false,
            }}
            style={{ height: '100%', fontSize: '12px' }}
          />
        )}

        {!isLoading && !error && isPdf && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            title={fileName}
            className="w-full h-full border-0"
            onLoad={() => console.log('[FilePreviewPanel] PDF iframe loaded:', fileName)}
            onError={() => console.error('[FilePreviewPanel] PDF iframe failed to load:', fileName)}
          />
        )}

        {!isLoading && !error && !content && !imageData && !pdfBlobUrl && (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--theme-textSecondary)' }}>
            File is empty
          </div>
        )}
      </div>
    </div>
  );
}
