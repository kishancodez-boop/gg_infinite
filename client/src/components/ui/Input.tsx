import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  id,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#17231F]">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64736B] pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full h-9.5 rounded-lg border bg-white text-sm text-[#17231F] placeholder:text-[#64736B]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#16A36A]/25 ${
            leftIcon ? 'pl-9 pr-3' : 'px-3'
          } ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626]'
              : 'border-[#DCE6DF] focus:border-[#16A36A]'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-[#DC2626]">
          {error}
        </p>
      ) : (
        helperText && (
          <p id={helperId} className="text-xs text-[#64736B]">
            {helperText}
          </p>
        )
      )}
    </div>
  );
}

