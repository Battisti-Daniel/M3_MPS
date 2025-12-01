'use client';

import { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { Inbox } from "lucide-react";
import { TYPOGRAPHY, COLORS, SPACING } from "@/constants/design-tokens";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center",
        "dark:border-slate-700 dark:bg-slate-800/60",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      {icon || (
        <div className="p-3 bg-slate-100 rounded-full dark:bg-slate-700">
          <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
        </div>
      )}
      {title && (
        <h3 className={clsx(TYPOGRAPHY.heading.h5, COLORS.text.primary)}>
          {title}
        </h3>
      )}
      {description && (
        <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "max-w-sm")}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}


