import { useState } from 'react';
import { ToolEvent } from '../../types/chat';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface ToolCardProps {
  tool: ToolEvent;
  variant?: 'full' | 'compact';
}

// Tool color mapping for visual distinction
const TOOL_COLORS = {
  Read: 'bg-blue-50 border-blue-200',
  Write: 'bg-green-50 border-green-200',
  Edit: 'bg-yellow-50 border-yellow-200',
  Bash: 'bg-purple-50 border-purple-200',
  Grep: 'bg-indigo-50 border-indigo-200',
  Glob: 'bg-pink-50 border-pink-200',
  default: 'bg-gray-50 border-gray-200'
};

// Tool icon mapping
const TOOL_ICONS = {
  Read: '📖',
  Write: '✏️',
  Edit: '📝',
  Bash: '⚡',
  Grep: '🔍',
  Glob: '📂',
  default: '🔧'
};

function getToolColor(toolName: string): string {
  return TOOL_COLORS[toolName as keyof typeof TOOL_COLORS] || TOOL_COLORS.default;
}

function getToolIcon(toolName: string): string {
  return TOOL_ICONS[toolName as keyof typeof TOOL_ICONS] || TOOL_ICONS.default;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function highlightCode(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language }).value;
    } catch (err) {
      console.error('Highlight error:', err);
    }
  }
  return hljs.highlightAuto(code).value;
}

export function ToolCard({ tool, variant = 'full' }: ToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isCompact = variant === 'compact';

  const statusColors = {
    running: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300'
  };

  const statusIcons = {
    running: '⏳',
    success: '✓',
    error: '✗'
  };

  // Format input for display
  const formatInput = () => {
    // Check if input is empty
    if (Object.keys(tool.input).length === 0) {
      return `Executing ${tool.toolName}...`;
    }

    if (tool.toolName === 'Read' || tool.toolName === 'Write' || tool.toolName === 'Edit') {
      return tool.input.file_path || JSON.stringify(tool.input);
    }
    if (tool.toolName === 'Bash') {
      return tool.input.command || JSON.stringify(tool.input);
    }
    return JSON.stringify(tool.input, null, 2);
  };

  // Detect language from file path
  const detectLanguage = (): string | undefined => {
    if (tool.input.file_path) {
      const ext = tool.input.file_path.split('.').pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        cs: 'csharp',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        php: 'php',
        sh: 'bash',
        json: 'json',
        xml: 'xml',
        html: 'html',
        css: 'css',
        md: 'markdown'
      };
      return ext ? langMap[ext] : undefined;
    }
    return undefined;
  };

  const colorClass = getToolColor(tool.toolName);
  const icon = getToolIcon(tool.toolName);

  // Compact variant for horizontal grouping
  if (isCompact) {
    return (
      <div
        onClick={() => setShowModal(true)}
        className={`border rounded-lg ${colorClass} w-[280px] flex-shrink-0 p-3 transition-all shadow-sm hover:shadow-lg cursor-pointer`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-sm truncate">{tool.toolName}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${statusColors[tool.status]} ml-auto flex-shrink-0`}>
            {statusIcons[tool.status]}
          </span>
        </div>
        <div className="text-xs text-gray-600 truncate font-mono">
          {formatInput()}
        </div>
        {tool.duration && (
          <div className="text-xs text-gray-500 mt-2">
            {formatDuration(tool.duration)}
          </div>
        )}

        {/* Modal for expanded view */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(false);
            }}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span>{icon}</span>
                  {tool.toolName}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[tool.status]}`}>
                {statusIcons[tool.status]} {tool.status}
              </span>

              {Object.keys(tool.input).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Input:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                </div>
              )}

              {tool.output && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Output:</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-auto text-sm font-mono">
                    <pre
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(tool.output, detectLanguage())
                      }}
                    />
                  </div>
                </div>
              )}

              {tool.error && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-red-600">Error:</h4>
                  <pre className="bg-red-50 p-3 rounded text-sm overflow-auto text-red-800">
                    {tool.error}
                  </pre>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                {tool.timestamp.toLocaleString()}
                {tool.duration && ` • ${formatDuration(tool.duration)}`}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant (original behavior)
  return (
    <div className={`border rounded-lg ${colorClass} mb-3 overflow-hidden transition-all shadow-sm hover:shadow-md`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              {tool.toolName}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tool.status]}`}>
                {statusIcons[tool.status]} {tool.status}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1 font-mono truncate max-w-xl">
              {formatInput()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tool.duration && (
            <span className="text-xs text-gray-500">
              {formatDuration(tool.duration)}
            </span>
          )}
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-300 bg-white">
          {/* Input Details */}
          {Object.keys(tool.input).length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-2">Input</div>
              <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output/Error */}
          {(tool.output || tool.error) && (
            <div className="p-4">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                {tool.error ? 'Error' : 'Output'}
              </div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs font-mono">
                {tool.error ? (
                  <div className="text-red-400">{tool.error}</div>
                ) : tool.output ? (
                  // Try syntax highlighting for code output
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(tool.output, detectLanguage())
                    }}
                  />
                ) : (
                  <div className="text-gray-400 italic">No output</div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
            {tool.timestamp.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
