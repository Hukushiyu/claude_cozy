import { useState, useEffect } from 'react';

interface ProjectSelectionModalProps {
  onSelectProject: () => void;
}

export function ProjectSelectionModal({ onSelectProject }: ProjectSelectionModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome before
    const hideWelcome = localStorage.getItem('hideProjectWelcome') === 'true';
    setIsSimpleMode(hideWelcome);
  }, []);

  const handleSelectProject = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideProjectWelcome', 'true');
    }
    onSelectProject();
  };

  // Simple mode - just project selection, no intro
  if (isSimpleMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-fade-in">
          {/* Simple Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📁</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-1">
              Select Project
            </h1>
            <p className="text-gray-600 text-sm">
              Choose a project folder to get started
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={handleSelectProject}
            className="w-full py-3 px-6 bg-claude-accent text-white rounded-lg font-medium hover:opacity-90 transition-all hover:shadow-lg text-base"
          >
            Select Project Folder
          </button>
        </div>
      </div>
    );
  }

  // Full welcome mode - first time experience
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome to Claude Terminal
          </h1>
          <p className="text-gray-600 text-sm">
            A visual, friendly workspace for Claude CLI
          </p>
        </div>

        {/* Main content */}
        <div className="bg-claude-bg rounded-xl p-6 mb-6">
          <h2 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <span>📁</span>
            <span>Get Started</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            To begin chatting with Claude, select a project folder. This allows Claude to:
          </p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Read and write files in your project</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Run commands in the project directory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Understand your project structure</span>
            </li>
          </ul>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-claude-accent focus:ring-claude-accent cursor-pointer"
          />
          <span className="text-sm text-gray-600">Don't show welcome text next time</span>
        </label>

        {/* Action button */}
        <button
          onClick={handleSelectProject}
          className="w-full py-3 px-6 bg-claude-accent text-white rounded-lg font-medium hover:opacity-90 transition-all hover:shadow-lg text-base"
        >
          Select Project Folder
        </button>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can change the project folder anytime from the sidebar
        </p>
      </div>
    </div>
  );
}
