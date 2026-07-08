import { useState, useEffect, useCallback } from 'react';
import { tauriAPI } from '../utils/tauri-api';
import { useFileEditorStore } from '../stores/fileEditorStore';

const TEXT_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'java', 'cpp', 'c', 'cs', 'go', 'rs',
  'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'sh', 'bash',
  'sql', 'env', 'gitignore', 'log', 'config', 'ini', 'toml', 'vue', 'svelte'
];
export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'];
export const PDF_EXTENSIONS = ['pdf'];

export function isTextFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return TEXT_EXTENSIONS.includes(ext);
}

export function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

export function isPdfFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return PDF_EXTENSIONS.includes(ext);
}

interface UseFileEditorResult {
  content: string;
  imageData: string;
  pdfBlobUrl: string;   // blob: URL for PDF rendering via iframe
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  setContent: (value: string) => void;
  save: () => Promise<void>;
  discard: () => void;
  isSaving: boolean;
}

export function useFileEditor(filePath: string, fileName: string): UseFileEditorResult {
  const [imageData, setImageData] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { initBuffer, setBufferContent, markSaved, discardBuffer, getBuffer, isDirty: isBufferDirty } = useFileEditorStore();

  const buffer = getBuffer(filePath);
  const content = buffer?.content ?? '';
  const isDirty = filePath ? isBufferDirty(filePath) : false;

  useEffect(() => {
    if (!filePath) return;

    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Images: always reload from disk, no buffer needed
    if (IMAGE_EXTENSIONS.includes(ext)) {
      setIsLoading(true);
      setError(null);
      setImageData('');
      setPdfBlobUrl('');
      console.log('[useFileEditor] Loading image:', filePath);
      tauriAPI.readFileAsBase64(filePath)
        .then(base64 => {
          const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          setImageData(`data:${mimeType};base64,${base64}`);
          console.log('[useFileEditor] Image loaded, mimeType:', mimeType);
        })
        .catch(err => {
          console.error('[useFileEditor] Image load failed:', err);
          setError(err instanceof Error ? err.message : 'Failed to load image');
        })
        .finally(() => setIsLoading(false));
      return;
    }

    // PDFs: load as base64 then create a blob: URL for iframe rendering
    if (PDF_EXTENSIONS.includes(ext)) {
      setIsLoading(true);
      setError(null);
      setImageData('');
      setPdfBlobUrl(prev => {
        if (prev) {
          console.log('[useFileEditor] Revoking previous PDF blob URL');
          URL.revokeObjectURL(prev);
        }
        return '';
      });
      console.log('[useFileEditor] Loading PDF as base64:', filePath);
      tauriAPI.readFileAsBase64(filePath)
        .then(base64 => {
          console.log('[useFileEditor] PDF base64 received, length:', base64.length);
          // Decode base64 to binary and create a real blob URL
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          console.log('[useFileEditor] PDF blob URL created:', url);
          setPdfBlobUrl(url);
        })
        .catch(err => {
          console.error('[useFileEditor] PDF load failed:', err);
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        })
        .finally(() => setIsLoading(false));
      return;
    }

    if (!TEXT_EXTENSIONS.includes(ext)) {
      setError(`Preview not available for .${ext} files.`);
      return;
    }

    // Check if we already have a buffer for this file (restored or previously edited)
    const existing = getBuffer(filePath);
    if (existing !== undefined) {
      // Buffer already loaded — component just remounted, no disk read needed
      setError(null);
      setIsLoading(false);
      return;
    }

    // First open: read from disk and seed the buffer
    setIsLoading(true);
    setError(null);

    tauriAPI.readFile(filePath)
      .then(diskContent => {
        if (diskContent.length > 1024 * 1024) {
          const sizeMB = (diskContent.length / (1024 * 1024)).toFixed(1);
          setError(`File too large to edit (${sizeMB} MB). Files over 1 MB are read-only.`);
          return;
        }
        initBuffer(filePath, diskContent);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load file'))
      .finally(() => setIsLoading(false));

  }, [filePath, fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up blob URL when the component unmounts or file changes
  useEffect(() => {
    return () => {
      setPdfBlobUrl(prev => {
        if (prev) {
          console.log('[useFileEditor] Cleaning up PDF blob URL on unmount');
          URL.revokeObjectURL(prev);
        }
        return '';
      });
    };
  }, [filePath]);

  const setContent = useCallback((value: string) => {
    if (filePath) setBufferContent(filePath, value);
  }, [filePath, setBufferContent]);

  const save = useCallback(async () => {
    if (!filePath || !isDirty || isSaving) return;
    setIsSaving(true);
    try {
      await tauriAPI.writeFile(filePath, content);
      markSaved(filePath);
    } finally {
      setIsSaving(false);
    }
  }, [filePath, content, isDirty, isSaving, markSaved]);

  const discard = useCallback(() => {
    if (filePath) discardBuffer(filePath);
  }, [filePath, discardBuffer]);

  return { content, imageData, pdfBlobUrl, isLoading, error, isDirty, setContent, save, discard, isSaving };
}
