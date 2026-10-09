import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="label">{label}</label>}
        <select
          ref={ref}
          id={id}
          className={clsx('input', { 'border-red-500': error }, className)}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
