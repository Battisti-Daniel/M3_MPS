import { 
  PRIMARY_COLORS, 
  SECONDARY_COLORS, 
  STATUS_COLORS, 
  BACKGROUND_COLORS 
} from '../colors';

describe('colors constants', () => {
  describe('PRIMARY_COLORS', () => {
    it('deve conter todas as escalas de cor', () => {
      expect(PRIMARY_COLORS).toHaveProperty('50');
      expect(PRIMARY_COLORS).toHaveProperty('100');
      expect(PRIMARY_COLORS).toHaveProperty('500');
      expect(PRIMARY_COLORS).toHaveProperty('900');
    });

    it('todas as cores devem ser strings', () => {
      Object.values(PRIMARY_COLORS).forEach(color => {
        expect(typeof color).toBe('string');
      });
    });

    it('deve usar paleta blue', () => {
      expect(PRIMARY_COLORS['500']).toContain('blue');
    });
  });

  describe('SECONDARY_COLORS', () => {
    it('deve conter todas as escalas de cor', () => {
      expect(SECONDARY_COLORS).toHaveProperty('50');
      expect(SECONDARY_COLORS).toHaveProperty('100');
      expect(SECONDARY_COLORS).toHaveProperty('500');
      expect(SECONDARY_COLORS).toHaveProperty('900');
    });
  });

  describe('STATUS_COLORS', () => {
    it('deve conter cor para PENDING', () => {
      expect(STATUS_COLORS).toHaveProperty('PENDING');
      expect(STATUS_COLORS.PENDING).toHaveProperty('bg');
      expect(STATUS_COLORS.PENDING).toHaveProperty('text');
      expect(STATUS_COLORS.PENDING).toHaveProperty('border');
      expect(STATUS_COLORS.PENDING).toHaveProperty('badge');
    });

    it('deve conter cor para CONFIRMED', () => {
      expect(STATUS_COLORS).toHaveProperty('CONFIRMED');
      expect(STATUS_COLORS.CONFIRMED.bg).toContain('emerald');
    });

    it('deve conter cor para COMPLETED', () => {
      expect(STATUS_COLORS).toHaveProperty('COMPLETED');
      expect(STATUS_COLORS.COMPLETED.bg).toContain('blue');
    });

    it('deve conter cor para CANCELLED', () => {
      expect(STATUS_COLORS).toHaveProperty('CANCELLED');
      expect(STATUS_COLORS.CANCELLED.bg).toContain('slate');
    });

    it('deve conter cor para BLOCKED', () => {
      expect(STATUS_COLORS).toHaveProperty('BLOCKED');
    });

    it('deve conter cor para NO_SHOW', () => {
      expect(STATUS_COLORS).toHaveProperty('NO_SHOW');
      expect(STATUS_COLORS.NO_SHOW.bg).toContain('red');
    });

    it('todos os status devem ter classes de dark mode', () => {
      Object.values(STATUS_COLORS).forEach(status => {
        expect(status.badge).toContain('dark:');
      });
    });
  });

  describe('BACKGROUND_COLORS', () => {
    it('deve conter cor primária', () => {
      expect(BACKGROUND_COLORS).toHaveProperty('primary');
      expect(BACKGROUND_COLORS.primary).toBe('bg-white');
    });
  });
});
