import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

interface PermissionModalProps {
  isOpen: boolean;
  toolName: string;
  description: string;
  onApprove: () => void;
  onDeny: () => void;
}

export function PermissionModal({ isOpen, toolName, description, onApprove, onDeny }: PermissionModalProps) {
  const { assistantName } = useSettingsStore();

  // Parse tool input to create a simplified summary
  const getToolSummary = () => {
    try {
      const input = JSON.parse(description);

      switch (toolName) {
        case 'Write':
        case 'Edit':
          if (input.file_path || input.filePath) {
            const path = input.file_path || input.filePath;
            const contentLength = (input.content || '').length;
            return `File: ${path}\nContent length: ${contentLength} characters`;
          }
          break;
        case 'Read':
          if (input.file_path || input.filePath) {
            return `File: ${input.file_path || input.filePath}`;
          }
          break;
        case 'Bash':
          if (input.command) {
            return `Command: ${input.command}`;
          }
          break;
        default:
          // For other tools, show first 200 chars of JSON
          return description.length > 200 ? description.substring(0, 200) + '...' : description;
      }
    } catch {
      // If parsing fails, truncate raw description
      return description.length > 200 ? description.substring(0, 200) + '...' : description;
    }
    return description;
  };

  const summary = getToolSummary();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key to deny
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onDeny();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onDeny]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onDeny}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col animate-scale-in"
        style={{
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚠️</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Permission Required
              </h2>
              <p className="text-sm text-gray-800">
                {assistantName} needs your approval
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="mb-4">
            <div className="text-sm text-gray-600 font-medium mb-2">Tool:</div>
            <div className="bg-gray-100 px-3 py-2 rounded font-mono text-sm text-gray-900 break-words">
              {toolName}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 font-medium mb-2">Details:</div>
            <div className="bg-gray-100 px-3 py-2 rounded font-mono text-xs text-gray-900 max-h-48 overflow-y-auto break-all">
              <pre className="whitespace-pre-wrap">{summary}</pre>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-xs text-blue-900">
                Once approved, all tool executions in this session will be allowed automatically.
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-3">
            <button
              onClick={onApprove}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ✓ Approve & Continue
            </button>
            <button
              onClick={onDeny}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ✗ Deny
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="text-center text-xs text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-700">Esc</kbd> to deny
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        kbd {
          font-family: monospace;
          font-size: 0.75rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
