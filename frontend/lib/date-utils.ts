const DEFAULT_WEEK_START = 1; // Monday

const toDate = (value: Date | number): Date => {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
};

const startOfDay = (value: Date | number): Date => {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date | number): Date => {
  const date = toDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const capitalize = (value: string): string => {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Função helper para formatar datas em formatos específicos usados na UI
 * Evita dependência direta do date-fns no Turbopack
 */
export function formatDate(date: Date | number, format: string): string {
  const d = toDate(date);

  switch (format) {
    case 'yyyy-MM-dd': {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    case 'HH:mm': {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    }
    case 'd':
      return String(d.getDate());
    case 'MMMM yyyy': {
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(d);
      return capitalize(formatted);
    }
    case "MMMM 'de' yyyy": {
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(d);
      const [month, year] = capitalize(formatted).split(' de ');
      return `${month} de ${year}`;
    }
    case 'dd/MM/yyyy': {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    case "EEEE, d 'de' MMMM": {
      const weekday = capitalize(
        new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d),
      );
      const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(d);
      return `${weekday}, ${d.getDate()} de ${month}`;
    }
    case "EEEE, d 'de' MMMM 'de' yyyy": {
      const base = formatDate(d, "EEEE, d 'de' MMMM");
      return `${base} de ${d.getFullYear()}`;
    }
    default:
      return d.toLocaleDateString('pt-BR');
  }
}

export function startOfMonth(value: Date | number): Date {
  const date = toDate(value);
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(value: Date | number): Date {
  const date = toDate(value);
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function eachDayOfInterval({
  start,
  end,
}: {
  start: Date;
  end: Date;
}): Date[] {
  const days: Date[] = [];
  const current = startOfDay(start);
  const last = startOfDay(end);

  while (current.getTime() <= last.getTime()) {
    days.push(new Date(current.getTime()));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean {
  const left = toDate(dateLeft);
  const right = toDate(dateRight);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean {
  const left = toDate(dateLeft);
  const right = toDate(dateRight);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

type WeekOptions = {
  weekStartsOn?: number;
};

export function startOfWeek(value: Date | number, options?: WeekOptions): Date {
  const weekStartsOn = options?.weekStartsOn ?? DEFAULT_WEEK_START;
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return startOfDay(date);
}

export function endOfWeek(value: Date | number, options?: WeekOptions): Date {
  const start = startOfWeek(value, options);
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

export function addMonths(value: Date | number, amount: number): Date {
  const date = toDate(value);
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + amount);
  return result;
}

export function subMonths(value: Date | number, amount: number): Date {
  return addMonths(value, -amount);
}

export function addDays(value: Date | number, amount: number): Date {
  const date = toDate(value);
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + amount);
  return result;
}

export function isSameWeek(
  dateLeft: Date | number,
  dateRight: Date | number,
  options?: WeekOptions,
): boolean {
  const leftStart = startOfWeek(dateLeft, options);
  const rightStart = startOfWeek(dateRight, options);
  return leftStart.getTime() === rightStart.getTime();
}

/**
 * Retorna o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 */
export function getDay(value: Date | number): number {
  const date = toDate(value);
  return date.getDay();
}