import { useState } from 'react';

interface TokenCounterProps {
  onRequestUsage: () => void;
}

export function TokenCounter({ onRequestUsage }: TokenCounterProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onRequestUsage}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full px-2 py-1.5 rounded border text-xs font-medium transition-all flex items-center justify-between"
      style={{
        backgroundColor: isHovered ? 'var(--theme-hover)' : 'var(--theme-bg)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
      title="View token usage"
    >
      <div className="flex items-center gap-1.5">
        <span>🎫</span>
        <span>Token Usage</span>
      </div>
      <span className="text-xs opacity-70">▶</span>
    </button>
  );
}
