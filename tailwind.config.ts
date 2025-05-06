import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Updated type scale with better visual hierarchy
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
        "5xl": ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.03em" }],
        "6xl": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
      },
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
        // Data visualization color system
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
          7: "hsl(var(--chart-7))",
          success: "hsl(var(--chart-success))",
          warning: "hsl(var(--chart-warning))",
          error: "hsl(var(--chart-error))",
          info: "hsl(var(--chart-info))",
          neutral: "hsl(var(--chart-neutral))",
          "sequential-1": "hsl(var(--chart-sequential-1))",
          "sequential-2": "hsl(var(--chart-sequential-2))",
          "sequential-3": "hsl(var(--chart-sequential-3))",
          "sequential-4": "hsl(var(--chart-sequential-4))",
          "sequential-5": "hsl(var(--chart-sequential-5))",
          "diverging-negative-2": "hsl(var(--chart-diverging-negative-2))",
          "diverging-negative-1": "hsl(var(--chart-diverging-negative-1))",
          "diverging-neutral": "hsl(var(--chart-diverging-neutral))",
          "diverging-positive-1": "hsl(var(--chart-diverging-positive-1))",
          "diverging-positive-2": "hsl(var(--chart-diverging-positive-2))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Enhanced shadow system for elevations
      boxShadow: {
        // Level 1: Subtle shadow for base elements
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        // Level 2: Moderate shadow for raised elements
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        // Level 3: Pronounced shadow for floating elements
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // Level 4: Significant shadow for overlay elements
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        // Level 5: Maximum elevation for modal elements
        'elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Dark mode shadows with color tints
        'dark-elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(107, 70, 193, 0.05)',
        'dark-elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(107, 70, 193, 0.1)',
        'dark-elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 70, 193, 0.15)',
        'dark-elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(107, 70, 193, 0.2)',
        'dark-elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(107, 70, 193, 0.25)',
      },
      backgroundImage: {
        'elevation-gradient-1': 'var(--gradient-elevation-1)',
        'elevation-gradient-2': 'var(--gradient-elevation-2)',
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
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
      },
      lineHeight: {
        tighter: "1.1", 
        tight: "1.2",
        snug: "1.35",
        relaxed: "1.625",
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
        normal: "0",
        wide: "0.02em",
      },
    },
  },
  plugins: [animate],
} satisfies Config

export default config