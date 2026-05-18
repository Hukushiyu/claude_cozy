/**
 * Platform detection utilities for cross-platform compatibility
 */

export const isMac = process.platform === 'darwin';
export const isWindows = process.platform === 'win32';
export const isLinux = process.platform === 'linux';

/**
 * Get the appropriate modifier key for the current platform
 * @returns '⌘' for Mac, 'Ctrl' for Windows/Linux
 */
export const getModifierKey = (): string => {
  return isMac ? '⌘' : 'Ctrl';
};

/**
 * Get the modifier key name for keyboard shortcuts
 * @returns 'Cmd' for Mac, 'Ctrl' for Windows/Linux
 */
export const getModifierKeyName = (): string => {
  return isMac ? 'Cmd' : 'Ctrl';
};

/**
 * Format a keyboard shortcut for display
 * @param key - The key (e.g., 'B', 'S', 'N')
 * @param useShift - Whether Shift is required
 * @returns Formatted shortcut string (e.g., '⌘+B' or 'Ctrl+B')
 */
export const formatShortcut = (key: string, useShift: boolean = false): string => {
  const modifier = getModifierKey();
  const shift = useShift ? '+Shift' : '';
  return `${modifier}${shift}+${key}`;
};

/**
 * Get platform-specific path separator
 * @returns '/' for Mac/Linux, '\' for Windows
 */
export const getPathSeparator = (): string => {
  return isWindows ? '\\' : '/';
};

/**
 * Get platform name for display
 * @returns 'macOS', 'Windows', or 'Linux'
 */
export const getPlatformName = (): string => {
  if (isMac) return 'macOS';
  if (isWindows) return 'Windows';
  if (isLinux) return 'Linux';
  return 'Unknown';
};
