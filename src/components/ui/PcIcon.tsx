import React from 'react';
import pcImage from '../../assets/PC.png';

// TYPES & INTERFACES
interface PcIconProps {
  size?: number;
  className?: string;
}

// COMPONENT DEFINITION
export const PcIcon: React.FC<PcIconProps> = ({ size = 64, className = '' }) => {
  // RENDER
  return (
    <img
      src={pcImage}
      alt="PC"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        objectFit: 'contain',
      }}
    />
  );
};
