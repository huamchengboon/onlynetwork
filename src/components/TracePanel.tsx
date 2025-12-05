// Trace Panel - Shows simulation trace with hop-by-hop details

import React from 'react';
import { useTopologyStore } from '../store/useTopologyStore';
import { CheckCircle, XCircle, ArrowRight, Zap } from 'lucide-react';

export const TracePanel: React.FC = () => {
    const { simulationTrace, isAnimating } = useTopologyStore();

    if (simulationTrace.length === 0) {
        return null;
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'deliver':
                return <CheckCircle size={12} style={{ color: '#22c55e' }} />;
            case 'drop':
            case 'acl-deny':
                return <XCircle size={12} style={{ color: '#ef4444' }} />;
            case 'forward':
            case 'route':
                return <ArrowRight size={12} style={{ color: 'var(--c-blueprint)' }} />;
            default:
                return <Zap size={12} style={{ color: 'var(--c-blueprint)' }} />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'deliver':
                return '#22c55e';
            case 'drop':
            case 'acl-deny':
                return '#ef4444';
            default:
                return 'var(--c-blueprint)';
        }
    };

    return (
        <div
            className="absolute bottom-0 left-0 right-0 z-10"
            style={{
                backgroundColor: 'var(--c-canvas)',
                borderTop: '2px solid var(--c-blueprint)',
                maxHeight: '200px',
                overflowY: 'auto',
            }}
        >
            <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--c-grid)' }}>
                <span className="text-tech text-xs uppercase" style={{ color: 'var(--c-blueprint)' }}>
                    Packet Trace
                </span>
                {isAnimating && (
                    <span className="text-tech text-xs" style={{ color: 'var(--c-ink)', opacity: 0.6 }}>
                        (animating...)
                    </span>
                )}
            </div>

            <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                {simulationTrace.map((hop, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 shrink-0"
                        style={{
                            backgroundColor: 'var(--c-grid)',
                            border: '1px solid var(--c-blueprint)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <span style={{ color: getActionColor(hop.action) }}>
                            {getActionIcon(hop.action)}
                        </span>
                        <div className="flex flex-col">
                            <span
                                className="text-tech text-xs font-bold"
                                style={{ color: 'var(--c-ink)' }}
                            >
                                {hop.nodeLabel}
                            </span>
                            <span
                                className="text-tech text-xs"
                                style={{
                                    color: 'var(--c-ink)',
                                    opacity: 0.7,
                                    fontSize: '10px',
                                }}
                            >
                                {hop.action}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
