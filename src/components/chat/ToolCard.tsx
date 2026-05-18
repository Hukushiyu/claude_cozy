import { useState } from 'react';
import { ToolEvent } from '../../types/chat';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface ToolCardProps {
  tool: ToolEvent;
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

export function ToolCard({ tool }: ToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="p-4 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-2">Input</div>
            <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>

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
