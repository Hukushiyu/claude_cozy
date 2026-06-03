/**
 * Theme validation utilities
 */

import { Theme, ThemeColors } from '../types/theme';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const REQUIRED_COLOR_KEYS: (keyof ThemeColors)[] = [
  'bg',
  'sidebarBg',
  'text',
  'textSecondary',
  'accent',
  'accentHover',
  'border',
  'hover',
  'userBubble',
  'assistantBubble',
];

/**
 * Validates if a string is a valid hex color (#RRGGBB format)
 */
export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

/**
 * Validates if a theme object has all required properties and valid color values
 */
export function isValidTheme(theme: any): theme is Theme {
  if (!theme || typeof theme !== 'object') {
    return false;
  }

  // Check required top-level properties
  if (typeof theme.id !== 'string' || !theme.id) {
    return false;
  }

  if (typeof theme.name !== 'string' || !theme.name) {
    return false;
  }

  // Check colors object exists
  if (!theme.colors || typeof theme.colors !== 'object') {
    return false;
  }

  // Check all required color properties exist and are valid hex colors
  for (const key of REQUIRED_COLOR_KEYS) {
    const colorValue = theme.colors[key];
    if (typeof colorValue !== 'string' || !isValidHexColor(colorValue)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a theme name (max 30 chars, removes special characters except spaces and hyphens)
 */
export function sanitizeThemeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s\-]/g, '') // Remove special chars except space and hyphen
    .substring(0, 30); // Limit to 30 characters
}

/**
 * Generates a unique theme ID with timestamp
 */
export function generateCustomThemeId(): string {
  return `custom-${Date.now()}`;
}

/**
 * Validates imported theme JSON and returns error message if invalid
 */
export function validateImportedTheme(jsonString: string): { valid: true; theme: Theme } | { valid: false; error: string } {
  try {
    const parsed = JSON.parse(jsonString);

    if (isValidTheme(parsed)) {
      return { valid: true, theme: parsed };
    } else {
      return {
        valid: false,
        error: 'Invalid theme format. Missing required properties or invalid color values.'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON format. Please check your theme file.'
    };
  }
}
