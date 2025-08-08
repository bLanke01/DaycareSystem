/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        "val": {
          "color-scheme": "light",
          "primary": "oklch(62% 0.265 303.9)",
          "primary-content": "oklch(97% 0.014 308.299)",
          "secondary": "oklch(62% 0.265 303.9)",
          "secondary-content": "oklch(97% 0.014 308.299)",
          "accent": "oklch(86% 0.127 207.078)",
          "accent-content": "oklch(12% 0.042 264.695)",
          "neutral": "oklch(90% 0.063 306.703)",
          "neutral-content": "oklch(28% 0.066 53.813)",
          "base-100": "oklch(96% 0.059 95.617)",
          "base-200": "oklch(89% 0.057 293.283)",
          "base-300": "oklch(92% 0.084 155.995)",
          "base-content": "oklch(28% 0.066 53.813)",
          "info": "oklch(86% 0.127 207.078)",
          "info-content": "oklch(12% 0.042 264.695)",
          "success": "oklch(64% 0.2 131.684)",
          "success-content": "oklch(97% 0.014 308.299)",
          "warning": "oklch(64% 0.222 41.116)",
          "warning-content": "oklch(12% 0.042 264.695)",
          "error": "oklch(64% 0.2 131.684)",
          "error-content": "oklch(97% 0.014 308.299)",
          "--rounded-box": "1rem",
          "--rounded-btn": "2rem", 
          "--rounded-badge": "1rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        }
      }
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
  plugins: [require("daisyui")],
}