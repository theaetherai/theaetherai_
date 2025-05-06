import React from 'react'
import { ThemeConfig } from "@/types";

export const LightMode = () => {
  return (
    <svg
      width="282"
      height="193"
      viewBox="0 0 282 193"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 15C0 6.71573 6.71573 0 15 0H267C275.284 0 282 6.71573 282 15V178C282 186.284 275.284 193 267 193H15C6.71573 193 0 186.284 0 178V15Z"
        fill="#F5F5F5"
      />
      <path
        d="M28 42C28 33.7157 34.7157 27 43 27H242C250.284 27 257 33.7157 257 42V193H28V42Z"
        fill="white"
      />
      <circle
        cx="45.5"
        cy="39.5"
        r="4.5"
        fill="#FF6F6F"
      />
      <circle
        cx="58.5"
        cy="39.5"
        r="4.5"
        fill="#FFF500"
      />
      <circle
        cx="71.5"
        cy="39.5"
        r="4.5"
        fill="#9AFF76"
      />
      <rect
        x="44"
        y="67"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="44"
        y="88"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="44"
        y="110"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="44"
        y="132"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="119"
        y="67"
        width="125"
        height="126"
        rx="4"
        fill="#D9D9D9"
      />
      <rect
        x="137"
        width="145"
        height="193"
        fill="#F5F5F5"
      />
      <circle
        cx="45.5"
        cy="39.5"
        r="4.5"
        fill="#FF6F6F"
      />
      <circle
        cx="58.5"
        cy="39.5"
        r="4.5"
        fill="#FFF500"
      />
      <circle
        cx="71.5"
        cy="39.5"
        r="4.5"
        fill="#9AFF76"
      />
      <rect
        x="44"
        y="67"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="44"
        y="88"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="44"
        y="110"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="44"
        y="132"
        width="61"
        height="17"
        rx="3"
        fill="#D9D9D9"
      />
      <path
        d="M137 27H242C250.284 27 257 33.7157 257 42V193H137V27Z"
        fill="white"
      />
      <path
        d="M137 67H238C241.314 67 244 69.6863 244 73V188C244 190.761 241.761 193 239 193H137V67Z"
        fill="#D9D9D9"
      />
      <rect
        x="128"
        y="123"
        width="111"
        height="11"
        rx="3"
        fill="#D9D9D9"
      />
      <rect
        x="137"
        y="123"
        width="102"
        height="11"
        fill="#F8F8F8"
      />
      <rect
        x="194"
        y="137"
        width="45"
        height="6"
        rx="3"
        fill="#F7F7F7"
      />
      <rect
        x="128"
        y="85"
        width="111"
        height="27"
        fill="#F8F8F8"
      />
      <rect
        x="137"
        y="85"
        width="102"
        height="27"
        fill="#F8F8F8"
      />
    </svg>
  )
}

// Define Udemy theme colors
export const udemyThemeColors = {
  background: "white",
  foreground: "#2d2f31", // Udemy dark gray text
  card: {
    DEFAULT: "white",
    foreground: "#2d2f31",
  },
  popover: {
    DEFAULT: "white",
    foreground: "#2d2f31",
  },
  primary: {
    DEFAULT: "#a435f0", // Udemy purple
    foreground: "white",
  },
  secondary: {
    DEFAULT: "#1c1d1f", // Udemy black
    foreground: "white",
  },
  muted: {
    DEFAULT: "#f7f9fa", // Udemy light gray
    foreground: "#6a6f73", // Udemy muted text
  },
  accent: {
    DEFAULT: "#eceb98", // Udemy bestseller badge
    foreground: "#6a540d", // Udemy badge text
  },
  destructive: {
    DEFAULT: "#d64748", // Red for errors/destructive actions
    foreground: "white",
  },
  border: "#d1d7dc", // Udemy border light gray
  input: "#d1d7dc", // Udemy input borders
  ring: "#a435f0", // Match primary
}

export const lightTheme: ThemeConfig = {
  light: {
    default: {
      background: "white",
      foreground: "#2d2f31", // Udemy dark gray text
      card: {
        DEFAULT: "white",
        foreground: "#2d2f31",
      },
      popover: {
        DEFAULT: "white",
        foreground: "#2d2f31",
      },
      primary: {
        DEFAULT: "#a435f0", // Udemy purple
        foreground: "white",
      },
      secondary: {
        DEFAULT: "#1c1d1f", // Udemy black
        foreground: "white",
      },
      muted: {
        DEFAULT: "#f7f9fa", // Udemy light gray
        foreground: "#6a6f73", // Udemy muted text
      },
      accent: {
        DEFAULT: "#eceb98", // Udemy bestseller badge
        foreground: "#6a540d", // Udemy badge text
      },
      destructive: {
        DEFAULT: "#d64748", // Red for errors/destructive actions
        foreground: "white",
      },
      border: "#d1d7dc", // Udemy border light gray
      input: "#d1d7dc", // Udemy input borders
      ring: "#a435f0", // Match primary
    },
  }
}
