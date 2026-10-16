/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#000000",
          panel: "#0D0E12",
          border: "#1F222B",
          amber: "#FFB800",
          bullish: "#00FF66",
          bearish: "#FF3333",
          muted: "#858A98",
          surface: "#111319",
          elevated: "#171A22"
        }
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Arial", "Helvetica", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 18px rgba(255,184,0,.08)"
      }
    }
  },
  plugins: []
};
