import { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import { useDragStore } from '../../stores/dragStore';
import { useTabStore } from '../../stores/tabStore';
import { useSkillsStore } from '../../stores/skillsStore';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { StructuredRow, CommandSuggestion, PluginInfo } from '../../types/chat';
import { flattenFileTree } from '../../utils/suggestions';
import { fuzzySearch } from '../../utils/fuzzySearch';
import { getCaretCoordinates } from '../../utils/caretPosition';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export interface InputAreaHandle {
  focus: () => void;
}

function buildStructuredRows(
  filteredCommands: CommandSuggestion[],
  plugins: PluginInfo[]
): StructuredRow[] {
  const rows: StructuredRow[] = [];
  const pluginsByCmd = new Map<string, PluginInfo>();
  for (const plugin of plugins) {
    pluginsByCmd.set(`/${plugin.name}`, plugin);
  }

  const pluginsEmitted = new Set<string>();

  for (const cmd of filteredCommands) {
    const plugin = pluginsByCmd.get(cmd.name);
    if (plugin) {
      if (!pluginsEmitted.has(cmd.name)) {
        pluginsEmitted.add(cmd.name);
        rows.push({
          kind: 'plugin-header',
          pluginName: plugin.name,
          commandName: cmd.name,
          description: cmd.description,
          skills: plugin.skills,
        });
        for (const skill of plugin.skills) {
          rows.push({
            kind: 'skill-row',
            name: skill.name,
            description: skill.description,
            parentPlugin: plugin.name,
          });
        }
      }
    } else {
      rows.push({ kind: 'flat-command', suggestion: cmd });
    }
  }

  return rows;
}

export const InputArea = forwardRef<InputAreaHandle, InputAreaProps>(({ onSend, disabled = false }, ref) => {
  const [input, setInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { draggedFile } = useDragStore();
  const { getActiveTab, getActiveFileTreeState } = useTabStore();
  const activeTab = getActiveTab();
  const projectPath = activeTab?.projectPath || null;
  const { fileTree } = getActiveFileTreeState();
  const { getAllSkills, getPlugins } = useSkillsStore();

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<'command' | 'file' | null>(null);
  const [structuredRows, setStructuredRows] = useState<StructuredRow[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [triggerPosition, setTriggerPosition] = useState(0);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.click();
        textareaRef.current.focus();
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }
  }));

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    let fileReference = e.dataTransfer.getData('text/plain');
    if (!fileReference && draggedFile) fileReference = draggedFile;
    if (fileReference && fileReference.startsWith('@')) {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBefore = input.substring(0, cursorPos);
        const textAfter = input.substring(cursorPos);
        const needsSpaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ');
        const prefix = needsSpaceBefore ? ' ' : '';
        setInput(textBefore + prefix + fileReference + ' ' + textAfter);
        setTimeout(() => {
          const newCursorPos = cursorPos + prefix.length + fileReference.length + 1;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setIsDragOver(false);
  };

  useEffect(() => {
    if (!disabled && textareaRef.current) textareaRef.current.focus();
  }, [disabled]);

  useEffect(() => {
    if (draggedFile && draggedFile.startsWith('@')) {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBefore = input.substring(0, cursorPos);
        const textAfter = input.substring(cursorPos);
        const needsSpaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ');
        const prefix = needsSpaceBefore ? ' ' : '';
        setInput(textBefore + prefix + draggedFile + ' ' + textAfter);
        setTimeout(() => {
          const newCursorPos = cursorPos + prefix.length + draggedFile.length + 1;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    }
  }, [draggedFile]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setInput(newValue);

    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/\s/).pop() || '';

    if (lastWord.startsWith('/')) {
      const query = lastWord.substring(1);
      const allCommands = getAllSkills();
      const plugins = getPlugins();

      // Fuzzy-filter flat commands
      const filtered = fuzzySearch(query, allCommands).slice(0, 50).map(m => m.item).filter((s): s is CommandSuggestion => s.type === 'command');

      // Inject plugin entries that match query but aren't already in filtered list
      for (const plugin of plugins) {
        const cmdName = `/${plugin.name}`;
        const matchesQuery = query === '' || cmdName.toLowerCase().includes(query.toLowerCase());
        if (matchesQuery && !filtered.find(c => c.name === cmdName)) {
          filtered.push({
            type: 'command' as const,
            commandType: 'skill' as const,
            name: cmdName,
            description: `Plugin: ${plugin.name}`,
            icon: '🔌',
          });
        }
      }

      const rows = buildStructuredRows(filtered, plugins);

      setStructuredRows(rows);
      setAutocompleteType('command');
      setTriggerPosition(cursorPos - lastWord.length);
      setShowAutocomplete(rows.length > 0);
      setActiveIndex(0);

      if (textareaRef.current) {
        setCursorPosition(getCaretCoordinates(textareaRef.current));
      }
    } else if (lastWord.startsWith('@') && projectPath && fileTree.length > 0) {
      const query = lastWord.substring(1);
      const fileList = flattenFileTree(fileTree, projectPath);
      const filtered = fuzzySearch(query, fileList).slice(0, 50).map(m => m.item);
      const rows: StructuredRow[] = filtered.map(f => ({ kind: 'flat-command' as const, suggestion: f }));

      setStructuredRows(rows);
      setAutocompleteType('file');
      setTriggerPosition(cursorPos - lastWord.length);
      setShowAutocomplete(rows.length > 0);
      setActiveIndex(0);

      if (textareaRef.current) {
        setCursorPosition(getCaretCoordinates(textareaRef.current));
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSuggestionSelect = (row: StructuredRow) => {
    const textBefore = input.substring(0, triggerPosition);
    const textAfter = input.substring(textareaRef.current!.selectionStart);

    let replacement = '';
    if (row.kind === 'plugin-header') {
      replacement = row.commandName + ' ';
    } else if (row.kind === 'skill-row') {
      replacement = row.name + ' ';
    } else if (row.kind === 'flat-command') {
      const s = row.suggestion;
      replacement = s.type === 'command' ? s.name + ' ' : '@' + s.relativePath + ' ';
    }

    setInput(textBefore + replacement + textAfter);
    setShowAutocomplete(false);

    const newCursorPos = textBefore.length + replacement.length;
    setTimeout(() => {
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete) {
      const maxIndex = structuredRows.length - 1;

      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, maxIndex));
        return;
      }
      if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const row = structuredRows[activeIndex];
        if (row) handleSuggestionSelect(row);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleHover = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveIndex(customEvent.detail);
    };
    window.addEventListener('autocomplete-hover', handleHover);
    return () => window.removeEventListener('autocomplete-hover', handleHover);
  }, []);

  return (
    <div className="border-t p-4 relative" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' }}>
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          placeholder="Type / for commands or @ to add files to chat"
          disabled={disabled}
          className={`flex-1 resize-none rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isDragOver ? 'bg-blue-50 border-blue-400' : ''
          }`}
          style={{
            borderColor: isDragOver ? 'var(--theme-accent)' : 'var(--theme-border)',
            backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'var(--theme-bg)',
            color: 'var(--theme-text)',
            boxShadow: isDragOver ? 'var(--theme-accent) 0px 0px 0px 2px' : 'var(--theme-accent) 0px 0px 0px 0px'
          }}
          onFocus={(e) => {
            if (!isDragOver) e.currentTarget.style.boxShadow = `var(--theme-accent) 0px 0px 0px 2px`;
          }}
          onBlur={(e) => {
            if (!isDragOver) e.currentTarget.style.boxShadow = `var(--theme-accent) 0px 0px 0px 0px`;
          }}
          rows={3}
        />

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: 'var(--theme-accent)' }}
          onMouseEnter={(e) => {
            if (!disabled && input.trim()) e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
          }}
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="text-xs mt-2" style={{ color: 'var(--theme-textSecondary)' }}>
        Press Enter to send, Shift+Enter for new line
        {showAutocomplete && ' • Tab/↑↓ to navigate, Enter to select, Esc to close'}
      </div>

      {showAutocomplete && (
        <AutocompleteDropdown
          rows={structuredRows}
          activeIndex={activeIndex}
          onSelect={handleSuggestionSelect}
          onClose={() => setShowAutocomplete(false)}
          position={cursorPosition}
          type={autocompleteType!}
        />
      )}
    </div>
  );
});
