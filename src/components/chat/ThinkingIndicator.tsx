import { useState, useEffect } from 'react';

interface ThinkingIndicatorProps {
  status: string;
}

// Fun emojis to match thinking states
const getThinkingEmoji = (status: string) => {
  const lowerStatus = status.toLowerCase();

  // Tool execution states
  if (lowerStatus.includes('bash') || lowerStatus.includes('shell') || lowerStatus.includes('command')) return '💻';
  if (lowerStatus.includes('write') || lowerStatus.includes('creat')) return '✏️';
  if (lowerStatus.includes('read') || lowerStatus.includes('fetch')) return '📖';
  if (lowerStatus.includes('edit') || lowerStatus.includes('patch')) return '🔧';
  if (lowerStatus.includes('search') || lowerStatus.includes('grep') || lowerStatus.includes('glob')) return '🔍';
  if (lowerStatus.includes('running') || lowerStatus.includes('execut')) return '⚙️';
  if (lowerStatus.includes('rate limit') || lowerStatus.includes('retry')) return '⏳';

  // Thinking states
  if (lowerStatus.includes('flummox')) return '🤔';
  if (lowerStatus.includes('ponder')) return '💭';
  if (lowerStatus.includes('cogitat')) return '🧠';
  if (lowerStatus.includes('reason')) return '💡';
  if (lowerStatus.includes('analyz')) return '🔍';
  if (lowerStatus.includes('deliberat')) return '⚖️';
  if (lowerStatus.includes('contemplat')) return '🤨';
  if (lowerStatus.includes('meditat')) return '🧘';
  if (lowerStatus.includes('perplex')) return '😵‍💫';
  if (lowerStatus.includes('mull')) return '🤓';
  if (lowerStatus.includes('reflect')) return '🪞';
  if (lowerStatus.includes('consider')) return '🧐';
  if (lowerStatus.includes('puzz')) return '🧩';
  if (lowerStatus.includes('ruminat')) return '🐄';

  return '💫'; // Default sparkle
};

// Capitalize first letter for display
const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Format elapsed time
const formatElapsedTime = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }
};

export function ThinkingIndicator({ status }: ThinkingIndicatorProps) {
  const hasStatus = status && status.trim().length > 0;
  const emoji = hasStatus ? getThinkingEmoji(status) : null;
  const formattedStatus = hasStatus ? formatStatus(status) : null;

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Reset timer when component mounts
    setElapsedSeconds(0);

    // Increment every second
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="max-w-3xl px-4 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 shadow-md">
        <div className="flex items-center gap-3">
          {/* Animated emoji with pulse - only show if we have a status */}
          {hasStatus && (
            <div className="text-2xl animate-pulse">
              {emoji}
            </div>
          )}

          {/* Animated spinner - gradient style */}
          <div className="relative w-4 h-4">
            <svg className="animate-spin text-purple-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>

          {/* Status text with gradient and timer */}
          {hasStatus ? (
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 text-sm font-semibold">
              {formattedStatus} <span className="text-gray-500">(thinking for {formatElapsedTime(elapsedSeconds)})</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm font-semibold">
              Thinking for {formatElapsedTime(elapsedSeconds)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
