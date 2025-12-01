/**
 * Sistema de Cores Profissional para Clínica Médica - Agenda+
 * 
 * Paleta sofisticada e respeitosa adequada para ambiente médico:
 * - Azuis suaves (confiança, tranquilidade, profissionalismo)
 * - Verdes medicinais (saúde, bem-estar)
 * - Tons neutros elegantes
 */

// Cor primária: Azul médico suave (confiança e profissionalismo)
export const PRIMARY_COLORS = {
  50: 'blue-50',
  100: 'blue-100',
  200: 'blue-200',
  300: 'blue-300',
  400: 'blue-400',
  500: 'blue-500',
  600: 'blue-600',
  700: 'blue-700',
  800: 'blue-800',
  900: 'blue-900',
} as const;

// Cor secundária (Blue para ações secundárias)
export const SECONDARY_COLORS = {
  50: 'blue-50',
  100: 'blue-100',
  200: 'blue-200',
  300: 'blue-300',
  400: 'blue-400',
  500: 'blue-500',
  600: 'blue-600',
  700: 'blue-700',
  800: 'blue-800',
  900: 'blue-900',
} as const;

// Cores de status padronizadas
export const STATUS_COLORS = {
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  CONFIRMED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  COMPLETED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  CANCELLED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
  BLOCKED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
  NO_SHOW: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
} as const;

// Cores de fundo
export const BACKGROUND_COLORS = {
  primary: 'bg-white',
  secondary: 'bg-slate-50',
  tertiary: 'bg-slate-100',
  dark: 'bg-slate-900',
} as const;

// Cores de texto com excelente contraste
export const TEXT_COLORS = {
  primary: 'text-slate-900',
  secondary: 'text-slate-700',
  tertiary: 'text-slate-600',
  muted: 'text-slate-500',
  inverse: 'text-white',
  link: 'text-blue-600',
  linkHover: 'text-blue-700',
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
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`;
}

/**
 * Obtém o label traduzido para um status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Não Compareceu',
    BLOCKED: 'Bloqueado',
  };
  return labels[status.toUpperCase()] || status;
}

