import { useEffect, useState, useCallback } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { tauriAPI } from '../../utils/tauri-api';

interface FilePreviewPanelProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
  onExpand: () => void;
}

const TEXT_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'java', 'cpp', 'c', 'cs', 'go', 'rs',
  'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'sh', 'bash',
  'sql', 'env', 'gitignore', 'log', 'config', 'ini', 'toml', 'vue', 'svelte'
];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'];

const LANGUAGE_MAP: Record<string, string> = {
  'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
  'py': 'python', 'rb': 'ruby', 'java': 'java', 'cpp': 'cpp', 'c': 'c',
  'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'php': 'php', 'html': 'html',
  'css': 'css', 'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
  'md': 'markdown', 'sh': 'bash', 'bash': 'bash', 'sql': 'sql',
};

const PANEL_MIN = 100;
const PANEL_MAX = 600;

export function FilePreviewPanel({ filePath, fileName, onClose, onExpand }: FilePreviewPanelProps) {
  const [panelHeight, setPanelHeight] = useState(() => {
    const saved = localStorage.getItem('previewPanelHeight');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [content, setContent] = useState<string>('');
  const [imageData, setImageData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!filePath) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setContent('');
      setImageData('');

      try {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        if (IMAGE_EXTENSIONS.includes(ext)) {
          const base64 = await tauriAPI.readFileAsBase64(filePath);
          const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          setImageData(`data:${mimeType};base64,${base64}`);
          return;
        }

        if (!TEXT_EXTENSIONS.includes(ext)) {
          setError(`Preview not available for .${ext} files.`);
          return;
        }

        const fileContent = await tauriAPI.readFile(filePath);
        if (fileContent.length > 1024 * 1024) {
          const sizeMB = (fileContent.length / (1024 * 1024)).toFixed(1);
          setError(`File too large to preview (${sizeMB} MB).`);
          return;
        }
        setContent(fileContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [filePath, fileName]);

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = IMAGE_EXTENSIONS.includes(ext);
  const language = LANGUAGE_MAP[ext] || 'plaintext';

  let highlightedContent = content;
  if (content && language !== 'plaintext') {
    try {
      highlightedContent = hljs.highlight(content, { language }).value;
    } catch {
      highlightedContent = content;
    }
  }

  return (
    <div className="flex flex-col flex-shrink-0" style={{ height: panelHeight, backgroundColor: 'var(--theme-sidebarBg)' }}>
      {/* Drag handle */}
      <div
        onMouseDown={handleResizeStart}
        className="h-1 flex-shrink-0 cursor-row-resize hover:bg-blue-400 active:bg-blue-500 transition-colors border-t"
        style={{ backgroundColor: 'transparent', borderColor: 'var(--theme-border)' }}
        title="Drag to resize preview"
      />
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold tracking-wide flex-shrink-0" style={{ color: 'var(--theme-textSecondary)' }}>PREVIEW</span>
          <span className="text-xs truncate" style={{ color: 'var(--theme-text)' }} title={fileName}>{fileName}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button
            onClick={onExpand}
            className="px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--theme-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-bg)'; }}
            title="Open in full window"
          >
            <span>⛶</span>
            <span>Expand</span>
          </button>
          <button
            onClick={onClose}
            className="text-sm leading-none hover:opacity-70 transition-opacity"
            style={{ color: 'var(--theme-textSecondary)' }}
            title="Close preview"
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
              onError={() => { setError('Failed to load image'); setImageData(''); }}
            />
          </div>
        )}

        {!isLoading && !error && content && !isImage && (
          <pre className="p-2 text-xs leading-relaxed overflow-x-auto h-full" style={{ margin: 0 }}>
            <code
              className={`hljs language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          </pre>
        )}

        {!isLoading && !error && !content && !imageData && (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--theme-textSecondary)' }}>
            File is empty
          </div>
        )}
      </div>
    </div>
  );
}
