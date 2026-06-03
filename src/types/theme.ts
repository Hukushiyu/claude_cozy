/**
 * Theme type definitions
 */

export interface ThemeColors {
  bg: string;
  sidebarBg: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  border: string;
  hover: string;
  userBubble: string;
  assistantBubble: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}
