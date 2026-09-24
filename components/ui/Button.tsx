"use client";

import { forwardRef } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-soft";

type ButtonSize = "sm" | "md" | "lg" | "touch";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  "danger-soft": "btn-danger-soft",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  touch: "btn-touch",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      block = false,
      loading = false,
      icon,
      iconRight,
      disabled,
      className,
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "btn",
          VARIANT_CLASS[variant],
          SIZE_CLASS[size],
          block && "btn-block",
          className
        )}
        {...rest}
      >
        {loading ? <Spinner /> : icon}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);