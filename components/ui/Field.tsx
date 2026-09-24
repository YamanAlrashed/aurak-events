"use client";

import { forwardRef, useId } from "react";
import type { Option } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  required = false,
  error,
  hint,
  htmlFor,
  className,
  children,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn("label", required && "label-required")}
        >
          {label}
        </label>
      )}

      {children}

      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { invalid = false, className, ...rest },
    ref
  ) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "input",
          invalid && "input-error",
          className
        )}
        {...rest}
      />
    );
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(
  function Textarea(
    { invalid = false, className, ...rest },
    ref
  ) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "textarea",
          invalid && "textarea-error",
          className
        )}
        {...rest}
      />
    );
  }
);

export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "children"
  > {
  options: Option[];
  placeholder?: string;
  invalid?: boolean;
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectProps
>(
  function Select(
    {
      options,
      placeholder,
      invalid = false,
      className,
      ...rest
    },
    ref
  ) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "select",
          invalid && "select-error",
          className
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

export function TextField({
  label,
  required,
  error,
  hint,
  className,
  ...inputProps
}: InputProps & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}) {
  const id = useId();

  return (
    <Field
      label={label}
      required={required}
      error={error}
      hint={hint}
      htmlFor={id}
      className={className}
    >
      <Input
        id={id}
        invalid={Boolean(error)}
        {...inputProps}
      />
    </Field>
  );
}