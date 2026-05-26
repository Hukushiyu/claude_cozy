import { ToolEvent } from '../../types/chat';
import { ToolCard } from './ToolCard';

interface ToolCardGroupProps {
  tools: ToolEvent[];
}

export function ToolCardGroup({ tools }: ToolCardGroupProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tools.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          variant="compact"
        />
      ))}
    </div>
  );
}
