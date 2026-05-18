import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClearHistoryModal({ isOpen, onClose }: ClearHistoryModalProps) {
  const [isClearing, setIsClearing] = useState(false);
  const clearHistory = useChatStore(state => state.clearHistory);

  if (!isOpen) return null;

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearHistory();
      onClose();
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-semibold text-gray-900">Clear History?</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            This will delete all messages and start a fresh conversation with Claude.
          </p>
          <p className="text-gray-600 text-sm">
            <strong>Note:</strong> This action cannot be undone. All conversation context will be permanently removed.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isClearing}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleClear}
            disabled={isClearing}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isClearing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Clearing...
              </>
            ) : (
              'Clear History'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
