import React, { useCallback, useRef, useMemo } from 'react';
import { ReactFlow, Controls, Background, useReactFlow, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTopologyStore } from '../store/useTopologyStore';
import { BlueprintNode } from './BlueprintNode';
import { LabelNode } from './LabelNode';
import { BlueprintEdge } from './BlueprintEdge';

export const NetworkCanvas: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNodeId, toolMode, setTopology, tempLink, setTempLinkCursor, snapToGrid } = useTopologyStore();
    const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
    
    // Listen for zoom events from toolbar
    React.useEffect(() => {
        const handleZoomIn = () => zoomIn();
        const handleZoomOut = () => zoomOut();
        const handleFitView = () => fitView();
        
        window.addEventListener('zoom-in', handleZoomIn);
        window.addEventListener('zoom-out', handleZoomOut);
        window.addEventListener('fit-view', handleFitView);
        
        return () => {
            window.removeEventListener('zoom-in', handleZoomIn);
            window.removeEventListener('zoom-out', handleZoomOut);
            window.removeEventListener('fit-view', handleFitView);
        };
    }, [zoomIn, zoomOut, fitView]);

    // Validate connections before they're created
    const isValidConnection = useCallback((connection: any) => {
        if (!connection.source || !connection.target) {
            return false;
        }

        // Extract port IDs from handle IDs (e.g., "eth0-source" -> "eth0")
        const getPortId = (handleId: string | null | undefined): string | null => {
            if (!handleId) return null;
            // Remove "-source" or "-target" suffix to get the port ID
            return handleId.replace(/-source$|-target$/, '');
        };

        const sourcePortId = getPortId(connection.sourceHandle);
        const targetPortId = getPortId(connection.targetHandle);

        // Check if source port is already connected (as either source or target)
        // Need to check both: edges where this node is source AND edges where this node is target
        const sourcePortInUse = edges.some(edge => {
            const edgeSourcePort = getPortId(edge.sourceHandle);
            const edgeTargetPort = getPortId(edge.targetHandle);
            // Port is in use if:
            // 1. This node is the source and the port matches, OR
            // 2. This node is the target and the port matches
            return (edge.source === connection.source && edgeSourcePort === sourcePortId) ||
                   (edge.target === connection.source && edgeTargetPort === sourcePortId);
        });

        // Check if target port is already connected (as either source or target)
        // Need to check both: edges where this node is source AND edges where this node is target
        const targetPortInUse = edges.some(edge => {
            const edgeSourcePort = getPortId(edge.sourceHandle);
            const edgeTargetPort = getPortId(edge.targetHandle);
            // Port is in use if:
            // 1. This node is the target and the port matches, OR
            // 2. This node is the source and the port matches
            return (edge.target === connection.target && edgeTargetPort === targetPortId) ||
                   (edge.source === connection.target && edgeSourcePort === targetPortId);
        });

        // Prevent connection if either port is already in use
        if (sourcePortInUse || targetPortInUse) {
            return false;
        }

        // Also check for reverse connection (same nodes, different direction)
        const reverseConnection = edges.some(
            edge => edge.source === connection.target && 
                    edge.target === connection.source
        );

        return !reverseConnection;
    }, [edges]);

    // Register custom node types
    const nodeTypes = useMemo(() => ({
        blueprint: BlueprintNode,
        label: LabelNode,
    }), []);

    // Register custom edge types
    const edgeTypes = useMemo(() => ({
        blueprint: BlueprintEdge,
    }), []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type as any, position);
        },
        [screenToFlowPosition, addNode],
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (toolMode === 'delete') {
            // Delete the node
            const newNodes = nodes.filter(n => n.id !== node.id);
            const newEdges = edges.filter(e => e.source !== node.id && e.target !== node.id);
            setTopology(newNodes, newEdges);
            setSelectedNodeId(null);
        } else {
            // Select the node
            setSelectedNodeId(node.id);
        }
    }, [toolMode, nodes, edges, setTopology, setSelectedNodeId]);

    const reactFlowInstance = useReactFlow();
    
    const handleMouseMove = useCallback((event: React.MouseEvent) => {
        if (!tempLink.sourceNodeId) return;
        if (!reactFlowWrapper.current) return;
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setTempLinkCursor(position);
    }, [tempLink.sourceNodeId, screenToFlowPosition, setTempLinkCursor]);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, [setSelectedNodeId]);

    // Render temp link overlay using React Flow's coordinate system
    const tempOverlay = useMemo(() => {
        if (!tempLink.sourceNodeId || !tempLink.sourcePos || !tempLink.cursorPos) {
            return null;
        }
        
        try {
            const viewport = reactFlowInstance.getViewport();
            const { x: vx, y: vy, zoom } = viewport;
            
            // Transform flow coordinates to screen coordinates
            const toScreen = (p: { x: number; y: number }) => ({
                x: (p.x * zoom) + vx,
                y: (p.y * zoom) + vy,
            });
            
            const src = toScreen(tempLink.sourcePos);
            const dst = toScreen(tempLink.cursorPos);
            
            return (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                >
                    <svg
                        style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'visible',
                        }}
                    >
                        <line
                            x1={src.x}
                            y1={src.y}
                            x2={dst.x}
                            y2={dst.y}
                            stroke="var(--c-blueprint)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    </svg>
                </div>
            );
        } catch (error) {
            console.error('Error rendering temp overlay:', error);
            return null;
        }
    }, [tempLink, reactFlowInstance]);

    return (
        <div className="flex-grow h-full relative" ref={reactFlowWrapper} onMouseMove={handleMouseMove}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: 'blueprint' }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                isValidConnection={isValidConnection}
                snapToGrid={snapToGrid}
                snapGrid={snapToGrid ? [20, 20] : undefined}
                fitView
                style={{ backgroundColor: 'var(--c-canvas)' }}
            >
                <Controls />
                <Background
                    color="var(--c-blueprint)"
                    gap={20}
                    size={1}
                    style={{ opacity: 0.15 }}
                />
                {tempOverlay}
            </ReactFlow>
        </div>
    );
};

