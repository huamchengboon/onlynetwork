import React, { useState } from 'react';
import { Cable, Minus, ArrowRightLeft } from 'lucide-react';

type CableType = 'auto' | 'straight' | 'crossover' | 'console';

interface CableOption {
    type: CableType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

export const ConnectionTools: React.FC = () => {
    const [selectedCable, setSelectedCable] = useState<CableType>('auto');

    const cableTypes: CableOption[] = [
        { type: 'auto', label: 'AUTO', icon: Cable },
        { type: 'straight', label: 'STRAIGHT', icon: Minus },
        { type: 'crossover', label: 'CROSSOVER', icon: ArrowRightLeft },
        { type: 'console', label: 'CONSOLE', icon: Cable },
    ];

    return (
        <div
            className="h-16 flex items-center px-4 gap-2 border-t border-[var(--c-blueprint)]"
            style={{
                backgroundColor: 'var(--c-canvas)',
            }}
        >
            <span className="text-tech text-xs uppercase tracking-wider mr-2">CONNECTIONS</span>
            <div className="h-8 w-px" style={{ backgroundColor: 'var(--c-blueprint)' }}></div>
            
            <div className="flex items-center gap-2">
                {cableTypes.map(({ type, label, icon: Icon }) => (
                    <button
                        key={type}
                        className="btn-blueprint flex items-center gap-2 px-3 py-1"
                        style={{
                            backgroundColor: selectedCable === type ? 'var(--c-blueprint)' : 'var(--c-canvas)',
                            color: selectedCable === type ? 'var(--c-canvas)' : 'var(--c-blueprint)',
                        }}
                        onClick={() => setSelectedCable(type)}
                        title={label}
                    >
                        <Icon size={14} />
                        <span className="text-tech text-[10px]">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

