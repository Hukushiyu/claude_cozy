import { CommandSuggestion, FileSuggestion } from '../types/chat';
import type { FileNode } from '../types/ipc';

// Descriptions for Claude CLI built-in commands (baked into the CLI binary, no SKILL.md)
export const BUILTIN_COMMANDS: CommandSuggestion[] = [
  { type: 'command', commandType: 'builtin', name: '/usage',    description: 'Show token usage and cost for the current session', icon: '📊' },
  { type: 'command', commandType: 'builtin', name: '/clear',    description: 'Clear the screen and start a fresh turn', icon: '🗑️' },
  { type: 'command', commandType: 'builtin', name: '/compact',  description: 'Compact conversation context to save tokens', icon: '📦' },
  { type: 'command', commandType: 'builtin', name: '/context',  description: 'Show current context window usage', icon: '📐' },
  { type: 'command', commandType: 'builtin', name: '/init',     description: 'Initialize a new CLAUDE.md file with codebase documentation', icon: '📋' },
  { type: 'command', commandType: 'builtin', name: '/heapdump', description: 'Generate a heap dump for debugging', icon: '🔧' },
  { type: 'command', commandType: 'builtin', name: '/reload-skills', description: 'Reload all skills from disk', icon: '🔄' },
  { type: 'command', commandType: 'builtin', name: '/insights', description: 'Show project insights and statistics', icon: '💡' },
  { type: 'command', commandType: 'builtin', name: '/goal',     description: 'Set or view the current session goal', icon: '🎯' },
];

/**
 * All available slash commands and skills
 * Commands are divided into:
 * - App commands: UI-level commands handled by the app
 * - Builtins: Claude CLI built-in commands (no SKILL.md on disk)
 * - Skills: Claude CLI skills that get sent to Claude for execution
 */
export const SLASH_COMMANDS: CommandSuggestion[] = [
  // App Commands
  {
    type: 'command',
    commandType: 'app',
    name: '/reset-permissions',
    description: 'Reset tool execution permissions',
    icon: '🔒',
  },
  {
    type: 'command',
    commandType: 'app',
    name: '/help',
    description: 'Show help information and keyboard shortcuts',
    icon: '❓',
  },

  // Skills - Configuration & Setup
  {
    type: 'command',
    commandType: 'skill',
    name: '/init',
    description: 'Initialize CLAUDE.md file for your project',
    icon: '📋',
    category: 'configuration',
    usage: '/init',
    examples: ['/init - Creates CLAUDE.md with project instructions']
  },
  {
    type: 'command',
    commandType: 'skill',
    name: '/update-config',
    description: 'Configure Claude Code settings',
    icon: '⚙️',
    category: 'configuration',
    usage: '/update-config',
  },
  {
    type: 'command',
    commandType: 'skill',
    name: '/keybindings-help',
    description: 'Customize keyboard shortcuts',
    icon: '⌨️',
    category: 'configuration',
    usage: '/keybindings-help',
  },
  {
    type: 'command',
    commandType: 'skill',
    name: '/fewer-permission-prompts',
    description: 'Reduce permission prompt frequency',
    icon: '⚡',
    category: 'configuration',
    usage: '/fewer-permission-prompts',
  },

  // Skills - Code Review & Quality
  {
    type: 'command',
    commandType: 'skill',
    name: '/review',
    description: 'Review a pull request or code changes',
    icon: '🔍',
    category: 'code-review',
    usage: '/review [PR_URL or branch]',
    examples: [
      '/review - Reviews current branch changes',
      '/review https://github.com/user/repo/pull/123 - Reviews specific PR'
    ]
  },
  {
    type: 'command',
    commandType: 'skill',
    name: '/security-review',
    description: 'Security review of code changes',
    icon: '🔐',
    category: 'code-review',
    usage: '/security-review [file_or_branch]',
    examples: [
      '/security-review - Reviews current changes',
      '/security-review src/auth.ts - Reviews specific file'
    ]
  },

  // Skills - Workflow Automation
  {
    type: 'command',
    commandType: 'skill',
    name: '/loop',
    description: 'Run command on interval',
    icon: '🔄',
    category: 'workflow',
    usage: '/loop <interval> <command>',
    examples: [
      '/loop 5m npm test - Runs tests every 5 minutes',
      '/loop 1h /review - Reviews changes hourly'
    ]
  },

  // Skills - Simplification & Documentation
  {
    type: 'command',
    commandType: 'skill',
    name: '/simplify',
    description: 'Simplify code or explanations',
    icon: '✨',
    category: 'documentation',
    usage: '/simplify [code_or_text]',
    examples: [
      '/simplify - Simplifies selected code',
      '/simplify @src/complex.ts - Simplifies specific file'
    ]
  },
  {
    type: 'command',
    commandType: 'skill',
    name: '/claude-api',
    description: 'Build with Claude API',
    icon: '🤖',
    category: 'documentation',
    usage: '/claude-api [question]',
    examples: [
      '/claude-api How do I use streaming? - API usage help',
      '/claude-api - General API guidance'
    ]
  },
];

/**
 * Get icon for file based on extension
 */
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const iconMap: Record<string, string> = {
    // Code files
    ts: '🔷',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    py: '🐍',
    java: '☕',
    cpp: '⚙️',
    c: '⚙️',
    rs: '🦀',
    go: '🐹',
    rb: '💎',
    php: '🐘',

    // Config files
    json: '📋',
    yaml: '📋',
    yml: '📋',
    toml: '📋',
    xml: '📋',

    // Web files
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',

    // Documentation
    md: '📄',
    txt: '📄',
    pdf: '📕',

    // Data
    csv: '📊',
    sql: '🗄️',
    db: '🗄️',

    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🎨',

    // Other
    sh: '⚡',
    bat: '⚡',
    exe: '⚙️',
    dll: '⚙️',
  };

  return iconMap[ext] || '📄';
}

/**
 * Flatten file tree into list of file suggestions
 */
export function flattenFileTree(nodes: FileNode[], basePath: string): FileSuggestion[] {
  const files: FileSuggestion[] = [];

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      const relativePath = node.path
        .replace(basePath, '')
        .replace(/\\/g, '/')
        .replace(/^\//, '');

      files.push({
        type: 'file',
        name: node.name,
        relativePath,
        absolutePath: node.path,
        icon: getFileIcon(node.name)
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return files;
}
