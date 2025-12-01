'use client';

import { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { COMPONENT_TOKENS, ELEVATION, TYPOGRAPHY, SPACING, COLORS } from "@/constants/design-tokens";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        COMPONENT_TOKENS.card.radius,
        COMPONENT_TOKENS.card.border,
        COMPONENT_TOKENS.card.padding,
        COMPONENT_TOKENS.card.shadow,
        "bg-white dark:bg-slate-800 dark:border-slate-700",
        COMPONENT_TOKENS.card.shadowHover,
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between",
        SPACING.section.gapCompact,
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        TYPOGRAPHY.heading.h4,
        COLORS.text.primary,
        "dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx(
        TYPOGRAPHY.body.small,
        COLORS.text.secondary,
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        SPACING.section.gapCompact,
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between pt-4 border-t border-slate-200",
        className
      )}
      {...props}
    />
  );
}

