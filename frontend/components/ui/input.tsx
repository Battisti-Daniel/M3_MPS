'use client';

import { forwardRef, InputHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { COMPONENT_TOKENS, TRANSITIONS, COLORS } from "@/constants/design-tokens";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  errorMessage?: string;
  isValidating?: boolean;
  isValid?: boolean | null;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, errorMessage, isValidating, isValid, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const showSuccess = isValid === true && !error;
    const showError = error || isValid === false;
    const showIcon = showError || showSuccess || isValidating;

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "w-full",
              COMPONENT_TOKENS.input.radius,
              COMPONENT_TOKENS.input.padding,
              COMPONENT_TOKENS.input.fontSize,
              "text-slate-900 dark:text-white",
              "bg-white dark:bg-slate-800",
              COMPONENT_TOKENS.input.border,
              "dark:border-slate-700",
              TRANSITIONS.common.all,
              showError
                ? clsx(COMPONENT_TOKENS.input.error, "pr-10")
                : showSuccess
                ? clsx("border-emerald-500 focus:ring-emerald-500/20", "pr-10")
                : COMPONENT_TOKENS.input.focus,
              isValidating && "pr-10",
              "placeholder:text-slate-400",
              "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
              className
            )}
            aria-invalid={showError}
            aria-describedby={errorId}
            {...props}
          />
          {showIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isValidating ? (
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" aria-hidden="true" />
              ) : showError ? (
                <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
              ) : showSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              ) : null}
            </div>
          )}
        </div>
        {errorMessage && (
          <p
            id={errorId}
            className="mt-1.5 text-xs text-red-600 flex items-center gap-1 animate-fade-in"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


