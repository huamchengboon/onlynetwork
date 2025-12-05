import React from 'react';

// TYPES & INTERFACES
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  title?: string;
  subtitle?: string;
  figureId?: string;
  figureLegend?: string;
}

// COMPONENT DEFINITION
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'outlined',
  title,
  subtitle,
  figureId,
  figureLegend,
}) => {
  // RENDER LOGIC
  const baseStyles = 'bg-[var(--c-canvas)] border-[1px] border-[var(--c-blueprint)] p-[var(--space-md)] relative';
  const variantStyles = {
    default: '',
    outlined: 'border-[var(--c-blueprint)]',
    elevated: 'border-[var(--c-blueprint)] shadow-[0_2px_4px_rgba(77,107,254,0.1)]',
  };
  const combinedClasses = `${baseStyles} ${variantStyles[variant]} ${className}`.trim();

  // RENDER
  return (
    <div
      className={combinedClasses}
      style={{ borderRadius: 0 }}
    >
      {/* Figure ID on left margin */}
      {figureId && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center -ml-8">
          <span className="text-vertical-left text-[var(--fs-label)]">
            {figureId}
          </span>
        </div>
      )}

      {/* Figure Legend on right margin */}
      {figureLegend && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center -mr-8">
          <span className="text-vertical-right text-[var(--fs-label)]">
            {figureLegend}
          </span>
        </div>
      )}

      {/* Card Content */}
      <div className="relative">
        {title && (
          <h3 className="heading-md mb-2">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-subtitle mb-4">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};
