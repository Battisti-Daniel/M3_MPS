'use client';

import { ReactNode } from 'react';
import { Card } from './card';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  loading?: boolean;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

/**
 * Componente de tabela responsiva que se converte em cards em mobile
 * 
 * @example
 * <ResponsiveTable
 *   data={appointments}
 *   columns={columns}
 *   keyExtractor={(item) => item.id}
 *   emptyMessage="Nenhuma consulta encontrada"
 * />
 */
export function ResponsiveTable<T>({
  data,
  columns,
  emptyMessage = 'Nenhum item encontrado',
  loading = false,
  keyExtractor,
  onRowClick,
  className = '',
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20 w-full bg-slate-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <>
      {/* Tabela Desktop */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-medium text-slate-600 ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-slate-700 ${column.className || ''}`}
                  >
                    {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className={`md:hidden space-y-4 ${className}`}>
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
          >
            <div className="space-y-3">
              {columns.map((column) => {
                const value = column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? '');
                const label = column.mobileLabel || column.label;
                
                return (
                  <div key={column.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm text-slate-900">{value}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

