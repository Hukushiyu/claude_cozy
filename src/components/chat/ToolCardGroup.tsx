import { ConsolidatedTool } from '../../types/chat';
import { ToolCard } from './ToolCard';

interface ToolCardGroupProps {
  tools: ConsolidatedTool[];
}

export function ToolCardGroup({ tools }: ToolCardGroupProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tools.map((consolidatedTool) => (
        <ToolCard
          key={`${consolidatedTool.toolName}-${consolidatedTool.instances[0].id}`}
          consolidatedTool={consolidatedTool}
          variant="compact"
        />
      ))}
    </div>
  );
}
