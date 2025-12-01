/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './constants/**/*.{js,ts}',
  ],
  // Safelist para garantir que classes dinâmicas de status sejam incluídas
  safelist: [
    // Status badges - light mode
    'bg-amber-100', 'text-amber-800',
    'bg-emerald-100', 'text-emerald-800',
    'bg-blue-100', 'text-blue-800',
    'bg-slate-200', 'text-slate-700',
    'bg-red-100', 'text-red-800',
    // Status badges - dark mode
    'dark:bg-amber-900/50', 'dark:text-amber-300',
    'dark:bg-emerald-900/50', 'dark:text-emerald-300',
    'dark:bg-blue-900/50', 'dark:text-blue-300',
    'dark:bg-slate-700', 'dark:text-slate-300',
    'dark:bg-red-900/50', 'dark:text-red-300',
  ],
  // Otimização: remover classes não utilizadas em produção
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      // Animações otimizadas
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

