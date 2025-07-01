/**
 * PictoNet Design System - Material Design 3 Configuration
 * Central configuration for typography, colors, spacing, and design tokens
 */

// Base configuration
export const DesignTokens = {
  // Typography scale based on Material Design 3 + AAC optimization
  typography: {
    baseFontSize: 16, // Base font size in pixels
    fontFamily: {
      primary: '"Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      secondary: '"Lexend", "Courier New", monospace',
      display: '"Lexend", sans-serif',
      interface: '"Lexend", sans-serif', // Specific for UI elements
    },
    // AAC-specific text transformations
    textTransform: {
      none: 'none',
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
    },
    // AAC-optimized font weights
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    scale: {
      // Material Design 3 type scale
      display: {
        large: {
          size: 57,
          weight: 400,
          lineHeight: 1.12,
          letterSpacing: -0.25,
        },
        medium: { size: 45, weight: 400, lineHeight: 1.16, letterSpacing: 0 },
        small: { size: 36, weight: 400, lineHeight: 1.22, letterSpacing: 0 },
      },
      headline: {
        large: { size: 32, weight: 400, lineHeight: 1.25, letterSpacing: 0 },
        medium: { size: 28, weight: 400, lineHeight: 1.29, letterSpacing: 0 },
        small: { size: 24, weight: 400, lineHeight: 1.33, letterSpacing: 0 },
      },
      title: {
        large: { size: 22, weight: 400, lineHeight: 1.27, letterSpacing: 0 },
        medium: { size: 16, weight: 500, lineHeight: 1.5, letterSpacing: 0.15 },
        small: { size: 14, weight: 500, lineHeight: 1.43, letterSpacing: 0.1 },
      },
      body: {
        large: { size: 16, weight: 400, lineHeight: 1.5, letterSpacing: 0.5 },
        medium: {
          size: 14,
          weight: 400,
          lineHeight: 1.43,
          letterSpacing: 0.25,
        },
        small: { size: 12, weight: 400, lineHeight: 1.33, letterSpacing: 0.4 },
      },
      label: {
        large: { size: 14, weight: 500, lineHeight: 1.43, letterSpacing: 0.1 },
        medium: { size: 12, weight: 500, lineHeight: 1.33, letterSpacing: 0.5 },
        small: { size: 11, weight: 500, lineHeight: 1.45, letterSpacing: 0.5 },
      },
    },
  },

  // Material Design 3 Color System
  colors: {
    // Primary color scheme
    primary: {
      main: "#6750A4",
      container: "#EADDFF",
      onPrimary: "#FFFFFF",
      onContainer: "#21005D",
    },
    // Secondary color scheme
    secondary: {
      main: "#625B71",
      container: "#E8DEF8",
      onSecondary: "#FFFFFF",
      onContainer: "#1D192B",
    },
    // Tertiary color scheme
    tertiary: {
      main: "#7D5260",
      container: "#FFD8E4",
      onTertiary: "#FFFFFF",
      onContainer: "#31111D",
    },
    // Error color scheme
    error: {
      main: "#B3261E",
      container: "#F9DEDC",
      onError: "#FFFFFF",
      onContainer: "#410E0B",
    },
    // Surface colors
    surface: {
      main: "#FEF7FF",
      variant: "#E7E0EC",
      onSurface: "#1C1B1F",
      onVariant: "#49454F",
      onSurfaceVariant: "#49454F",
    },
    // Background colors
    background: {
      main: "#FEF7FF",
      onBackground: "#1C1B1F",
    },
    // Outline colors
    outline: {
      main: "#79747E",
      variant: "#CAC4D0",
    },
    // PictoNet specific colors (AAC optimized)
    pictonet: {
      cream: {
        50: "#FEFCF8",
        100: "#FDF9F0",
        200: "#F9F1E0",
        300: "#F5E9D0",
        400: "#F0E0BF",
        500: "#EBD7AF",
        600: "#D4C29E",
        700: "#B8A888",
        800: "#9C8E72",
        900: "#80745C",
      },
      contrast: {
        high: "#000000",
        medium: "#5F5F5F",
        low: "#8C8C8C",
      },
    },
  },

  // Spacing system (based on 4px grid)
  spacing: {
    unit: 4, // Base spacing unit
    scale: {
      xs: 4, // 4px
      sm: 8, // 8px
      md: 16, // 16px
      lg: 24, // 24px
      xl: 32, // 32px
      "2xl": 48, // 48px
      "3xl": 64, // 64px
      "4xl": 80, // 80px
    },
  },

  // Border radius system
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    full: 9999,
  },

  // Elevation system (Material Design 3)
  elevation: {
    level0: {
      boxShadow: "none",
      elevation: 0,
    },
    level1: {
      boxShadow:
        "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
      elevation: 1,
    },
    level2: {
      boxShadow:
        "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
      elevation: 3,
    },
    level3: {
      boxShadow:
        "0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
      elevation: 6,
    },
    level4: {
      boxShadow:
        "0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
      elevation: 8,
    },
    level5: {
      boxShadow:
        "0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",
      elevation: 12,
    },
  },

  // Animation and transitions
  animation: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "500ms",
    },
    easing: {
      standard: "cubic-bezier(0.2, 0.0, 0, 1.0)",
      decelerated: "cubic-bezier(0.0, 0.0, 0, 1.0)",
      accelerated: "cubic-bezier(0.3, 0.0, 1, 1.0)",
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    compact: "0px", // 0-599px (phones)
    medium: "600px", // 600-839px (tablets)
    expanded: "840px", // 840-1199px (laptops)
    large: "1200px", // 1200-1599px (desktops)
    extraLarge: "1600px", // 1600px+ (large displays)
  },
} as const;

