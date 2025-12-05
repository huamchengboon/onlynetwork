// PacketMarker - Animated packet visualization on the canvas

import React, { useEffect, useState } from 'react';
import { useTopologyStore } from '../store/useTopologyStore';

interface Position {
    x: number;
    y: number;
}

export const PacketMarker: React.FC = () => {
    const { nodes, simulationTrace, currentHopIndex, isAnimating, nextHop } = useTopologyStore();
    const [position, setPosition] = useState<Position | null>(null);

    // Get node position by ID
    const getNodePosition = (nodeId: string): Position | null => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;
        // Center of node (assuming ~120x60 node size)
        return {
            x: node.position.x + 60,
            y: node.position.y + 30,
        };
    };

    // Update position when hop changes
    useEffect(() => {
        if (!isAnimating || currentHopIndex < 0 || currentHopIndex >= simulationTrace.length) {
            setPosition(null);
            return;
        }

        const currentHop = simulationTrace[currentHopIndex];
        const newPosition = getNodePosition(currentHop.nodeId);
        setPosition(newPosition);

        // Auto-advance to next hop after delay
        const timer = setTimeout(() => {
            nextHop();
        }, 800); // 800ms per hop

        return () => clearTimeout(timer);
    }, [currentHopIndex, isAnimating, simulationTrace, nodes]);

    if (!position || !isAnimating) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'var(--c-blueprint)',
                border: '2px solid var(--c-canvas)',
                boxShadow: '0 0 10px var(--c-blueprint), 0 0 20px var(--c-blueprint)',
                transition: 'left 0.4s ease-out, top 0.4s ease-out',
                zIndex: 100,
                pointerEvents: 'none',
            }}
        >
            {/* Inner pulse */}
            <div
                style={{
                    position: 'absolute',
                    inset: 2,
                    borderRadius: '50%',
                    backgroundColor: 'var(--c-canvas)',
                    animation: 'pulse 0.5s ease-in-out infinite',
                }}
            />
        </div>
    );
};
