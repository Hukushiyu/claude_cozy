import { CommandSuggestion, FileSuggestion } from '../types/chat';
import type { FileNode } from '../types/ipc';

/**
 * All available slash commands and skills
 */
export const SLASH_COMMANDS: CommandSuggestion[] = [
  { type: 'command', name: '/help', description: 'Show help information', icon: '❓' },
  { type: 'command', name: '/clear', description: 'Clear conversation history', icon: '🗑️' },
  { type: 'command', name: '/config', description: 'Open configuration settings', icon: '⚙️' },
  { type: 'command', name: '/fast', description: 'Toggle fast mode', icon: '⚡' },
  { type: 'command', name: '/context', description: 'Show context window usage', icon: '📊' },
  { type: 'command', name: '/usage', description: 'Show API usage statistics', icon: '📈' },
  { type: 'command', name: '/compact', description: 'Compact conversation to save tokens', icon: '📦' },
  { type: 'command', name: '/reset-permissions', description: 'Reset tool permissions', icon: '🔐' },
  { type: 'command', name: '/update-config', description: 'Configure Claude Code settings', icon: '🔧' },
  { type: 'command', name: '/keybindings-help', description: 'Customize keyboard shortcuts', icon: '⌨️' },
  { type: 'command', name: '/simplify', description: 'Simplify code or explanations', icon: '✨' },
  { type: 'command', name: '/fewer-permission-prompts', description: 'Reduce permission prompts', icon: '🔕' },
  { type: 'command', name: '/loop', description: 'Run command on interval', icon: '🔄' },
  { type: 'command', name: '/claude-api', description: 'Build with Claude API', icon: '🤖' },
  { type: 'command', name: '/init', description: 'Initialize CLAUDE.md file', icon: '📝' },
  { type: 'command', name: '/review', description: 'Review a pull request', icon: '👀' },
  { type: 'command', name: '/security-review', description: 'Security review of changes', icon: '🔒' },
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
