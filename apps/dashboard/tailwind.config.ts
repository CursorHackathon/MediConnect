import type { Config } from "tailwindcss";

import uiPreset from "../../packages/ui/tailwind.preset";

/** MediConnect glass dashboard (Clinical Ether–inspired tokens). */
const ether = {
  surface: "#f6f6fb",
  "on-surface": "#2d2f33",
  "on-surface-variant": "#5a5b60",
  "surface-container": "#e7e8ee",
  "surface-container-low": "#f0f0f6",
  "surface-container-high": "#e1e2e8",
  "surface-container-highest": "#dbdde3",
  "outline-variant": "#acadb1",
} as const satisfies Record<string, string>;

export default {
  presets: [uiPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ether,
      },
      fontFamily: {
        "ether-headline": ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        "ether-body": ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Config;
