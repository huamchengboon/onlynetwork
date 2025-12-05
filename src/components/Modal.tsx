// Custom Modal component with blueprint styling

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div
                className="card-blueprint p-4 max-w-md w-full mx-4"
                style={{
                    backgroundColor: 'var(--c-canvas)',
                    border: '2px solid var(--c-blueprint)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    {title && (
                        <h2 className="text-tech text-sm uppercase" style={{ color: 'var(--c-blueprint)' }}>
                            {title}
                        </h2>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:opacity-70"
                        style={{ color: 'var(--c-blueprint)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="text-tech text-sm" style={{ color: 'var(--c-ink)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Simple hook to manage modal state
export function useModal() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [content, setContent] = React.useState<{ title?: string; message: string }>({ message: '' });

    const showModal = (message: string, title?: string) => {
        setContent({ title, message });
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    return { isOpen, content, showModal, closeModal };
}
