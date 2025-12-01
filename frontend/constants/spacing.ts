/**
 * Sistema de Espaçamento Centralizado - Agenda+
 * 
 * Define espaçamentos padronizados para garantir consistência visual.
 */

export const SPACING = {
  // Padding
  card: 'p-6',
  cardCompact: 'p-4',
  cardLoose: 'p-8',
  
  // Gap entre elementos
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  
  // Espaçamento vertical
  section: 'space-y-6',
  sectionCompact: 'space-y-4',
  sectionLoose: 'space-y-8',
  
  // Margin
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  page: 'p-6',
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

