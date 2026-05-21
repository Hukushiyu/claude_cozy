import { Message } from '../../types/chat';
import { MarkdownContent } from './MarkdownContent';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isThought = message.role === 'thought';

  if (isThought) {
    return (
      <div className="flex justify-start mb-2">
        <details className="max-w-3xl min-w-0 group">
          <summary
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer select-none text-sm list-none"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px dashed var(--theme-border)',
              color: 'var(--theme-textSecondary)'
            }}
          >
            <span>💭</span>
            <span className="italic">Claude's thinking</span>
            <span className="ml-1 text-xs opacity-60 group-open:hidden">▶</span>
            <span className="ml-1 text-xs opacity-60 hidden group-open:inline">▼</span>
          </summary>
          <div
            className="mt-1 px-4 py-3 rounded-xl text-sm italic"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px dashed var(--theme-border)',
              color: 'var(--theme-textSecondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {message.content}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className="max-w-3xl min-w-0 px-4 py-3 rounded-xl shadow-md transition-shadow hover:shadow-lg"
        style={{
          backgroundColor: isUser ? 'var(--theme-userBubble)' : 'var(--theme-assistantBubble)',
          color: 'var(--theme-text)',
          border: isUser ? 'none' : `1px solid var(--theme-border)`
        }}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div>
            <MarkdownContent content={message.content} />
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-800 animate-pulse" />
            )}
          </div>
        )}

        {!isStreaming && (
          <div className="text-xs mt-2" style={{ color: 'var(--theme-textSecondary)', opacity: 0.8 }}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
