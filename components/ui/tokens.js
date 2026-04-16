// Design tokens — shared across all UI primitives
// Keep tight and minimal — only values used in multiple places

import { C } from "../shared";

export { C };
export const F = "'Lexend', sans-serif";

// Spacing scale (multiples of 4)
export const S = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, xxxl: 24, huge: 32,
};

// Border radius scale
export const R = {
  xs: 6, sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, pill: 20,
};

// Font size scale
export const FS = {
  micro: 9, tiny: 10, xs: 11, sm: 12, md: 13, lg: 14, xl: 15, xxl: 17, huge: 22, display: 28,
};

// Font weight scale
export const FW = {
  normal: 500, medium: 600, semibold: 700, bold: 800, black: 900,
};

// Letter spacing for labels/caps
export const LS = {
  tight: -0.5, normal: 0, wide: 1.5, wider: 2, widest: 3,
};