// Utility functions for accessing design tokens
export const getTypography = (
  category: keyof typeof DesignTokens.typography.scale,
  size: "large" | "medium" | "small",
  options?: {
    textTransform?: keyof typeof DesignTokens.typography.textTransform;
    fontWeight?: keyof typeof DesignTokens.typography.fontWeight;
    fontFamily?: keyof typeof DesignTokens.typography.fontFamily;
  }
) => {
  const scale = DesignTokens.typography.scale[category][size];
  return {
    fontSize: `${scale.size}px`,
    fontWeight: options?.fontWeight ? DesignTokens.typography.fontWeight[options.fontWeight] : scale.weight,
    lineHeight: scale.lineHeight,
    letterSpacing: `${scale.letterSpacing}px`,
    fontFamily: options?.fontFamily ? DesignTokens.typography.fontFamily[options.fontFamily] : DesignTokens.typography.fontFamily.interface,
    textTransform: options?.textTransform ? DesignTokens.typography.textTransform[options.textTransform] : 'none',
  };
};

// Helper function specifically for AAC interface text (often uppercase)
export const getAACTypography = (
  category: keyof typeof DesignTokens.typography.scale,
  size: "large" | "medium" | "small",
  uppercase: boolean = true
) => {
  return getTypography(category, size, {
    textTransform: uppercase ? 'uppercase' : 'none',
    fontFamily: 'interface',
    fontWeight: 'medium'
  });
};

export const getSpacing = (size: keyof typeof DesignTokens.spacing.scale) => {
  return `${DesignTokens.spacing.scale[size]}px`;
};

