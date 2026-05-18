import { Message } from '../../types/chat';
import { MarkdownContent } from './MarkdownContent';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className="max-w-3xl min-w-0 px-4 py-3 rounded-xl shadow-md transition-shadow hover:shadow-lg"
        style={{
          backgroundColor: isUser ? 'var(--theme-userBubble)' : 'var(--theme-assistantBubble)',
          color: isUser ? 'var(--theme-text)' : 'var(--theme-text)',
          border: isUser ? 'none' : `1px solid var(--theme-border)`
        }}
      >
        {isUser ? (
          // User messages: plain text
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          // Assistant messages: markdown rendering
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
