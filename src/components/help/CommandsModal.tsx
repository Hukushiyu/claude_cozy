import { useEffect } from 'react';
import { SLASH_COMMANDS } from '../../utils/suggestions';
import { useSkillsStore } from '../../stores/skillsStore';

interface CommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Separate app commands and skills from the imported SLASH_COMMANDS
const APP_COMMANDS = SLASH_COMMANDS.filter(cmd => cmd.commandType === 'app');
const SKILLS = SLASH_COMMANDS.filter(cmd => cmd.commandType === 'skill');

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+T', mac: 'Cmd+T', description: 'Create new tab' },
  { keys: 'Ctrl+W', mac: 'Cmd+W', description: 'Close current tab' },
  { keys: 'Ctrl+Tab', mac: 'Cmd+Tab', description: 'Switch to next tab' },
  { keys: 'Ctrl+Shift+Tab', mac: 'Cmd+Shift+Tab', description: 'Switch to previous tab' },
  { keys: 'Ctrl+O', mac: 'Cmd+O', description: 'Open project folder' },
  { keys: 'Ctrl+/', mac: 'Cmd+/', description: 'Show this help menu' },
  { keys: 'Ctrl+Enter', mac: 'Cmd+Enter', description: 'Send message' },
  { keys: 'Ctrl+Shift+F', mac: 'Cmd+Shift+F', description: 'Focus file search' },
  { keys: 'Ctrl+,', mac: 'Cmd+,', description: 'Open settings' },
  { keys: 'Enter', description: 'Send message (when input focused)' },
  { keys: 'Shift+Enter', description: 'New line in message' },
  { keys: 'Escape', description: 'Stop Claude (when thinking)' },
];

export function CommandsModal({ isOpen, onClose }: CommandsModalProps) {
  const { customSkills } = useSkillsStore();

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

          {/* App Commands */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              💬 App Commands
            </h3>
            <div className="space-y-2">
              {APP_COMMANDS.map((cmd) => (
                <div key={cmd.name} className="flex items-start gap-4">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-base">{cmd.icon}</span>
                    <code className="bg-blue-50 px-2 py-1 rounded text-sm font-mono text-blue-700">
                      {cmd.name}
                    </code>
                  </div>
                  <span className="text-gray-600 text-sm">{cmd.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              ✨ Claude CLI Skills
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Skills are specialized capabilities provided by Claude CLI. Just type the command or ask Claude to use them.
            </p>
            <div className="space-y-3">
              {SKILLS.map((skill) => (
                <div key={skill.name} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{skill.icon}</span>
                    <code className="bg-purple-50 px-2 py-1 rounded text-sm font-mono text-purple-700">
                      {skill.usage || skill.name}
                    </code>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700">
                      SKILL
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm pl-7">{skill.description}</p>
                  {skill.examples && skill.examples.length > 0 && (
                    <ul className="text-xs text-gray-500 mt-2 pl-7 space-y-1">
                      {skill.examples.map((example, i) => (
                        <li key={i} className="font-mono">• {example}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Custom Skills */}
          {customSkills.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                ⭐ Your Custom Skills
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Custom skills you've created. Manage them via the 🛠️ Skills button in the header.
              </p>
              <div className="space-y-3">
                {customSkills.map((skill) => (
                  <div key={skill.name} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{skill.icon}</span>
                      <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono text-blue-700">
                        {skill.usage || skill.name}
                      </code>
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-200 text-blue-800">
                        CUSTOM
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm pl-7">{skill.description}</p>
                    {skill.examples && skill.examples.length > 0 && (
                      <ul className="text-xs text-gray-500 mt-2 pl-7 space-y-1">
                        {skill.examples.map((example, i) => (
                          <li key={i} className="font-mono">• {example}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

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
