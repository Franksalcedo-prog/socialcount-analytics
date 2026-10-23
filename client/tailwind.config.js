/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'text-main': '#0F172A',
        'text-muted': '#64748B',
        'border-ui': '#E2E8F0',
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        facebook: {
          DEFAULT: '#1877F2',
          hover: '#0C63D4',
          light: '#E7F3FF',
        },
        instagram: {
          pink: '#E1306C',
          purple: '#833AB4',
          orange: '#F77737',
          light: '#FDF2F8',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#ECFDF5',
          text: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          text: '#92400E',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEF2F2',
          text: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
      },
      backgroundImage: {
        'ig-gradient': 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      },
    },
  },
  plugins: [],
}
