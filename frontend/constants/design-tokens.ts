/**
 * Design Tokens Completo - Agenda+
 * 
 * Sistema centralizado de tokens de design para garantir
 * consistência visual e facilitar manutenção.
 */

// ============================================
// TIPOGRAFIA
// ============================================
export const TYPOGRAPHY = {
  // Tamanhos de fonte
  fontSize: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
    '4xl': 'text-4xl',  // 36px
  },
  
  // Pesos de fonte
  fontWeight: {
    normal: 'font-normal',     // 400
    medium: 'font-medium',      // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',          // 700
  },
  
  // Line heights
  lineHeight: {
    tight: 'leading-tight',    // 1.25
    normal: 'leading-normal',   // 1.5
    relaxed: 'leading-relaxed', // 1.75
  },
  
  // Escala de títulos
  heading: {
    h1: 'text-4xl font-bold leading-tight tracking-tight',
    h2: 'text-3xl font-bold leading-tight tracking-tight',
    h3: 'text-2xl font-semibold leading-tight',
    h4: 'text-xl font-semibold leading-tight',
    h5: 'text-lg font-semibold leading-normal',
    h6: 'text-base font-semibold leading-normal',
  },
  
  // Textos de corpo
  body: {
    large: 'text-lg leading-relaxed',
    base: 'text-base leading-normal',
    small: 'text-sm leading-normal',
    tiny: 'text-xs leading-normal',
  },
} as const;

// ============================================
// ESPAÇAMENTO
// ============================================
export const SPACING = {
  // Padding
  padding: {
    xs: 'p-1',    // 4px
    sm: 'p-2',    // 8px
    md: 'p-3',    // 12px
    base: 'p-4',  // 16px
    lg: 'p-6',    // 24px
    xl: 'p-8',    // 32px
    '2xl': 'p-12', // 48px
  },
  
  // Padding horizontal
  paddingX: {
    xs: 'px-1',
    sm: 'px-2',
    md: 'px-3',
    base: 'px-4',
    lg: 'px-6',
    xl: 'px-8',
  },
  
  // Padding vertical
  paddingY: {
    xs: 'py-1',
    sm: 'py-2',
    md: 'py-3',
    base: 'py-4',
    lg: 'py-6',
    xl: 'py-8',
  },
  
  // Margin
  margin: {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-3',
    base: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },
  
  // Gap (para flex/grid)
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    base: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
  },
  
  // Espaçamento vertical (space-y)
  spaceY: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    base: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12',
  },
  
  // Cards
  card: {
    padding: 'p-6',
    paddingCompact: 'p-4',
    paddingLoose: 'p-8',
    gap: 'gap-4',
  },
  
  // Seções
  section: {
    padding: 'p-6',
    gap: 'space-y-6',
    gapCompact: 'space-y-4',
    gapLoose: 'space-y-8',
  },
} as const;

// ============================================
// ELEVAÇÃO (SHADOWS)
// ============================================
export const ELEVATION = {
  none: 'shadow-none',
  sm: 'shadow-sm',           // 0 1px 2px 0
  base: 'shadow',             // 0 1px 3px 0
  md: 'shadow-md',            // 0 4px 6px -1px
  lg: 'shadow-lg',            // 0 10px 15px -3px
  xl: 'shadow-xl',            // 0 20px 25px -5px
  '2xl': 'shadow-2xl',        // 0 25px 50px -12px
  inner: 'shadow-inner',     // inset
  
  // Hover states
  hover: {
    sm: 'hover:shadow-md transition-shadow duration-200',
    md: 'hover:shadow-lg transition-shadow duration-200',
    lg: 'hover:shadow-xl transition-shadow duration-200',
  },
  
  // Focus states
  focus: 'focus:shadow-lg focus:shadow-purple-500/20',
} as const;

// ============================================
// BORDAS E CANTOS
// ============================================
export const BORDERS = {
  // Raio de borda
  radius: {
    none: 'rounded-none',
    sm: 'rounded-sm',      // 2px
    md: 'rounded-md',      // 6px
    base: 'rounded',       // 4px
    lg: 'rounded-lg',     // 8px
    xl: 'rounded-xl',      // 12px
    '2xl': 'rounded-2xl',  // 16px
    full: 'rounded-full',
  },
  
  // Largura de borda
  width: {
    none: 'border-0',
    thin: 'border',
    medium: 'border-2',
    thick: 'border-4',
  },
  
  // Estilo de borda
  style: {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  },
} as const;

// ============================================
// TRANSIÇÕES E ANIMAÇÕES
// ============================================
export const TRANSITIONS = {
  // Duração
  duration: {
    fast: 'duration-150',
    base: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
  },
  
  // Timing function
  easing: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
  
  // Propriedades
  property: {
    all: 'transition-all',
    colors: 'transition-colors',
    transform: 'transition-transform',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',
  },
  
  // Combinações comuns
  common: {
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    shadow: 'transition-shadow duration-200 ease-in-out',
    all: 'transition-all duration-200 ease-in-out',
  },
} as const;

// ============================================
// Z-INDEX
// ============================================
export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-50',
  tooltip: 'z-50',
  notification: 'z-50',
} as const;

// ============================================
// CORES (melhoradas com contraste WCAG AA)
// ============================================
export const COLORS = {
  // Texto com melhor contraste
  text: {
    primary: 'text-slate-900',      // Contraste 15.3:1 em bg-white
    secondary: 'text-slate-700',      // Contraste 8.1:1 em bg-white (melhorado de slate-600)
    tertiary: 'text-slate-600',      // Contraste 5.7:1 em bg-white
    muted: 'text-slate-500',         // Para textos menos importantes
    inverse: 'text-white',
    link: 'text-purple-600 hover:text-purple-700',
    error: 'text-red-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
  },
  
  // Backgrounds
  background: {
    primary: 'bg-white',
    secondary: 'bg-slate-50',
    tertiary: 'bg-slate-100',
    muted: 'bg-slate-200',
    dark: 'bg-slate-900',
    overlay: 'bg-black/50',
  },
  
  // Bordas
  border: {
    default: 'border-slate-200',
    muted: 'border-slate-300',
    focus: 'border-purple-500',
    error: 'border-red-500',
    success: 'border-emerald-500',
    warning: 'border-amber-500',
  },
} as const;

// ============================================
// COMPONENTES ESPECÍFICOS
// ============================================
export const COMPONENT_TOKENS = {
  button: {
    padding: 'px-4 py-2',
    paddingLarge: 'px-6 py-3',
    paddingSmall: 'px-3 py-1.5',
    radius: 'rounded-md',
    fontSize: 'text-sm',
    fontWeight: 'font-medium',
    transition: TRANSITIONS.common.all,
  },
  
  input: {
    padding: 'px-3 py-2',
    radius: 'rounded-md',
    fontSize: 'text-sm',
    border: 'border border-slate-200',
    focus: 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
    error: 'border-red-500 focus:ring-red-500/20',
  },
  
  card: {
    padding: SPACING.card.padding,
    radius: BORDERS.radius.xl,
    border: 'border border-slate-200',
    shadow: ELEVATION.sm,
    shadowHover: ELEVATION.hover.md,
  },
  
  badge: {
    padding: 'px-2.5 py-0.5',
    radius: 'rounded-full',
    fontSize: 'text-xs',
    fontWeight: 'font-medium',
  },
} as const;

