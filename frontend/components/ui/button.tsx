'use client';

import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Spinner } from "./spinner";
import { COMPONENT_TOKENS, TRANSITIONS, ELEVATION } from "@/constants/design-tokens";

const base = clsx(
  "inline-flex items-center justify-center",
  COMPONENT_TOKENS.button.radius,
  COMPONENT_TOKENS.button.padding,
  COMPONENT_TOKENS.button.fontSize,
  COMPONENT_TOKENS.button.fontWeight,
  TRANSITIONS.common.all,
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  ELEVATION.focus
);

const variants: Record<string, string> = {
  primary: clsx(
    "bg-blue-600 text-white",
    "hover:bg-blue-700 hover:shadow-md",
    "active:bg-blue-800 active:scale-[0.98]",
    "focus-visible:ring-blue-500"
  ),
  secondary: clsx(
    "bg-slate-100 text-slate-900",
    "hover:bg-slate-200 hover:shadow-sm",
    "active:bg-slate-300 active:scale-[0.98]",
    "focus-visible:ring-slate-500"
  ),
  ghost: clsx(
    "bg-transparent text-slate-700",
    "hover:bg-slate-100",
    "active:bg-slate-200 active:scale-[0.98]",
    "focus-visible:ring-slate-500"
  ),
  danger: clsx(
    "bg-red-600 text-white",
    "hover:bg-red-700 hover:shadow-md",
    "active:bg-red-800 active:scale-[0.98]",
    "focus-visible:ring-red-500"
  ),
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size: sizeProp = "md", asChild, loading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    if (asChild) {
      return (
        <Slot
          className={clsx(base, variants[variant], sizes[sizeProp], className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={clsx(base, variants[variant], sizes[sizeProp], className)}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className="mr-2">
            <Spinner size="sm" variant="white" />
          </span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";


