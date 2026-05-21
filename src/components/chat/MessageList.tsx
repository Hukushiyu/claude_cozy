import { Message, ToolEvent } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { ToolCard } from './ToolCard';
import { ThinkingIndicator } from './ThinkingIndicator';

interface MessageListProps {
  messages: Message[];
  toolEvents: ToolEvent[];
  streamingMessage: string | null;
  isThinking: boolean;
  thinkingStatus: string | null;
}

export function MessageList({
  messages,
  toolEvents,
  streamingMessage,
  isThinking,
  thinkingStatus
}: MessageListProps) {
  // Interleave messages and tool events by timestamp
  const combinedItems: Array<{ type: 'message' | 'tool'; data: Message | ToolEvent; timestamp: Date }> = [
    ...messages.map(msg => ({ type: 'message' as const, data: msg, timestamp: msg.timestamp })),
    ...toolEvents.map(tool => ({ type: 'tool' as const, data: tool, timestamp: tool.timestamp }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="space-y-4">
      {combinedItems.map((item) => (
        item.type === 'message' ? (
          <MessageBubble key={item.data.id} message={item.data as Message} />
        ) : (
          <ToolCard key={item.data.id} tool={item.data as ToolEvent} />
        )
      ))}

      {/* Show thinking indicator when Claude is processing */}
      {isThinking && thinkingStatus !== null && (
        <ThinkingIndicator status={thinkingStatus} />
      )}

      {/* Show streaming message */}
      {streamingMessage && (
        <MessageBubble
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingMessage,
            timestamp: new Date()
          }}
          isStreaming
        />
      )}
    </div>
  );
}
