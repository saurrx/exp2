import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Labelled input with a reserved error line and linked invalid state. */
export interface AuthFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  name: string;
  error?: string;
}

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, name, error, className, ...props }, ref) => {
    const invalid = Boolean(error);
    const errorId = `${name}-error`;

    return (
      <div className="[&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-pl-blue">
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-medium text-pl-text-2"
        >
          {label}
        </label>

        <Input
          ref={ref}
          id={name}
          name={name}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(
            "h-9 text-sm bg-pl-bg text-pl-ink placeholder:text-pl-text-3",
            invalid
              ? "border-pl-red focus-visible:border-pl-red focus-visible:ring-pl-red"
              : "border-pl-border-strong focus-visible:border-pl-blue focus-visible:ring-pl-blue",
            className,
          )}
          {...props}
        />

        {/* Always rendered, always the same height: the layout must not move
            when a message appears. `role={invalid ? "alert" : undefined}` announces it when it does. */}
        <p
          id={errorId}
          role={invalid ? "alert" : undefined}
          className="min-h-5 mt-1 text-xs leading-relaxed text-pl-red-text"
        >
          {error ?? ""}
        </p>
      </div>
    );
  },
);
AuthField.displayName = "AuthField";
