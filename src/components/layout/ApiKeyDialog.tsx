import { useState } from 'react';

interface ApiKeyDialogProps {
  onSubmit: (apiKey: string) => void;
  onUseCli: () => void;
}

export function ApiKeyDialog({ onSubmit, onUseCli }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Should start with sk-ant-');
      return;
    }

    onSubmit(apiKey.trim());
  };

  const handleUseCli = () => {
    onUseCli();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Choose Authentication Method</h2>

        {!showApiKeyInput ? (
          <>
            <p className="text-sm text-gray-600 mb-6">
              How would you like to authenticate with Claude?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleUseCli}
                className="w-full px-4 py-4 bg-claude-accent text-white rounded-lg hover:opacity-90 transition-opacity text-left"
              >
                <div className="font-semibold mb-1">✓ Use Claude CLI (Recommended)</div>
                <div className="text-sm text-white/80">
                  Works with your Claude Pro account. No additional setup needed if you're already logged in to Claude CLI.
                </div>
              </button>

              <button
                onClick={() => setShowApiKeyInput(true)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg hover:border-claude-accent transition-colors text-left"
              >
                <div className="font-semibold mb-1">Use API Key</div>
                <div className="text-sm text-gray-600">
                  For users with Anthropic API billing accounts.
                </div>
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <p className="text-gray-700">
                <strong>Note:</strong> If you have Claude Pro, choose "Use Claude CLI".
                API keys require a separate billing account.
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-claude-accent"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium mb-1">Don't have an API key?</p>
            <p className="text-gray-700">
              Get one from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowApiKeyInput(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-claude-accent text-white rounded hover:opacity-90 transition-opacity"
            >
              Save API Key
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
