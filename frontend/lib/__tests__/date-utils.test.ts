import {
  formatDate,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameWeek,
  getDay,
} from '../date-utils';

describe('date-utils', () => {
  // Use uma data fixa para testes consistentes
  const fixedDate = new Date('2025-11-15T10:30:00');

  describe('formatDate', () => {
    it('deve formatar data no formato yyyy-MM-dd', () => {
      const result = formatDate(fixedDate, 'yyyy-MM-dd');
      expect(result).toBe('2025-11-15');
    });

    it('deve formatar data no formato dd/MM/yyyy', () => {
      const result = formatDate(fixedDate, 'dd/MM/yyyy');
      expect(result).toBe('15/11/2025');
    });

    it('deve formatar hora no formato HH:mm', () => {
      const result = formatDate(fixedDate, 'HH:mm');
      expect(result).toBe('10:30');
    });

    it('deve formatar apenas o dia', () => {
      const result = formatDate(fixedDate, 'd');
      expect(result).toBe('15');
    });

    it('deve formatar mês e ano', () => {
      const result = formatDate(fixedDate, 'MMMM yyyy');
      expect(result).toMatch(/novembro/i);
      expect(result).toMatch(/2025/);
    });

    it('deve formatar mês de ano', () => {
      const result = formatDate(fixedDate, "MMMM 'de' yyyy");
      expect(result).toMatch(/novembro/i);
      expect(result).toContain('de');
      expect(result).toMatch(/2025/);
    });

    it('deve formatar dia da semana completo', () => {
      const result = formatDate(fixedDate, "EEEE, d 'de' MMMM");
      expect(result).toMatch(/sábado/i);
      expect(result).toContain('15');
      expect(result).toMatch(/novembro/i);
    });

    it('deve formatar dia da semana completo com ano', () => {
      const result = formatDate(fixedDate, "EEEE, d 'de' MMMM 'de' yyyy");
      expect(result).toMatch(/sábado/i);
      expect(result).toContain('2025');
    });

    it('deve usar formato padrão para formato desconhecido', () => {
      const result = formatDate(fixedDate, 'unknown');
      expect(result).toBeTruthy();
    });

    it('deve aceitar timestamp numérico', () => {
      const timestamp = fixedDate.getTime();
      const result = formatDate(timestamp, 'dd/MM/yyyy');
      expect(result).toBe('15/11/2025');
    });
  });

  describe('startOfMonth', () => {
    it('deve retornar o primeiro dia do mês', () => {
      const result = startOfMonth(fixedDate);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(10); // Novembro
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('endOfMonth', () => {
    it('deve retornar o último dia do mês', () => {
      const result = endOfMonth(fixedDate);
      expect(result.getDate()).toBe(30); // Novembro tem 30 dias
      expect(result.getMonth()).toBe(10);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });

    it('deve funcionar para fevereiro em ano não bissexto', () => {
      const feb2025 = new Date('2025-02-15');
      const result = endOfMonth(feb2025);
      expect(result.getDate()).toBe(28);
    });

    it('deve funcionar para fevereiro em ano bissexto', () => {
      const feb2024 = new Date('2024-02-15');
      const result = endOfMonth(feb2024);
      expect(result.getDate()).toBe(29);
    });
  });

  describe('eachDayOfInterval', () => {
    it('deve retornar todos os dias do intervalo', () => {
      const start = new Date('2025-11-01');
      const end = new Date('2025-11-05');
      const result = eachDayOfInterval({ start, end });
      expect(result).toHaveLength(5);
      expect(result[0].getDate()).toBe(1);
      expect(result[4].getDate()).toBe(5);
    });

    it('deve retornar um dia para intervalo de mesmo dia', () => {
      const date = new Date('2025-11-15');
      const result = eachDayOfInterval({ start: date, end: date });
      expect(result).toHaveLength(1);
    });
  });

  describe('isSameMonth', () => {
    it('deve retornar true para mesma data', () => {
      expect(isSameMonth(fixedDate, fixedDate)).toBe(true);
    });

    it('deve retornar true para datas do mesmo mês', () => {
      const other = new Date('2025-11-01');
      expect(isSameMonth(fixedDate, other)).toBe(true);
    });

    it('deve retornar false para meses diferentes', () => {
      const other = new Date('2025-10-15');
      expect(isSameMonth(fixedDate, other)).toBe(false);
    });

    it('deve retornar false para anos diferentes', () => {
      const other = new Date('2024-11-15');
      expect(isSameMonth(fixedDate, other)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('deve retornar true para mesma data', () => {
      expect(isSameDay(fixedDate, fixedDate)).toBe(true);
    });

    it('deve retornar true para mesmo dia com horas diferentes', () => {
      const morning = new Date('2025-11-15T08:00:00');
      const evening = new Date('2025-11-15T20:00:00');
      expect(isSameDay(morning, evening)).toBe(true);
    });

    it('deve retornar false para dias diferentes', () => {
      const other = new Date('2025-11-16');
      expect(isSameDay(fixedDate, other)).toBe(false);
    });
  });

  describe('startOfWeek', () => {
    it('deve retornar segunda-feira como início da semana por padrão', () => {
      // 15/11/2025 é sábado, segunda anterior é 10/11
      const result = startOfWeek(fixedDate);
      expect(result.getDate()).toBe(10);
      expect(result.getDay()).toBe(1); // Segunda-feira
    });

    it('deve permitir configurar início da semana', () => {
      // Com domingo como início (0)
      const result = startOfWeek(fixedDate, { weekStartsOn: 0 });
      expect(result.getDate()).toBe(9);
      expect(result.getDay()).toBe(0); // Domingo
    });
  });

  describe('endOfWeek', () => {
    it('deve retornar domingo como fim da semana por padrão', () => {
      // Início segunda 10/11, fim domingo 16/11
      const result = endOfWeek(fixedDate);
      expect(result.getDate()).toBe(16);
      expect(result.getDay()).toBe(0); // Domingo
      expect(result.getHours()).toBe(23);
    });
  });

  describe('addMonths', () => {
    it('deve adicionar meses corretamente', () => {
      const result = addMonths(fixedDate, 2);
      expect(result.getMonth()).toBe(0); // Janeiro
      expect(result.getFullYear()).toBe(2026);
    });

    it('deve lidar com anos anteriores', () => {
      const result = addMonths(fixedDate, -12);
      expect(result.getMonth()).toBe(10); // Novembro
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('subMonths', () => {
    it('deve subtrair meses corretamente', () => {
      const result = subMonths(fixedDate, 2);
      expect(result.getMonth()).toBe(8); // Setembro
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('addDays', () => {
    it('deve adicionar dias corretamente', () => {
      const date = new Date('2025-11-28');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(3);
      expect(result.getMonth()).toBe(11); // Dezembro
    });

    it('deve subtrair dias com valor negativo', () => {
      const date = new Date('2025-11-05');
      const result = addDays(date, -10);
      expect(result.getDate()).toBe(26);
      expect(result.getMonth()).toBe(9); // Outubro
    });
  });

  describe('isSameWeek', () => {
    it('deve retornar true para datas na mesma semana', () => {
      const date1 = new Date('2025-11-10'); // Segunda
      const date2 = new Date('2025-11-14'); // Sexta
      expect(isSameWeek(date1, date2)).toBe(true);
    });

    it('deve retornar false para datas em semanas diferentes', () => {
      const date1 = new Date('2025-11-10');
      const date2 = new Date('2025-11-17');
      expect(isSameWeek(date1, date2)).toBe(false);
    });

    it('deve respeitar weekStartsOn com domingo como início', () => {
      // Com domingo como início (0)
      const saturday = new Date('2025-11-15');
      const nextSunday = new Date('2025-11-16');
      // Com domingo como início, sábado e domingo seguinte são semanas diferentes
      // porque domingo inicia uma nova semana
      expect(isSameWeek(saturday, nextSunday, { weekStartsOn: 0 })).toBe(false);
    });

    it('deve considerar segunda e domingo da mesma semana quando weekStartsOn é 1', () => {
      // Segunda 10/11 e Domingo 16/11 - mesma semana quando segunda é início
      const monday = new Date('2025-11-10');
      const sunday = new Date('2025-11-16');
      expect(isSameWeek(monday, sunday, { weekStartsOn: 1 })).toBe(true);
    });
  });

  describe('getDay', () => {
    it('deve retornar o dia da semana correto', () => {
      // 15/11/2025 é sábado (6)
      expect(getDay(fixedDate)).toBe(6);
    });

    it('deve retornar 0 para domingo', () => {
      const sunday = new Date('2025-11-16');
      expect(getDay(sunday)).toBe(0);
    });

    it('deve retornar 1 para segunda', () => {
      const monday = new Date('2025-11-10');
      expect(getDay(monday)).toBe(1);
    });
  });
});
