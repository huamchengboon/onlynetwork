import React from 'react';

// TYPES & INTERFACES
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// COMPONENT DEFINITION
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  // RENDER LOGIC
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const baseInputStyles = 'font-[var(--f-tech)] text-[var(--fs-tech)] text-[var(--c-ink)] bg-[var(--c-canvas)] border-[1px] border-[var(--c-blueprint)] px-2 py-1 w-full outline-none transition-[var(--transition-fast)] focus:shadow-[var(--shadow-focus)] placeholder:text-[var(--c-blueprint)] placeholder:opacity-40';
  const inputClasses = `${baseInputStyles} ${error ? 'border-[#DC2626]' : ''} ${className}`.trim();

  // RENDER
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-label text-[var(--c-blueprint)] uppercase mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={inputClasses}
        style={{ borderRadius: 0 }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-[#DC2626] font-[var(--f-tech)] uppercase">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[var(--c-ink-light)] font-[var(--f-body)]">
          {helperText}
        </p>
      )}
    </div>
  );
};
