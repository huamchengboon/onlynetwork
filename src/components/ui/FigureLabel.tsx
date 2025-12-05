import React from 'react';

// TYPES & INTERFACES
interface FigureLabelProps {
  id: string;
  position?: 'left' | 'right';
  children?: React.ReactNode;
}

// COMPONENT DEFINITION
export const FigureLabel: React.FC<FigureLabelProps> = ({
  id,
  position = 'left',
  children,
}) => {
  // RENDER LOGIC
  const formatId = (rawId: string): string => {
    // Ensure format is FIG_XXX (3-digit, zero-padded)
    const match = rawId.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return `FIG_${num.toString().padStart(3, '0')}`;
    }
    return rawId.startsWith('FIG_') ? rawId : `FIG_${rawId}`;
  };

  const formattedId = formatId(id);
  const isLeft = position === 'left';
  const rotationClass = isLeft ? 'text-vertical-left' : 'text-vertical-right';

  // RENDER
  return (
    <div
      className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-0 bottom-0 flex items-center ${isLeft ? '-ml-8' : '-mr-8'}`}
    >
      <span className={`${rotationClass} text-[var(--fs-label)]`}>
        {formattedId}
        {children && ` - ${children}`}
      </span>
    </div>
  );
};
