/**
 * Unified Color System for APJF Project
 * Theme: Red, White, Black with neutral grays
 */

// Primary Brand Colors (Red Theme)
export const COLORS = {
  // Primary Red Palette
  primary: {
    50: '#fef2f2',   // Very light red background
    100: '#fee2e2',  // Light red background  
    200: '#fecaca',  // Soft red
    300: '#fca5a5',  // Medium light red
    400: '#f87171',  // Medium red
    500: '#ef4444',  // Base red
    600: '#dc2626',  // Dark red (main brand)
    700: '#b91c1c',  // Darker red
    800: '#991b1b',  // Very dark red
    900: '#7f1d1d',  // Darkest red
  },

  // Neutral Grays (Black to White spectrum)
  neutral: {
    50: '#f9fafb',   // Near white
    100: '#f3f4f6',  // Very light gray
    200: '#e5e7eb',  // Light gray
    300: '#d1d5db',  // Medium light gray
    400: '#9ca3af',  // Medium gray
    500: '#6b7280',  // Base gray
    600: '#4b5563',  // Dark gray
    700: '#374151',  // Darker gray
    800: '#1f2937',  // Very dark gray
    900: '#111827',  // Near black
  },

  // Pure colors
  white: '#ffffff',
  black: '#000000',

  // Status Colors (using red tints for consistency)
  status: {
    success: {
      bg: '#fef2f2',      // red-50
      text: '#991b1b',    // red-800
      border: '#fecaca',  // red-200
    },
    warning: {
      bg: '#fef2f2',      // red-50  
      text: '#b91c1c',    // red-700
      border: '#fca5a5',  // red-300
    },
    error: {
      bg: '#fef2f2',      // red-50
      text: '#dc2626',    // red-600
      border: '#f87171',  // red-400
    },
    info: {
      bg: '#f9fafb',      // neutral-50
      text: '#374151',    // neutral-700
      border: '#d1d5db',  // neutral-300
    },
  },

  // Level Badge Colors (Japanese proficiency levels)
  level: {
    N5: {
      bg: '#fef2f2',      // red-50
      text: '#7f1d1d',    // red-900
      border: '#fee2e2',  // red-100
    },
    N4: {
      bg: '#fef2f2',      // red-50
      text: '#991b1b',    // red-800
      border: '#fecaca',  // red-200
    },
    N3: {
      bg: '#fee2e2',      // red-100
      text: '#b91c1c',    // red-700
      border: '#fca5a5',  // red-300
    },
    N2: {
      bg: '#fecaca',      // red-200
      text: '#dc2626',    // red-600
      border: '#f87171',  // red-400
    },
    N1: {
      bg: '#fca5a5',      // red-300
      text: '#7f1d1d',    // red-900
      border: '#ef4444',  // red-500
    },
  },

  // Component specific colors
  components: {
    // Button variants
    button: {
      primary: {
        bg: '#dc2626',        // red-600
        hover: '#b91c1c',     // red-700
        text: '#ffffff',      // white
        ring: '#ef4444',      // red-500
      },
      secondary: {
        bg: '#ffffff',        // white
        hover: '#f9fafb',     // neutral-50
        text: '#dc2626',      // red-600
        border: '#dc2626',    // red-600
        ring: '#ef4444',      // red-500
      },
      ghost: {
        bg: 'transparent',
        hover: '#fef2f2',     // red-50
        text: '#dc2626',      // red-600
        ring: '#ef4444',      // red-500
      },
    },

    // Input fields
    input: {
      bg: '#ffffff',        // white
      border: '#d1d5db',    // neutral-300
      focus: '#dc2626',     // red-600
      text: '#111827',      // neutral-900
      placeholder: '#6b7280', // neutral-500
    },

    // Navigation
    nav: {
      bg: '#ffffff',        // white
      text: '#111827',      // neutral-900
      hover: '#dc2626',     // red-600
      active: '#dc2626',    // red-600
      activeBg: '#fef2f2',  // red-50
    },

    // Cards
    card: {
      bg: '#ffffff',        // white
      border: '#e5e7eb',    // neutral-200
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    },
  },
} as const;

// Helper functions for consistent color usage
export const getColorClass = {
  // Background colors
  bg: {
    primary: 'bg-red-600',
    primaryLight: 'bg-red-50',
    secondary: 'bg-white',
    neutral: 'bg-gray-100',
    success: 'bg-red-50',
    warning: 'bg-red-50',
    error: 'bg-red-50',
  },

  // Text colors
  text: {
    primary: 'text-red-600',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
    white: 'text-white',
    black: 'text-gray-900',
    success: 'text-red-800',
    warning: 'text-red-700',
    error: 'text-red-600',
  },

  // Border colors
  border: {
    default: 'border-gray-200',
    primary: 'border-red-600',
    light: 'border-red-200',
    focus: 'border-red-500',
  },

  // Hover states
  hover: {
    primary: 'hover:bg-red-700',
    secondary: 'hover:bg-red-50',
    text: 'hover:text-red-600',
  },

  // Focus states
  focus: {
    ring: 'focus:ring-red-500',
    border: 'focus:border-red-500',
    outline: 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  },
} as const;

// Level-specific color helpers
export const getLevelColors = (level: string) => {
  switch (level) {
    case 'N5':
      return 'bg-red-50 text-red-900 border-red-100';
    case 'N4':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'N3':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'N2':
      return 'bg-red-200 text-red-600 border-red-400';
    case 'N1':
      return 'bg-red-300 text-red-900 border-red-500';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Status-specific color helpers
export const getStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'success':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'pending':
    case 'in_progress':
    case 'warning':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'inactive':
    case 'error':
    case 'failed':
      return 'bg-red-200 text-red-600 border-red-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Score-specific color helpers (for exams)
export const getScoreColors = (score: number) => {
  if (score >= 90) return 'text-red-900 bg-red-50 border-red-200';
  if (score >= 80) return 'text-red-800 bg-red-50 border-red-200';
  if (score >= 70) return 'text-red-700 bg-red-100 border-red-300';
  if (score >= 60) return 'text-red-600 bg-red-200 border-red-400';
  return 'text-red-500 bg-red-300 border-red-500';
};

export type ColorTheme = typeof COLORS;
