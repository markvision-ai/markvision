import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted: "hsl(var(--sidebar-muted))",
        },
        medical: {
          blue: "hsl(var(--medical-blue))",
          teal: "hsl(var(--medical-teal))",
        },
        // Super-Level Platform Design Tokens
        space: {
          void: "#020617",
          nebula: "hsl(222 47% 11%)",
          dust: "hsl(217 33% 17%)",
        },
        glow: {
          cyan: "hsl(180 100% 50%)",
          purple: "hsl(270 100% 60%)",
          blue: "#3b82f6",
          orange: "#f97316",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          elevated: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.1)",
          "border-hover": "rgba(255, 255, 255, 0.2)",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "1.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "progress": {
          from: { width: "0%" },
          to: { width: "var(--progress-width)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        // Interstellar animations
        "nebula-drift": {
          "0%": { filter: "hue-rotate(0deg) saturate(1)", transform: "scale(1)" },
          "50%": { filter: "hue-rotate(10deg) saturate(1.1)", transform: "scale(1.02)" },
          "100%": { filter: "hue-rotate(-5deg) saturate(1.05)", transform: "scale(1)" },
        },
        "interstellar-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "interstellar-glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(192 100% 50% / 0.2), 0 0 40px hsl(192 100% 50% / 0.1)",
          },
          "50%": {
            boxShadow: "0 0 30px hsl(192 100% 50% / 0.35), 0 0 60px hsl(192 100% 50% / 0.15)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "progress": "progress 1s ease-out forwards",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        // Interstellar animations
        "nebula-drift": "nebula-drift 60s ease-in-out infinite alternate",
        "interstellar-float": "interstellar-float 6s ease-in-out infinite",
        "interstellar-glow-pulse": "interstellar-glow-pulse 3s ease-in-out infinite",
      },
      boxShadow: {
        'glow': '0 0 20px hsl(var(--primary) / 0.2), 0 0 40px hsl(var(--primary) / 0.1)',
        'glow-lg': '0 0 30px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.15)',
        'card-hover': '0 8px 30px hsl(var(--primary) / 0.08), 0 0 60px hsl(var(--primary) / 0.05)',
        // Interstellar shadows
        'interstellar': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'interstellar-hover': '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px hsl(192 100% 50% / 0.15)',
        'interstellar-glow': '0 0 30px hsl(192 100% 50% / 0.25), 0 0 60px hsl(192 100% 50% / 0.1)',
        'interstellar-glow-strong': '0 0 40px hsl(192 100% 50% / 0.35), 0 0 80px hsl(192 100% 50% / 0.15)',
      },
      backdropBlur: {
        '3xl': '64px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
