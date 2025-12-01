import { APPOINTMENT_STATUS_OPTIONS } from '../appointments';

describe('appointments constants', () => {
  describe('APPOINTMENT_STATUS_OPTIONS', () => {
    it('deve conter a opção "Todos"', () => {
      const todos = APPOINTMENT_STATUS_OPTIONS.find(opt => opt.value === '');
      expect(todos).toBeDefined();
      expect(todos?.label).toBe('Todos');
    });

    it('deve conter a opção "Pendentes"', () => {
      const pending = APPOINTMENT_STATUS_OPTIONS.find(opt => opt.value === 'PENDING');
      expect(pending).toBeDefined();
      expect(pending?.label).toBe('Pendentes');
    });

    it('deve conter a opção "Confirmadas"', () => {
      const confirmed = APPOINTMENT_STATUS_OPTIONS.find(opt => opt.value === 'CONFIRMED');
      expect(confirmed).toBeDefined();
      expect(confirmed?.label).toBe('Confirmadas');
    });

    it('deve conter a opção "Concluídas"', () => {
      const completed = APPOINTMENT_STATUS_OPTIONS.find(opt => opt.value === 'COMPLETED');
      expect(completed).toBeDefined();
      expect(completed?.label).toBe('Concluídas');
    });

    it('deve conter a opção "Canceladas"', () => {
      const cancelled = APPOINTMENT_STATUS_OPTIONS.find(opt => opt.value === 'CANCELLED');
      expect(cancelled).toBeDefined();
      expect(cancelled?.label).toBe('Canceladas');
    });

    it('deve conter a opção "Faltou"', () => {
      const noShow = APPOINTMENT_STATUS_OPTIONS.find(opt => opt.value === 'NO_SHOW');
      expect(noShow).toBeDefined();
      expect(noShow?.label).toBe('Faltou');
    });

    it('deve conter 6 opções no total', () => {
      expect(APPOINTMENT_STATUS_OPTIONS).toHaveLength(6);
    });

    it('todas as opções devem ter value e label', () => {
      APPOINTMENT_STATUS_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.label).toBe('string');
        expect(typeof option.value).toBe('string');
      });
    });
  });
});
