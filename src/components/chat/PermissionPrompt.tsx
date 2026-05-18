import { useSettingsStore } from '../../stores/settingsStore';

interface PermissionPromptProps {
  toolName: string;
  description: string;
  onApprove: () => void;
  onDeny: () => void;
}

export function PermissionPrompt({ toolName, description, onApprove, onDeny }: PermissionPromptProps) {
  const { assistantName } = useSettingsStore();

  return (
    <div className="my-4 p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 mb-1">
            {assistantName} needs permission: {toolName}
          </div>
          <div className="text-sm text-gray-700 mb-3">
            {description}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
            >
              ✓ Approve
            </button>
            <button
              onClick={onDeny}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
            >
              ✗ Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
