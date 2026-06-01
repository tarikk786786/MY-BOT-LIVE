/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#050505',
          900: '#0a0a0f',
          800: '#0f0f14',
          700: '#14141a',
        },
        emerald: {
          glow: '#10b981',
          dark: '#059669',
        },
        amethyst: {
          glow: '#8b5cf6',
          dark: '#7c3aed',
        },
        silver: {
          DEFAULT: '#a1a1aa',
          light: '#e4e4e7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'aurora': 'aurora 15s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        aurora: {
          '0%': { backgroundPosition: '50% 50%, 50% 50%' },
          '100%': { backgroundPosition: '350% 50%, 350% 50%' },
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '24px',
      },
      boxShadow: {
        'glow-emerald': '0 0 40px -10px rgba(16, 185, 129, 0.3)',
        'glow-amethyst': '0 0 40px -10px rgba(139, 92, 246, 0.3)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
};
