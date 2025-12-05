// Label Node - Visual-only text annotation node
// No device logic, just displays text on canvas

import React, { useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { NodeData } from '../store/useTopologyStore';
import { useTopologyStore } from '../store/useTopologyStore';

// COMPONENT DEFINITION
export const LabelNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    // HOOKS
    const nodeData = data as NodeData & { text?: string };
    const updateNodeLabel = useTopologyStore(state => state.updateNodeLabel);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(nodeData.text || nodeData.label);

    // EVENT HANDLERS
    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editText.trim()) {
            updateNodeLabel(id, editText.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setEditText(nodeData.text || nodeData.label);
            setIsEditing(false);
        }
    };

    // RENDER
    return (
        <div
            style={{
                padding: '8px 12px',
                backgroundColor: 'var(--c-canvas)',
                border: selected ? '2px solid var(--c-blueprint)' : '1px solid var(--c-blueprint)',
                borderRadius: 0,
                minWidth: '100px',
                cursor: 'pointer',
            }}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                        fontFamily: 'var(--f-tech)',
                        fontSize: '12px',
                        color: 'var(--c-ink)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                    }}
                />
            ) : (
                <div
                    style={{
                        fontFamily: 'var(--f-tech)',
                        fontSize: '12px',
                        color: 'var(--c-ink)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {nodeData.text || nodeData.label}
                </div>
            )}
        </div>
    );
};
