'use client';

import { LabelHTMLAttributes } from "react";
import { clsx } from "clsx";
import { TYPOGRAPHY, COLORS } from "@/constants/design-tokens";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={clsx(
        TYPOGRAPHY.body.small,
        "font-semibold",
        COLORS.text.secondary,
        "block mb-1.5",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="obrigatório">
          *
        </span>
      )}
    </label>
  );
}


