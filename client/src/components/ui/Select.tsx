import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({
  label,
  helperText,
  error,
  options,
  id,
  className = '',
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-[#17231F]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full h-9.5 appearance-none rounded-lg border bg-white pl-3 pr-9 text-sm text-[#17231F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#16A36A]/25 ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626]'
              : 'border-[#DCE6DF] focus:border-[#16A36A]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-4 h-4 text-[#64736B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
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

