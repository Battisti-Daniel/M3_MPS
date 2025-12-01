'use client';

import { clsx } from "clsx";
import { getStatusColors } from "@/constants/colors";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  BLOCKED: "Bloqueada",
  NO_SHOW: "Faltou",
};

// Classes fixas para cada status - garantem que Tailwind as inclua
const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CANCELLED: "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
  BLOCKED: "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
  NO_SHOW: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusUpper = status.toUpperCase();
  const badgeClasses = STATUS_BADGE_CLASSES[statusUpper] || STATUS_BADGE_CLASSES.BLOCKED;
  
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        badgeClasses,
        className
      )}
      role="status"
      aria-label={`Status: ${getStatusLabel(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

export function getStatusColorClasses(status: string) {
  return getStatusColors(status);
}


