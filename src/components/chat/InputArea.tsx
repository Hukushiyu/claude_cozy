import { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import { useDragStore } from '../../stores/dragStore';
import { useProjectStore } from '../../stores/projectStore';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { Suggestion } from '../../types/chat';
import { SLASH_COMMANDS, flattenFileTree } from '../../utils/suggestions';
import { fuzzySearch } from '../../utils/fuzzySearch';
import { getCaretCoordinates } from '../../utils/caretPosition';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export interface InputAreaHandle {
  focus: () => void;
}

export const InputArea = forwardRef<InputAreaHandle, InputAreaProps>(({ onSend, disabled = false }, ref) => {
  const [input, setInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { draggedFile } = useDragStore();
  const { fileTree, projectPath } = useProjectStore();

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<'command' | 'file' | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [triggerPosition, setTriggerPosition] = useState(0);

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      console.log('[InputArea] focus() called via ref');
      if (textareaRef.current) {
        // Force focus by simulating a click first (helps "wake up" the input)
        textareaRef.current.click();
        textareaRef.current.focus();
        // Also try to set selection to ensure it's truly focused
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }
  }));

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      // Focus back to input after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    console.log('[InputArea] Drop event triggered');
    e.preventDefault();
    setIsDragOver(false);

    // Try to get data from HTML5 drag API first
    let fileReference = e.dataTransfer.getData('text/plain');
    console.log('[InputArea] Dropped data from dataTransfer:', fileReference);

    // Fallback to global store if HTML5 API didn't work (Tauri issue)
    if (!fileReference && draggedFile) {
      fileReference = draggedFile;
      console.log('[InputArea] Using fallback from dragStore:', fileReference);
    }

    if (fileReference && fileReference.startsWith('@')) {
      console.log('[InputArea] Valid file reference, inserting...');
      // Insert at cursor position or append
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBefore = input.substring(0, cursorPos);
        const textAfter = input.substring(cursorPos);

        // Add space before if needed
        const needsSpaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ');
        const prefix = needsSpaceBefore ? ' ' : '';

        setInput(textBefore + prefix + fileReference + ' ' + textAfter);

        // Set cursor after inserted text
        setTimeout(() => {
          const newCursorPos = cursorPos + prefix.length + fileReference.length + 1;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    } else {
      console.log('[InputArea] Invalid or empty file reference');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    console.log('[InputArea] Drag over detected');
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    // Only reset if we're actually leaving the textarea element
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  // Auto-focus when component becomes enabled (after loading completes)
  useEffect(() => {
    console.log('[InputArea] disabled changed to:', disabled);
    if (!disabled && textareaRef.current) {
      console.log('[InputArea] Focusing input');
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Watch for file references from the drag store
  useEffect(() => {
    if (draggedFile && draggedFile.startsWith('@')) {
      console.log('[InputArea] File reference received from store:', draggedFile);
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBefore = input.substring(0, cursorPos);
        const textAfter = input.substring(cursorPos);

        // Add space before if needed
        const needsSpaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ');
        const prefix = needsSpaceBefore ? ' ' : '';

        setInput(textBefore + prefix + draggedFile + ' ' + textAfter);

        // Set cursor after inserted text
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

    // Check for trigger characters (/ or @) at start of word
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/\s/).pop() || '';

    if (lastWord.startsWith('/')) {
      // Command autocomplete
      const query = lastWord.substring(1);
      const filtered = fuzzySearch(query, SLASH_COMMANDS);
      const topSuggestions = filtered.slice(0, 50).map(m => m.item);

      setSuggestions(topSuggestions);
      setAutocompleteType('command');
      setTriggerPosition(cursorPos - lastWord.length);
      setShowAutocomplete(true);
      setActiveIndex(0);

      // Update cursor position for dropdown
      if (textareaRef.current) {
        const pos = getCaretCoordinates(textareaRef.current);
        setCursorPosition(pos);
      }
    } else if (lastWord.startsWith('@') && projectPath && fileTree.length > 0) {
      // File autocomplete
      const query = lastWord.substring(1);
      const fileList = flattenFileTree(fileTree, projectPath);
      const filtered = fuzzySearch(query, fileList);
      const topSuggestions = filtered.slice(0, 50).map(m => m.item);

      setSuggestions(topSuggestions);
      setAutocompleteType('file');
      setTriggerPosition(cursorPos - lastWord.length);
      setShowAutocomplete(true);
      setActiveIndex(0);

      // Update cursor position for dropdown
      if (textareaRef.current) {
        const pos = getCaretCoordinates(textareaRef.current);
        setCursorPosition(pos);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    const textBefore = input.substring(0, triggerPosition);
    const textAfter = input.substring(textareaRef.current!.selectionStart);

    let replacement = '';
    if (suggestion.type === 'command') {
      replacement = suggestion.name + ' ';
    } else {
      replacement = '@' + suggestion.relativePath + ' ';
    }

    const newInput = textBefore + replacement + textAfter;
    setInput(newInput);
    setShowAutocomplete(false);

    // Position cursor after replacement
    const newCursorPos = textBefore.length + replacement.length;
    setTimeout(() => {
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If autocomplete is open, intercept navigation keys
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (suggestions.length > 0) {
          handleSuggestionSelect(suggestions[activeIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    // Original Enter key handling (send message)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Listen for hover events from dropdown
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
          placeholder="Type your message... (Shift+Enter for new line)"
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
            if (!isDragOver) {
              e.currentTarget.style.boxShadow = `var(--theme-accent) 0px 0px 0px 2px`;
            }
          }}
          onBlur={(e) => {
            if (!isDragOver) {
              e.currentTarget.style.boxShadow = `var(--theme-accent) 0px 0px 0px 0px`;
            }
          }}
          rows={3}
        />

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: 'var(--theme-accent)' }}
          onMouseEnter={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--theme-accentHover)';
            }
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
        {showAutocomplete && ' • Use ↑↓ to navigate, Enter to select, Esc to close'}
      </div>

      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <AutocompleteDropdown
          suggestions={suggestions}
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
