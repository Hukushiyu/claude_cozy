import { useState, useRef } from 'react';

interface ThemeImportExportProps {
  onImport: (jsonString: string) => { success: boolean; error?: string; themeName?: string };
  onExport: (themeId: string) => string | null;
  currentThemeId: string;
}

export function ThemeImportExport({ onImport, onExport, currentThemeId }: ThemeImportExportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportDownload = () => {
    const json = onExport(currentThemeId);
    if (!json) {
      setMessage({ type: 'error', text: 'Failed to export theme' });
      return;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${currentThemeId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Theme exported successfully' });
    setShowExportDialog(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportCopy = async () => {
    const json = onExport(currentThemeId);
    if (!json) {
      setMessage({ type: 'error', text: 'Failed to export theme' });
      return;
    }

    try {
      await navigator.clipboard.writeText(json);
      setMessage({ type: 'success', text: 'Theme copied to clipboard' });
      setShowExportDialog(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleImportSubmit(content);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportSubmit = (jsonString?: string) => {
    const content = jsonString || importText;

    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please provide theme JSON' });
      return;
    }

    const result = onImport(content);

    if (result.success) {
      setMessage({ type: 'success', text: `Theme "${result.themeName}" imported successfully` });
      setShowImportDialog(false);
      setImportText('');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Import failed' });
    }
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowExportDialog(true)}
          className="px-4 py-2 rounded transition-opacity text-sm font-medium"
          style={{
            backgroundColor: 'var(--theme-hover)',
            color: 'var(--theme-text)',
            border: `1px solid var(--theme-border)`,
          }}
        >
          Export Current Theme
        </button>
        <button
          onClick={() => setShowImportDialog(true)}
          className="px-4 py-2 rounded transition-opacity text-sm font-medium"
          style={{
            backgroundColor: 'var(--theme-hover)',
            color: 'var(--theme-text)',
            border: `1px solid var(--theme-border)`,
          }}
        >
          Import Theme
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className="mt-3 px-4 py-2 rounded text-sm"
          style={{
            backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="rounded-lg shadow-2xl w-[400px] p-6"
            style={{ backgroundColor: 'var(--theme-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>
              Export Theme
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--theme-textSecondary)' }}>
              Choose how you want to export your theme
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExportDownload}
                className="w-full px-4 py-3 rounded text-left transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-hover)',
                  color: 'var(--theme-text)',
                  border: `1px solid var(--theme-border)`,
                }}
              >
                <div className="font-medium">Download as JSON file</div>
                <div className="text-xs mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
                  Save theme to your computer
                </div>
              </button>

              <button
                onClick={handleExportCopy}
                className="w-full px-4 py-3 rounded text-left transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-hover)',
                  color: 'var(--theme-text)',
                  border: `1px solid var(--theme-border)`,
                }}
              >
                <div className="font-medium">Copy to clipboard</div>
                <div className="text-xs mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
                  Copy JSON to paste elsewhere
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 rounded transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-hover)',
                  color: 'var(--theme-text)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowImportDialog(false);
            setImportText('');
            setMessage(null);
          }}
        >
          <div
            className="rounded-lg shadow-2xl w-[500px] p-6"
            style={{ backgroundColor: 'var(--theme-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>
              Import Theme
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--theme-textSecondary)' }}>
              Upload a JSON file or paste theme JSON
            </p>

            {/* File Upload */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="theme-file-input"
              />
              <label
                htmlFor="theme-file-input"
                className="block w-full px-4 py-3 rounded text-center cursor-pointer transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-hover)',
                  color: 'var(--theme-text)',
                  border: `2px dashed var(--theme-border)`,
                }}
              >
                Click to upload JSON file
              </label>
            </div>

            <div className="text-center text-sm mb-4" style={{ color: 'var(--theme-textSecondary)' }}>
              or
            </div>

            {/* Text Paste */}
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste theme JSON here..."
              rows={6}
              className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 font-mono text-sm"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                  setMessage(null);
                }}
                className="px-4 py-2 rounded transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-hover)',
                  color: 'var(--theme-text)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleImportSubmit()}
                className="px-4 py-2 rounded font-medium transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
