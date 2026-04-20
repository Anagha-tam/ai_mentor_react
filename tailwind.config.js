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
          navy:           '#111118', // Near-black — primary text
          orange:         '#3B47C2', // Indigo — primary action color
          'orange-hover': '#2D38A8', // Indigo darker for hover
          'orange-light': '#EEF0FB', // Indigo tint background
          secondary:      '#5A5A72', // Muted text
          tertiary:       '#8E44AD', // Purple — kept for semantic use
          cream:          '#F7F7FB', // Cool near-white background
          accent:         '#E87722', // Warm amber — achievement indicators
          success:        '#22A06B', // Cool green
        },
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        panel: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        modal: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
