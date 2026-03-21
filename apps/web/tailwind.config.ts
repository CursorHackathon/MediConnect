import type { Config } from "tailwindcss";

import uiPreset from "../../packages/ui/tailwind.preset";

export default {
  presets: [uiPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
