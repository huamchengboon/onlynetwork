import React from 'react';
import pcImage from '../../assets/PC.png';
import switchImage from '../../assets/Switch.png';
import routerImage from '../../assets/Router.png';
import firewallImage from '../../assets/Firewall.png';
import serverImage from '../../assets/Server.png';
import laptopImage from '../../assets/Laptop.png';
import phoneImage from '../../assets/Phone.png';
import cloudImage from '../../assets/Cloud.png';

// TYPES & INTERFACES
interface DeviceIconProps {
  type: 'host' | 'switch' | 'router' | 'firewall' | 'server' | 'laptop' | 'phone' | 'cloud';
  size?: number;
  className?: string;
}

// CONSTANTS & DATA
const imageMap = {
  host: pcImage,
  laptop: laptopImage,
  phone: phoneImage,
  switch: switchImage,
  router: routerImage,
  firewall: firewallImage,
  server: serverImage,
  cloud: cloudImage,
};

// COMPONENT DEFINITION
export const DeviceIcon: React.FC<DeviceIconProps> = ({ 
  type, 
  size = 64, 
  className = '' 
}) => {
  // RENDER LOGIC
  const imageSrc = imageMap[type] || pcImage;

  // RENDER
  return (
    <img
      src={imageSrc}
      alt={type}
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
