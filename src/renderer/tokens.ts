// Design tokens — single source of truth for the visual identity

export const colors = {
  // Backgrounds
  bg: {
    base: '#0d0d1a',
    surface: '#14142b',
    elevated: '#1c1c38',
    overlay: '#242440',
  },
  // Borders
  border: {
    subtle: '#2a2a4a',
    default: '#3a3a5c',
    strong: '#5a5a8a',
  },
  // Text
  text: {
    primary: '#e8e8f0',
    secondary: '#9090b8',
    muted: '#5a5a7a',
    inverse: '#0d0d1a',
  },
  // Accent — warm gold/amber
  accent: {
    DEFAULT: '#c8a45a',
    light: '#e0bc78',
    dark: '#a07a38',
    glow: 'rgba(200, 164, 90, 0.15)',
  },
  // Card type colors
  cardType: {
    character: '#7c8fe8',
    event:     '#e87c7c',
    kingdom:   '#7ce8a8',
    lore:      '#c8a45a',
    cult:      '#b87ce8',
    magic:     '#7ce8e8',
    location:  '#e8b87c',
    custom:    '#9090b8',
  },
  // Status
  status: {
    error: '#e87c7c',
    success: '#7ce8a8',
  },
};

export const typography = {
  fontTitle: "'Georgia', 'Times New Roman', serif",
  fontBody: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontMono: "'Fira Code', 'Cascadia Code', monospace",
  scale: {
    xs: '11px',
    sm: '13px',
    base: '15px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.4)',
  md: '0 4px 16px rgba(0,0,0,0.5)',
  lg: '0 8px 32px rgba(0,0,0,0.6)',
  glow: '0 0 24px rgba(200, 164, 90, 0.2)',
};
