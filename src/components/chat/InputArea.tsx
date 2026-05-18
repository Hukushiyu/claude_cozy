import { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

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
    e.preventDefault();
    setIsDragOver(false);

    const fileReference = e.dataTransfer.getData('text/plain');
    if (fileReference && fileReference.startsWith('@')) {
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
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' }}>
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
        Press Enter to send, Shift+Enter for new line • Drag files from tree to reference them with @
      </div>
    </div>
  );
});
