import React from 'react';
import { BaseEdge, getStraightPath, type Edge, type Position } from '@xyflow/react';

interface EdgeProps {
    id: string;
    source: string;
    target: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
    style?: React.CSSProperties;
    markerEnd?: string;
    data?: Edge['data'];
}

export const BlueprintEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    const isAnimating = data?.isAnimating;

    return (
        <BaseEdge
            id={id}
            path={edgePath}
            markerEnd={markerEnd}
            style={{
                ...style,
                strokeWidth: 1.5,
                stroke: 'var(--c-blueprint)',
            }}
            className={isAnimating ? 'edge-flow' : ''}
        />
    );
};
