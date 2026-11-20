import type { Config } from "tailwindcss";

/**
 * Sistema de color semántico basado en variables CSS (ver app/globals.css).
 * - `white`  → tinta (texto/relleno de alto contraste). Claro en tema oscuro, oscuro en tema claro.
 * - `black`  → sombra (superficies hundidas). Funciona igual en ambos temas.
 * - `canvas` → color de fondo de la app (texto sobre botones de acento/tinta).
 * - `accent` → único color de acento (acción principal y progreso).
 * Así cualquier clase `bg-white/10`, `text-white/70`, etc. se adapta sola al tema.
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: withAlpha("--c-ink"),
        black: withAlpha("--c-sink"),
        canvas: withAlpha("--c-base"),
        raised: withAlpha("--c-raised"),
        accent: {
          DEFAULT: withAlpha("--c-accent"),
          300: withAlpha("--c-accent"),
          400: withAlpha("--c-accent"),
          500: withAlpha("--c-accent"),
          600: withAlpha("--c-accent"),
          200: withAlpha("--c-accent"),
          100: withAlpha("--c-accent"),
        },
        warn: withAlpha("--c-warn"),
        danger: withAlpha("--c-danger"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.75rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgb(var(--c-ink) / 0.06) inset, 0 18px 40px -22px rgb(0 0 0 / 0.55)",
        glow: "0 0 0 1px rgb(var(--c-accent) / 0.35), 0 10px 40px -8px rgb(var(--c-accent) / 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
