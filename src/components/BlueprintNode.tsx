import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import type { NodeData } from '../store/useTopologyStore';
import { DeviceIcon } from './ui/DeviceIcon';
import { DeviceFactory } from '../devices';
import { useTopologyStore } from '../store/useTopologyStore';

// TYPES & INTERFACES
const Port: React.FC<{
    position: Position;
    id: string;
    offset?: number; // Percentage offset (0-100)
    isVertical?: boolean; // True for Top/Bottom
}> = ({ position, id, offset = 50, isVertical = true }) => {
    const style: React.CSSProperties = {
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: 'none',
    };

    if (isVertical) {
        style.left = `${offset}%`;
    } else {
        style.top = `${offset}%`;
    }

    return (
        <div style={{ position: 'absolute' }}>
            {/* Visible Target Handle (receives connections) */}
            <Handle
                type="target"
                position={position}
                id={`${id}-target`}
                style={style}
            />
            {/* Invisible Source Handle (starts connections) */}
            <Handle
                type="source"
                position={position}
                id={`${id}-source`}
                style={{
                    ...style,
                    zIndex: 11, // Above target
                }}
            />
        </div>
    );
};

// COMPONENT DEFINITION
export const BlueprintNode: React.FC<NodeProps> = ({ id: nodeId, data }) => {
    // HOOKS
    const nodeData = data as NodeData;
    const reactFlow = useReactFlow();
    const connectionMode = useTopologyStore(state => state.connectionMode);
    const beginConnection = useTopologyStore(state => state.beginConnection);
    const completeConnection = useTopologyStore(state => state.completeConnection);
    const cancelConnection = useTopologyStore(state => state.cancelConnection);
    const portPicker = useTopologyStore(state => state.portPicker);
    const setPortPicker = useTopologyStore(state => state.setPortPicker);

    const portConfigs = useMemo(() => {
        // Label nodes don't have ports
        if (nodeData.type === 'label') {
            return [];
        }
        const device = DeviceFactory.createDevice({
            id: '',
            label: nodeData.label,
            type: nodeData.type as any, // Type assertion needed for label compatibility
            config: nodeData.config,
        });
        return device.getPortConfigurations();
    }, [nodeData.type, nodeData.config, nodeData.label]);

    const portHandles = useMemo(() => {
        const positionMap: Record<string, Position> = {
            top: Position.Top,
            right: Position.Right,
            bottom: Position.Bottom,
            left: Position.Left,
        };
        return portConfigs.map((portConfig) => {
            const position = positionMap[portConfig.position] || Position.Right;
            const isVertical = portConfig.position === 'top' || portConfig.position === 'bottom';
            return (
                <Port
                    key={portConfig.id}
                    position={position}
                    id={portConfig.id}
                    offset={portConfig.offset}
                    isVertical={isVertical}
                />
            );
        });
    }, [portConfigs, nodeId]);

    // RENDER LOGIC
    // Label nodes are handled by LabelNode component, not BlueprintNode
    if (nodeData.type === 'label') {
        return null;
    }
    
    const deviceType = nodeData.type as 'host' | 'switch' | 'router' | 'firewall' | 'server' | 'phone' | 'laptop' | 'cloud';

    // RENDER
    return (
        <div
            className="relative flex flex-col items-center justify-center"
            style={{
                fontFamily: 'var(--f-tech)',
            }}
            onClick={(e) => {
                if (connectionMode.cableType) {
                    e.stopPropagation();
                    // If there's a pending connection, show port picker for this node
                    // If no pending connection, show port picker to start new connection
                    setPortPicker(nodeId);
                }
            }}
        >
            {portHandles}

            {/* Device Icon - No box, just the icon and label */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                }}
            >
                {/* Icon - Large and prominent */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <DeviceIcon type={deviceType} size={64} />
                </div>

                {/* Device Label - Clean typography */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        minWidth: '100px',
                    }}
                >
                    {/* Device Type */}
                    <span
                        style={{
                            fontFamily: 'var(--f-tech)',
                            fontSize: '9px',
                            fontWeight: 600,
                            color: 'var(--c-blueprint)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            textAlign: 'center',
                        }}
                    >
                        {nodeData.type.toUpperCase()}
                    </span>
                    
                    {/* Device Name */}
                    <span
                        style={{
                            fontFamily: 'var(--f-tech)',
                            fontSize: '8px',
                            color: 'var(--c-ink)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textAlign: 'center',
                            opacity: 0.8,
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {nodeData.label}
                    </span>
                </div>
            </div>

            {/* Port picker overlay when in connection mode and this node is selected */}
            {connectionMode.cableType && portPicker.nodeId === nodeId && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        marginTop: 4,
                        backgroundColor: 'var(--c-canvas)',
                        border: '1px solid var(--c-blueprint)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        zIndex: 100,
                        boxShadow: '2px 2px 0 var(--c-blueprint)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {portConfigs.map((portConfig) => (
                        <button
                            key={portConfig.id}
                            className="btn-blueprint"
                            style={{ padding: '6px 8px', textAlign: 'left' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                
                                // Check if we're completing a connection or starting a new one
                                const hasPendingSource = connectionMode.pendingSource !== null;
                                const isCompletingConnection = hasPendingSource && 
                                    connectionMode.pendingSource!.nodeId !== nodeId;
                                
                                if (isCompletingConnection) {
                                    // Completing connection to this node
                                    completeConnection(nodeId, portConfig.id);
                                } else if (!hasPendingSource) {
                                    // Starting new connection from this node
                                    const node = reactFlow.getNode(nodeId);
                                    let center: { x: number; y: number } | undefined;
                                    
                                    if (node) {
                                        center = {
                                            x: node.position.x + 40,
                                            y: node.position.y + 40,
                                        };
                                    }
                                    beginConnection(nodeId, portConfig.id, center);
                                } else {
                                    // Clicked same node - cancel connection
                                    cancelConnection();
                                }
                                
                                setPortPicker(null);
                            }}
                        >
                            PORT: {portConfig.id}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