export const getColor = (colorPath: string) => {
  // Check if we're in dark mode
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
  // Handle CSS variable mappings for dynamic theming
  const cssVariableMap: Record<string, string> = {
    'surface.main': isDark ? 'var(--color-surface-main, #1C1B1F)' : 'var(--color-surface-main, #FEF7FF)',
    'surface.variant': isDark ? 'var(--color-surface-variant, #49454F)' : 'var(--color-surface-variant, #E7E0EC)',
    'surface.onSurface': isDark ? 'var(--color-surface-on-surface, #E6E1E5)' : 'var(--color-surface-on-surface, #1C1B1F)',
    'surface.onVariant': isDark ? 'var(--color-surface-on-variant, #CAC4D0)' : 'var(--color-surface-on-variant, #49454F)',
    'background.main': isDark ? 'var(--color-background-main, #1C1B1F)' : 'var(--color-background-main, #FEF7FF)',
    'background.onBackground': isDark ? 'var(--color-background-on-background, #E6E1E5)' : 'var(--color-background-on-background, #1C1B1F)',
    'primary.main': isDark ? 'var(--color-primary-main, #D0BCFF)' : 'var(--color-primary-main, #6750A4)',
    'primary.container': isDark ? 'var(--color-primary-container, #4F378B)' : 'var(--color-primary-container, #EADDFF)',
    'primary.onContainer': isDark ? 'var(--color-primary-on-container, #EADDFF)' : 'var(--color-primary-on-container, #21005D)',
    'secondary.main': isDark ? 'var(--color-secondary-main, #CCC2DC)' : 'var(--color-secondary-main, #625B71)',
    'secondary.container': isDark ? 'var(--color-secondary-container, #4A4458)' : 'var(--color-secondary-container, #E8DEF8)',
    'outline.main': isDark ? 'var(--color-outline-main, #938F99)' : 'var(--color-outline-main, #79747E)',
    'outline.variant': isDark ? 'var(--color-outline-variant, #49454F)' : 'var(--color-outline-variant, #CAC4D0)'
  };

  // Check if we have a direct CSS variable mapping
  if (cssVariableMap[colorPath]) {
    return cssVariableMap[colorPath];
  }

  // Fallback to static color lookup
  const keys = colorPath.split(".");
  let value: any = DesignTokens.colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found in design tokens`);
      return isDark ? '#E6E1E5' : '#1C1B1F'; // Theme-aware fallback
    }
  }

  return value;
};

// Function specifically for SVG elements that need solid colors, not CSS variables
export const getSvgColor = (colorPath: string) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
  // Direct color mappings for SVG (no CSS variables)
  const svgColorMap: Record<string, string> = {
    'surface.main': isDark ? '#1C1B1F' : '#FEF7FF',
    'surface.variant': isDark ? '#49454F' : '#E7E0EC',
    'surface.onSurface': isDark ? '#E6E1E5' : '#1C1B1F',
    'surface.onVariant': isDark ? '#CAC4D0' : '#49454F',
    'background.main': isDark ? '#1C1B1F' : '#FEF7FF',
    'background.onBackground': isDark ? '#E6E1E5' : '#1C1B1F',
    'primary.main': isDark ? '#D0BCFF' : '#6750A4',
    'primary.container': isDark ? '#4F378B' : '#EADDFF',
    'primary.onContainer': isDark ? '#EADDFF' : '#21005D',
    'secondary.main': isDark ? '#CCC2DC' : '#625B71',
    'secondary.container': isDark ? '#4A4458' : '#E8DEF8',
    'outline.main': isDark ? '#938F99' : '#79747E',
    'outline.variant': isDark ? '#49454F' : '#CAC4D0',
    'error.main': isDark ? '#F2B8B5' : '#B3261E'
  };

  // Check if we have a direct SVG color mapping
  if (svgColorMap[colorPath]) {
    return svgColorMap[colorPath];
  }

  // Fallback to static color lookup
  const keys = colorPath.split(".");
  let value: any = DesignTokens.colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      return isDark ? '#E6E1E5' : '#1C1B1F'; // Theme-aware fallback
    }
  }

  return value;
};

export const getBorderRadius = (
  size: keyof typeof DesignTokens.borderRadius,
) => {
  return `${DesignTokens.borderRadius[size]}px`;
};

export const getElevation = (level: keyof typeof DesignTokens.elevation) => {
  return DesignTokens.elevation[level];
};

// CSS custom properties generator
export const generateCSSVariables = () => {
  const variables: Record<string, string> = {};

  // Typography variables
  variables["--font-family-primary"] =
    DesignTokens.typography.fontFamily.primary;
  variables["--font-family-secondary"] =
    DesignTokens.typography.fontFamily.secondary;
  variables["--font-family-display"] =
    DesignTokens.typography.fontFamily.display;
  variables["--font-size-base"] = `${DesignTokens.typography.baseFontSize}px`;

  // Color variables
  const flattenColors = (obj: any, prefix = "--color") => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        flattenColors(value, `${prefix}-${key}`);
      } else {
        variables[`${prefix}-${key}`] = value as string;
      }
    });
  };
  flattenColors(DesignTokens.colors);

  // Spacing variables
  Object.entries(DesignTokens.spacing.scale).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = `${value}px`;
  });

  // Border radius variables
  Object.entries(DesignTokens.borderRadius).forEach(([key, value]) => {
    variables[`--border-radius-${key}`] = `${value}px`;
  });

  return variables;
};

// Type definitions for TypeScript support
export type TypographyCategory = keyof typeof DesignTokens.typography.scale;
export type TypographySize = "large" | "medium" | "small";
export type SpacingSize = keyof typeof DesignTokens.spacing.scale;
export type BorderRadiusSize = keyof typeof DesignTokens.borderRadius;
export type ElevationLevel = keyof typeof DesignTokens.elevation;
