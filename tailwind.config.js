/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './hooks/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderWidth: {
        3: '3px',
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "sans-serif"],
        heading: ["Plus Jakarta Sans Variable", "Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        brand: {
          navy:      '#1E293B',
          orange:    '#4F46E5',
          secondary: '#06B6D4',
          tertiary:  '#865CF8',
          cream:     '#F8FAFC',
          accent:    '#EEF2F7',
          success:   '#22C55E',
        },
      },
    },
  },
  plugins: [],
};
