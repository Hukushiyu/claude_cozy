import { useEffect } from 'react';

interface CommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLASH_COMMANDS = [
  { name: '/help', description: 'Show help information about Claude Code' },
  { name: '/clear', description: 'Clear the conversation history' },
  { name: '/config', description: 'Open configuration settings' },
  { name: '/fast', description: 'Toggle fast mode (Claude Opus 4.6 with faster output)' },
  { name: '/context', description: 'Show current context window usage' },
  { name: '/usage', description: 'Show API usage statistics' },
  { name: '/compact', description: 'Compact the conversation to save tokens' },
];

const SKILLS = [
  {
    name: 'update-config',
    description: 'Configure Claude Code settings, permissions, environment variables, and hooks',
    usage: '/update-config'
  },
  {
    name: 'keybindings-help',
    description: 'Customize keyboard shortcuts and key bindings',
    usage: '/keybindings-help'
  },
  {
    name: 'simplify',
    description: 'Review code for reuse, quality, and efficiency',
    usage: '/simplify'
  },
  {
    name: 'fewer-permission-prompts',
    description: 'Reduce permission prompts by adding allowlist rules',
    usage: '/fewer-permission-prompts'
  },
  {
    name: 'loop',
    description: 'Run a command on a recurring interval (e.g., /loop 5m /status)',
    usage: '/loop <interval> <command>'
  },
  {
    name: 'claude-api',
    description: 'Build and debug Claude API applications with prompt caching',
    usage: '/claude-api'
  },
  {
    name: 'init',
    description: 'Initialize a CLAUDE.md file with codebase documentation',
    usage: '/init'
  },
  {
    name: 'review',
    description: 'Review a pull request',
    usage: '/review'
  },
  {
    name: 'security-review',
    description: 'Complete a security review of pending changes',
    usage: '/security-review'
  },
  {
    name: 'reset-permissions',
    description: 'Reset tool permissions - will prompt again on next tool use',
    usage: '/reset-permissions'
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+/', mac: 'Cmd+/', description: 'Show this help menu' },
  { keys: 'Enter', description: 'Send message' },
  { keys: 'Shift+Enter', description: 'New line in message' },
];

export function CommandsModal({ isOpen, onClose }: CommandsModalProps) {
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

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-claude-accent text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Commands & Skills Reference</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-start gap-4">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-700 min-w-[120px]">
                    {isMac && shortcut.mac ? shortcut.mac : shortcut.keys}
                  </code>
                  <span className="text-gray-600 text-sm">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Slash Commands */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              / Slash Commands
            </h3>
            <div className="space-y-2">
              {SLASH_COMMANDS.map((cmd) => (
                <div key={cmd.name} className="flex items-start gap-4">
                  <code className="bg-blue-50 px-3 py-1 rounded text-sm font-mono text-blue-700 min-w-[120px]">
                    {cmd.name}
                  </code>
                  <span className="text-gray-600 text-sm">{cmd.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🛠️ Skills
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Skills are specialized capabilities. Just type the command or ask Claude to use them.
            </p>
            <div className="space-y-3">
              {SKILLS.map((skill) => (
                <div key={skill.name} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-4 mb-1">
                    <code className="bg-purple-50 px-3 py-1 rounded text-sm font-mono text-purple-700 min-w-[200px]">
                      {skill.usage}
                    </code>
                  </div>
                  <p className="text-gray-600 text-sm ml-[216px]">{skill.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tips */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
              💡 Tips
            </h3>
            <ul className="space-y-1 text-sm text-blue-900">
              <li>• Type slash commands directly in the chat input</li>
              <li>• Ask Claude to use skills naturally: "Can you simplify this code?"</li>
              <li>• Use Ctrl+/ (Cmd+/ on Mac) to open this reference anytime</li>
              <li>• Press Escape to close this dialog</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end">
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
