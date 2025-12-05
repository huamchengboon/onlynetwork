import React, { useEffect } from 'react';
import { Button } from './Button';

// TYPES & INTERFACES
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
}

// CONSTANTS & DATA
const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// COMPONENT DEFINITION
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
}) => {
  // EFFECTS
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // EVENT HANDLERS
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // EARLY RETURNS
  if (!isOpen) return null;

  // RENDER LOGIC
  const sizeStyle = sizeStyles[size];

  // RENDER
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-[var(--c-canvas)] border-[1px] border-[var(--c-blueprint)] ${sizeStyle} w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col`}
        style={{ borderRadius: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="border-b-[1px] border-[var(--c-blueprint)] p-[var(--space-md)]">
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h2 className="heading-md mb-1">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-subtitle">
                    {subtitle}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-[var(--space-md)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t-[1px] border-[var(--c-blueprint)] p-[var(--space-md)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
