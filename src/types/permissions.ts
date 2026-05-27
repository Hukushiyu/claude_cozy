/**
 * Permission modes for tool execution
 * Matches Claude CLI's 6-mode system exactly
 * Maps 1:1 with `--permission-mode` flag values
 */
export type PermissionMode =
  | 'default'             // Ask once per session (CLI default)
  | 'acceptEdits'         // Auto-approve file ops, ask for Bash/risky tools
  | 'bypassPermissions'   // Auto-approve everything (dangerous)
  | 'plan'                // Read-only mode, blocks all writes
  | 'auto'                // Claude decides when to ask
  | 'dontAsk';            // Deny all tools automatically

export interface PermissionModeDisplay {
  text: string;
  color: 'gray' | 'blue' | 'amber' | 'purple' | 'teal' | 'red';
  icon: string;
  description: string;
}

export const PERMISSION_MODE_DISPLAYS: Record<PermissionMode, PermissionModeDisplay> = {
  default: {
    text: 'Ask',
    color: 'gray',
    icon: '🔒',
    description: 'Standard mode, asks before actions (once per session)'
  },
  acceptEdits: {
    text: 'Accept Edits',
    color: 'blue',
    icon: '📝',
    description: 'Auto-approve file edits, ask for Bash and other tools'
  },
  bypassPermissions: {
    text: 'Bypass',
    color: 'amber',
    icon: '⚠️',
    description: 'Auto-approve all tool calls (use with caution)'
  },
  plan: {
    text: 'Plan',
    color: 'purple',
    icon: '📋',
    description: 'Read-only analysis, no changes allowed'
  },
  auto: {
    text: 'Auto',
    color: 'teal',
    icon: '🤖',
    description: 'Claude decides when to ask for permission'
  },
  dontAsk: {
    text: "Don't Ask",
    color: 'red',
    icon: '🚫',
    description: 'Deny all tools that need permission'
  }
};
