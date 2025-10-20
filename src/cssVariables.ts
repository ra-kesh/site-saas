// Keep these in sync with the CSS variables defined in Tailwind config.
export const cssVariables = {
  breakpoints: {
    "3xl": 1920,
    "2xl": 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640,
  },
} as const;

export type Breakpoints = typeof cssVariables.breakpoints;
