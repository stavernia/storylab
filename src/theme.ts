/**
 * Design tokens for Story Craft
 * Provides consistent spacing, radii, shadows, font sizes, and z-indexes
 */

export const theme = {
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
  },
  shadow: {
    card: '0 2px 12px rgba(0, 0, 0, 0.08)',
    modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
  font: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 20,
  },
  z: {
    dropdown: 50,
    sticky: 100,
    modal: 1000,
    toast: 1100,
  },
} as const;

export type Theme = typeof theme;
