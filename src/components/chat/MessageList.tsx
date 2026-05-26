import { Message, ToolEvent, CombinedChatItem, GroupedChatItem } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { ToolCard } from './ToolCard';
import { ToolCardGroup } from './ToolCardGroup';
import { ThinkingIndicator } from './ThinkingIndicator';

interface MessageListProps {
  messages: Message[];
  toolEvents: ToolEvent[];
  streamingMessage: string | null;
  isThinking: boolean;
  thinkingStatus: string | null;
}

function groupConsecutiveTools(items: CombinedChatItem[]): GroupedChatItem[] {
  const grouped: GroupedChatItem[] = [];
  let currentToolGroup: ToolEvent[] = [];

  for (const item of items) {
    if (item.type === 'tool') {
      currentToolGroup.push(item.data);
    } else {
      // Message found - flush current tool group
      if (currentToolGroup.length > 0) {
        const firstTool = currentToolGroup[0];
        grouped.push({
          type: 'tool-group',
          data: currentToolGroup,
          timestamp: firstTool.timestamp,
          id: `group-${firstTool.id}`
        });
        currentToolGroup = [];
      }
      grouped.push(item);
    }
  }

  // Flush remaining tools at end
  if (currentToolGroup.length > 0) {
    const firstTool = currentToolGroup[0];
    grouped.push({
      type: 'tool-group',
      data: currentToolGroup,
      timestamp: firstTool.timestamp,
      id: `group-${firstTool.id}`
    });
  }

  return grouped;
}

export function MessageList({
  messages,
  toolEvents,
  streamingMessage,
  isThinking,
  thinkingStatus
}: MessageListProps) {
  // Interleave messages and tool events by timestamp
  const combinedItems: CombinedChatItem[] = [
    ...messages.map(msg => ({ type: 'message' as const, data: msg, timestamp: msg.timestamp })),
    ...toolEvents.map(tool => ({ type: 'tool' as const, data: tool, timestamp: tool.timestamp }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Group consecutive tools
  const groupedItems = groupConsecutiveTools(combinedItems);

  return (
    <div className="space-y-4">
      {groupedItems.map((item) => (
        item.type === 'message' ? (
          <MessageBubble key={item.data.id} message={item.data as Message} />
        ) : (
          <ToolCardGroup key={item.id} tools={item.data} />
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
