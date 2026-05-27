import { useEffect, useRef } from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  toolName: string;
  description: string;
  onApprove: () => void;
  onDeny: () => void;
}

export function PermissionModal({ isOpen, toolName, description, onApprove, onDeny }: PermissionModalProps) {
  const approveButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    // Focus the Approve button when card appears
    approveButtonRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDeny();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onDeny]);

  if (!isOpen) return null;

  return (
    <div className="mx-4 my-3 max-w-[600px]">
      <div
        className="border-l-4 bg-white rounded-lg shadow-md p-4 animate-fadeIn"
        style={{ borderLeftColor: '#FF8C42' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-semibold" style={{ color: '#FF8C42' }}>
            Permission Required
          </h3>
        </div>

        {/* Tool info */}
        <div className="mb-4 space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Claude wants to use:</span> {toolName}
          </p>
          <div className="text-xs text-gray-600 font-mono break-words bg-gray-50 p-2 rounded">
            <pre className="whitespace-pre-wrap">{summary}</pre>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-3">
          <button
            ref={approveButtonRef}
            onClick={onApprove}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Approve tool permission"
          >
            ✅ Approve
          </button>
          <button
            onClick={onDeny}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Deny tool permission"
          >
            ❌ Deny
          </button>
        </div>

        {/* Info text */}
        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-200">
          <span className="text-sm">ℹ️</span>
          <p className="text-xs text-blue-900">
            Approving once allows all tools for this session
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
