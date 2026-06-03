import { useState } from 'react';

interface UsageCardProps {
  content: string;
  timestamp: Date;
}

export function UsageCard({ content, timestamp }: UsageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse the usage output to extract key information
  const parseUsage = (rawOutput: string) => {
    // The claude usage command outputs text like:
    // "Usage for <period>: X input tokens, Y output tokens (Z total)"
    // We'll parse it for better display
    const lines = rawOutput.split('\n').filter(line => line.trim());

    return {
      raw: rawOutput,
      lines: lines
    };
  };

  const usageData = parseUsage(content);

  return (
    <div className="flex justify-start mb-4">
      <div
        className="max-w-[80%] rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg"
        style={{
          backgroundColor: 'var(--theme-accent)',
          color: '#FFFFFF',
          border: '2px solid var(--theme-accentHover)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Card Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎫</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Token Usage</h3>
            <p className="text-xs opacity-80">
              {timestamp.toLocaleTimeString()} • Click for details
            </p>
          </div>
          <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
        </div>

        {/* Summary (always visible) */}
        {!isExpanded && usageData.lines.length > 0 && (
          <div className="text-sm opacity-90">
            {usageData.lines[0]}
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="space-y-2 text-sm">
              {usageData.lines.map((line, idx) => (
                <div key={idx} className="opacity-90">
                  {line}
                </div>
              ))}
            </div>

            {/* Raw output in case of formatting issues */}
            <details className="mt-4">
              <summary className="text-xs opacity-70 cursor-pointer hover:opacity-100">
                Raw Output
              </summary>
              <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap font-mono bg-black/20 p-2 rounded">
                {usageData.raw}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
