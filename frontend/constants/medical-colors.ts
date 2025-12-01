/**
 * Paleta de Cores Profissional para Clínica Médica - Agenda+
 * 
 * Cores sofisticadas, respeitosas e adequadas para ambiente médico:
 * - Azuis suaves (confiança, tranquilidade)
 * - Verdes medicinais (saúde, bem-estar)
 * - Tons neutros elegantes (profissionalismo)
 */

// Cor primária: Azul médico suave (confiança e profissionalismo)
export const PRIMARY_COLORS = {
  50: 'blue-50',   // #eff6ff - Muito claro
  100: 'blue-100', // #dbeafe
  200: 'blue-200', // #bfdbfe
  300: 'blue-300', // #93c5fd
  400: 'blue-400', // #60a5fa
  500: 'blue-500', // #3b82f6 - Base
  600: 'blue-600', // #2563eb - Primária principal
  700: 'blue-700', // #1d4ed8
  800: 'blue-800', // #1e40af
  900: 'blue-900', // #1e3a8a
} as const;

// Cor secundária: Verde médico (saúde e bem-estar)
export const SECONDARY_COLORS = {
  50: 'emerald-50',   // #ecfdf5
  100: 'emerald-100', // #d1fae5
  200: 'emerald-200', // #a7f3d0
  300: 'emerald-300', // #6ee7b7
  400: 'emerald-400', // #34d399
  500: 'emerald-500', // #10b981
  600: 'emerald-600', // #059669 - Secundária principal
  700: 'emerald-700', // #047857
  800: 'emerald-800', // #065f46
  900: 'emerald-900', // #064e3b
} as const;

// Cores de status profissionais
export const STATUS_COLORS = {
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon: 'text-amber-600',
  },
  CONFIRMED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: 'text-emerald-600',
  },
  COMPLETED: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: 'text-blue-600',
  },
  CANCELLED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    icon: 'text-slate-500',
  },
  BLOCKED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
    icon: 'text-slate-500',
  },
} as const;

// Cores de fundo neutras e elegantes
export const BACKGROUND_COLORS = {
  primary: 'bg-white',
  secondary: 'bg-slate-50',
  tertiary: 'bg-slate-100',
  dark: 'bg-slate-900',
  paper: 'bg-white',
  subtle: 'bg-blue-50/30',
} as const;

// Cores de texto com excelente contraste
export const TEXT_COLORS = {
  primary: 'text-slate-900',      // Contraste 15.3:1
  secondary: 'text-slate-700',    // Contraste 8.1:1
  tertiary: 'text-slate-600',     // Contraste 5.7:1
  muted: 'text-slate-500',        // Para textos menos importantes
  inverse: 'text-white',
  link: 'text-blue-600 hover:text-blue-700',
  linkHover: 'text-blue-700',
  accent: 'text-blue-600',
} as const;

// Cores de borda sutis
export const BORDER_COLORS = {
  default: 'border-slate-200',
  muted: 'border-slate-300',
  focus: 'border-blue-500',
  error: 'border-red-400',
  success: 'border-emerald-500',
  warning: 'border-amber-400',
} as const;

/**
 * Obtém classes de cor para um status específico
 */
export function getStatusColors(status: string) {
  const statusUpper = status.toUpperCase() as keyof typeof STATUS_COLORS;
  return STATUS_COLORS[statusUpper] || STATUS_COLORS.BLOCKED;
}

/**
 * Obtém classes de badge para um status
 */
export function getStatusBadgeClasses(status: string): string {
  const colors = getStatusColors(status);
  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors.badge}`;
}

