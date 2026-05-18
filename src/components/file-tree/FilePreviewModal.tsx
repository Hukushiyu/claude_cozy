import { useEffect, useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { tauriAPI } from '../../utils/tauri-api';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
}

export function FilePreviewModal({ isOpen, onClose, filePath, fileName }: FilePreviewModalProps) {
  const [content, setContent] = useState<string>('');
  const [imageData, setImageData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !filePath) return;

    const loadFileContent = async () => {
      setIsLoading(true);
      setError(null);
      setContent('');
      setImageData('');

      try {
        // Get extension from filename
        const extension = fileName.split('.').pop()?.toLowerCase() || '';

        // Define allowed text extensions
        const textExtensions = [
          'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'java', 'cpp', 'c', 'cs', 'go', 'rs',
          'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'sh', 'bash',
          'sql', 'env', 'gitignore', 'log', 'config', 'ini', 'toml', 'vue', 'svelte'
        ];
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'];

        const isTextFile = textExtensions.includes(extension);
        const isImageFile = imageExtensions.includes(extension);

        // Image preview not supported in Tauri version yet
        if (isImageFile) {
          setError(`Image preview not yet supported in Tauri version. File: ${extension}`);
          return;
        }

        // Check if file type is supported
        if (!isTextFile) {
          setError(`Preview not available for .${extension} files. Only text files supported.`);
          return;
        }

        // For text files, read the content (no size check for now)
        const fileContent = await tauriAPI.readFile(filePath);

        // Basic size check after reading
        if (fileContent.length > 1024 * 1024) { // 1 MB
          const sizeMB = (fileContent.length / (1024 * 1024)).toFixed(1);
          setError(`File too large to preview (${sizeMB} MB). Text files over 1 MB cannot be previewed.`);
          return;
        }

        setContent(fileContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
        setContent('');
        setImageData('');
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();
  }, [isOpen, filePath, fileName]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Detect file type
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'];
  const isImage = imageExtensions.includes(extension);

  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
  };

  const language = languageMap[extension] || 'plaintext';
  let highlightedContent = content;

  if (content && language !== 'plaintext') {
    try {
      highlightedContent = hljs.highlight(content, { language }).value;
    } catch {
      // If highlighting fails, use plain text
      highlightedContent = content;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-[90%] h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-claude-accent text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">{fileName}</h2>
            <p className="text-sm text-white/70 mt-1 truncate max-w-2xl">{filePath}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading file...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-600 text-lg mb-2">⚠️ Error Loading File</div>
                <div className="text-gray-600">{error}</div>
              </div>
            </div>
          )}

          {!isLoading && !error && isImage && imageData && (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <img
                src={imageData}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
                onError={() => {
                  setError('Failed to load image');
                  setImageData('');
                }}
              />
            </div>
          )}

          {!isLoading && !error && content && !isImage && (
            <pre className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto text-sm">
              <code
                className={`hljs language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
            </pre>
          )}

          {!isLoading && !error && !content && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">File is empty</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {isImage && content ? (
              `Image · ${extension.toUpperCase()}`
            ) : content && !isImage ? (
              `${content.split('\n').length} lines · ${content.length} bytes`
            ) : ''}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-claude-accent text-white rounded hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
