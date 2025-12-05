import React from 'react';

// TYPES & INTERFACES
interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
  gap?: string;
  className?: string;
}

interface DividerProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

// COMPONENT DEFINITION - Two Column Layout
export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  left,
  right,
  leftWidth = 'var(--layout-column-left)',
  gap = 'var(--layout-gap)',
  className = '',
}) => {
  // RENDER
  return (
    <div
      className={`flex ${className}`}
      style={{ gap }}
    >
      <div style={{ width: leftWidth, flexShrink: 0 }}>
        {left}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {right}
      </div>
    </div>
  );
};

// COMPONENT DEFINITION - Divider
export const Divider: React.FC<DividerProps> = ({
  className = '',
  variant = 'horizontal',
}) => {
  // RENDER LOGIC
  const baseStyles = variant === 'horizontal'
    ? 'w-full border-t-[1px] border-[var(--c-blueprint)]'
    : 'h-full border-l-[1px] border-[var(--c-blueprint)]';

  // RENDER
  return (
    <div className={`${baseStyles} ${className}`} />
  );
};
