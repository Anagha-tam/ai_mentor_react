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
          navy:      '#2C3E50', // Tertiary
          orange:    '#F97316', // Primary Button
          'orange-hover': '#EA580C', // Hover
          'orange-light': '#FFF7ED', // Light BG
          secondary: '#5D5C56', // Secondary
          tertiary:  '#8E44AD', // Keeping a complementary purple
          cream:     '#F5F2ED', // Neutral
          accent:    '#DFD7CC', // Warmer accent
          success:   '#27AE60', // Adjusted green for the palette
        },
      },
    },
  },
  plugins: [],
};
