import type { Config } from "tailwindcss";

import uiPreset from "../../packages/ui/tailwind.preset";

/** Clinical Precision AI — doctor assistant chat (scoped tokens, avoids clashing with shadcn `primary` / `background`). */
const cpaColors = {
  "tertiary-fixed-dim": "#ffb694",
  "primary-container": "#0056b3",
  "primary-fixed": "#d7e2ff",
  "on-background": "#191c1e",
  background: "#f7f9fb",
  "on-primary-fixed-variant": "#004491",
  secondary: "#4c5e84",
  "on-surface-variant": "#424752",
  error: "#ba1a1a",
  primary: "#003f87",
  "on-secondary-container": "#475a7f",
  tertiary: "#722b00",
  "surface-container-highest": "#e0e3e5",
  "surface-container-high": "#e6e8ea",
  "surface-container-lowest": "#ffffff",
  "on-secondary-fixed-variant": "#34476a",
  "surface-dim": "#d8dadc",
  "on-primary": "#ffffff",
  surface: "#f7f9fb",
  "surface-container": "#eceef0",
  "primary-fixed-dim": "#acc7ff",
  "inverse-on-surface": "#eff1f3",
  "on-tertiary-fixed": "#351000",
  "tertiary-container": "#983c00",
  "on-tertiary-fixed-variant": "#7b2f00",
  "surface-bright": "#f7f9fb",
  "tertiary-fixed": "#ffdbcc",
  "inverse-primary": "#acc7ff",
  "secondary-fixed-dim": "#b3c7f1",
  "surface-tint": "#115cb9",
  "on-error-container": "#93000a",
  "on-primary-container": "#bbd0ff",
  "inverse-surface": "#2d3133",
  "on-tertiary": "#ffffff",
  "on-surface": "#191c1e",
  "secondary-fixed": "#d7e2ff",
  "secondary-container": "#bfd2fd",
  "outline-variant": "#c2c6d4",
  "on-primary-fixed": "#001a40",
  "on-secondary-fixed": "#041b3c",
  "on-secondary": "#ffffff",
  "on-tertiary-container": "#ffc2a7",
  "on-error": "#ffffff",
  "surface-variant": "#e0e3e5",
  outline: "#727784",
  "surface-container-low": "#f2f4f6",
  "error-container": "#ffdad6",
} as const;

export default {
  presets: [uiPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cpa: cpaColors,
      },
      fontFamily: {
        "cpa-headline": ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        "cpa-body": ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Config;
