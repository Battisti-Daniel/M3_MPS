'use client';

import { clsx } from "clsx";
import { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]",
        "animate-shimmer",
        "dark:from-slate-700 dark:via-slate-600 dark:to-slate-700",
        className
      )}
      aria-busy="true"
      aria-label="Carregando..."
      {...props}
    />
  );
}


