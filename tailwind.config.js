module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom Purple Neon Theme
        primary: {
          50: "#f4c5e7",
          100: "#f63ae6",
          200: "#b354c3",
          300: "#8f5863",
          400: "#5d2a73",
          500: "#361b43",
          600: "#2d1836",
          700: "#1f0f25",
          800: "#150a1a",
          900: "#0a0510",
        },
        neon: {
          pink: "#f63ae6",
          purple: "#b354c3",
          glow: "rgba(246, 58, 230, 0.5)",
        },
        "neon-pink": "#f63ae6",
        "neon-purple": "#b354c3",
        bg: {
          primary: "#361b43",
          secondary: "#5d2a73",
          tertiary: "#2d1836",
          accent: "rgba(93, 42, 115, 0.8)",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)"],
        poppins: ["var(--font-poppins)"],
      },
      animation: {
        "bounce-slow": "bounceSlow 2s infinite",
        "bounce-reverse": "bounceReverse 2s infinite",
        "pulse-neon": "pulseNeon 2s ease-in-out infinite alternate",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        bounceReverse: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        pulseNeon: {
          "0%": {
            boxShadow: "0 0 5px #f63ae6, 0 0 10px #f63ae6, 0 0 15px #f63ae6",
            transform: "scale(1)",
          },
          "100%": {
            boxShadow: "0 0 10px #f63ae6, 0 0 20px #f63ae6, 0 0 30px #f63ae6",
            transform: "scale(1.02)",
          },
        },
        glow: {
          "0%": {
            textShadow: "0 0 5px #f63ae6, 0 0 10px #f63ae6, 0 0 15px #f63ae6",
          },
          "100%": {
            textShadow:
              "0 0 10px #f63ae6, 0 0 20px #f63ae6, 0 0 30px #f63ae6, 0 0 40px #f63ae6",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      boxShadow: {
        "neon-pink": "0 0 20px rgba(246, 58, 230, 0.6)",
        "neon-purple": "0 0 20px rgba(179, 84, 195, 0.6)",
        "neon-intense":
          "0 0 30px rgba(246, 58, 230, 0.8), 0 0 60px rgba(179, 84, 195, 0.6)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },
      fontSize: {
        "8xl": ["6rem", { lineHeight: "1" }],
      },
      fontWeight: {
        black: "900",
        extrabold: "800",
      },
      backdropBlur: {
        "2xl": "40px",
        xl: "24px",
        md: "12px",
      },
    },
  },
  plugins: [],
};
