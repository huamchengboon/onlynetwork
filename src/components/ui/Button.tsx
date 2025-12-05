import React from 'react';

// TYPES & INTERFACES
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// CONSTANTS & DATA
const variantStyles = {
  default: {
    base: 'bg-[var(--c-blueprint)] text-[var(--c-canvas)] border-[var(--c-blueprint)]',
    hover: 'hover:bg-[var(--c-blueprint-hover)] hover:border-[var(--c-blueprint-hover)]',
  },
  outline: {
    base: 'bg-[var(--c-canvas)] text-[var(--c-blueprint)] border-[var(--c-blueprint)]',
    hover: 'hover:bg-[var(--c-blueprint)] hover:text-[var(--c-canvas)]',
  },
  ghost: {
    base: 'bg-transparent text-[var(--c-blueprint)] border-transparent',
    hover: 'hover:bg-[var(--c-blueprint-light)]',
  },
  danger: {
    base: 'bg-[var(--c-canvas)] text-[#DC2626] border-[#DC2626]',
    hover: 'hover:bg-[#DC2626] hover:text-[var(--c-canvas)]',
  },
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// COMPONENT DEFINITION
export const Button: React.FC<ButtonProps> = ({
  variant = 'outline',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  // RENDER LOGIC
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const baseStyles = 'font-[var(--f-tech)] uppercase border-[1px] cursor-pointer transition-[var(--transition-fast)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:shadow-[var(--shadow-focus)]';
  const combinedClasses = `${baseStyles} ${variantStyle.base} ${variantStyle.hover} ${sizeStyle} ${className}`.trim();

  // RENDER
  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      style={{ borderRadius: 0 }}
      {...props}
    >
      {children}
    </button>
  );
};
