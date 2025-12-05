import { create } from 'zustand';
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { TraceHop } from '../simulator/types';
import { DeviceFactory } from '../devices';

// Interface configuration
export interface InterfaceConfig {
  id: string;
  mac: string;
  ip?: string;
  vlan?: number;
  portMode?: 'access' | 'trunk';
  allowedVlans?: number[];
}

// Static route configuration
export interface StaticRoute {
  prefix: string;
  nextHop: string;
  outInterface: string;
}

// ACL rule configuration
export interface AclRule {
  id: string;
  order: number;
  action: 'allow' | 'deny';
  srcIp?: string;
  dstIp?: string;
  proto?: 'tcp' | 'udp' | 'icmp' | 'any';
  srcPort?: number;
  dstPort?: number;
}

// Node-specific configurations
export interface HostConfig {
  interfaces: InterfaceConfig[];
}

export interface SwitchConfig {
  interfaces: InterfaceConfig[];
  vlanDatabase: number[];
  macLearning: boolean;
}

export interface RouterConfig {
  interfaces: InterfaceConfig[];
  staticRoutes: StaticRoute[];
}

export interface FirewallConfig {
  interfaces: InterfaceConfig[];
  aclRules: AclRule[];
  defaultPolicy: 'allow' | 'deny';
}

export type NodeConfig = HostConfig | SwitchConfig | RouterConfig | FirewallConfig;

// Define our custom node data type
export type NodeData = {
  label: string;
  type: 'host' | 'switch' | 'router' | 'firewall' | 'phone' | 'server' | 'laptop' | 'cloud' | 'label';
  config: NodeConfig;
};

export type AppNode = Node<NodeData>;

type ToolMode = 'select' | 'move' | 'delete';
type CableType = 'auto' | 'straight' | 'crossover' | 'console';

type PendingSource = {
  nodeId: string;
  portId: string;
};

type ConnectionModeState = {
  cableType: CableType | null;
  pendingSource: PendingSource | null;
};

type PortPickerState = {
  nodeId: string | null;
};

type TempLinkState = {
  sourceNodeId: string | null;
  sourcePortId: string | null;
  sourcePos?: { x: number; y: number };
  cursorPos?: { x: number; y: number };
};

interface TopologyState {
  nodes: AppNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  toolMode: ToolMode;
  snapToGrid: boolean;
  connectionMode: ConnectionModeState;
  portPicker: PortPickerState;
  tempLink: TempLinkState;
  
  // Simulation state
  simulationTrace: TraceHop[];
  currentHopIndex: number;
  isAnimating: boolean;
  topologyVersion: number;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addConnection: (connection: Connection) => void;
  
  addNode: (type: NodeData['type'], position: { x: number; y: number }) => void;
  setSelectedNodeId: (id: string | null) => void;
  setToolMode: (mode: ToolMode) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setCableType: (type: CableType | null) => void;
  beginConnection: (nodeId: string, portId: string, sourcePos?: { x: number; y: number }) => void;
  completeConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
  setPortPicker: (nodeId: string | null) => void;
  setTempLinkCursor: (cursorPos: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: NodeConfig) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  setTopology: (nodes: AppNode[], edges: Edge[]) => void;
  clearTopology: () => void;
  
  // Simulation actions
  setSimulationTrace: (trace: TraceHop[]) => void;
  setAnimatedEdges: (edgeIds: Set<string>) => void;
  startAnimation: () => void;
  nextHop: () => void;
  stopAnimation: () => void;
}

// Create default config based on node type
// Uses DeviceFactory for OOP approach
function createDefaultConfig(type: NodeData['type'], nodeIndex: number): NodeConfig {
  return DeviceFactory.getDefaultConfig(type, nodeIndex);
}

// Utility to extract port id from a handle id (e.g., "eth0-source" -> "eth0")
const getPortId = (handleId: string | null | undefined): string | null => {
  if (!handleId) return null;
  return handleId.replace(/-source$|-target$/, '');
};

const addConnectionState = (state: TopologyState, connection: Connection): { edges: Edge[]; topologyVersion: number } | null => {
  if (!connection.source || !connection.target) {
    return null;
  }

  const sourcePortId = getPortId(connection.sourceHandle);
  const targetPortId = getPortId(connection.targetHandle);

  // Check if source port is already connected
  const sourcePortInUse = state.edges.some(edge => {
    const edgeSourcePort = getPortId(edge.sourceHandle);
    const edgeTargetPort = getPortId(edge.targetHandle);
    return (edge.source === connection.source && edgeSourcePort === sourcePortId) ||
           (edge.target === connection.source && edgeTargetPort === sourcePortId);
  });

  // Check if target port is already connected
  const targetPortInUse = state.edges.some(edge => {
    const edgeSourcePort = getPortId(edge.sourceHandle);
    const edgeTargetPort = getPortId(edge.targetHandle);
    return (edge.target === connection.target && edgeTargetPort === targetPortId) ||
           (edge.source === connection.target && edgeSourcePort === targetPortId);
  });

  if (sourcePortInUse || targetPortInUse) {
    console.warn('Connection rejected: Port already in use', {
      connection,
      sourcePortId,
      targetPortId,
      sourcePortInUse,
      targetPortInUse,
      existingEdges: state.edges.map(e => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    });
    return null;
  }

  // Prevent reverse connection (same nodes, different direction)
  const reverseConnection = state.edges.some(
    edge => edge.source === connection.target &&
            edge.target === connection.source
  );

  if (reverseConnection) {
    console.warn('Connection rejected: Reverse connection already exists');
    return null;
  }

  const newEdges = addEdge(connection, state.edges);

  return {
    edges: newEdges,
    topologyVersion: state.topologyVersion + 1,
  };
};

export const useTopologyStore = create<TopologyState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  toolMode: 'select',
  snapToGrid: false,
  connectionMode: {
    cableType: null,
    pendingSource: null,
  },
  portPicker: { nodeId: null },
  tempLink: { sourceNodeId: null, sourcePortId: null },
  simulationTrace: [],
  currentHopIndex: -1,
  isAnimating: false,
  topologyVersion: 0,

  onNodesChange: (changes: NodeChange[]) => {
    set(state => {
      const hasStructuralChange = changes.some(c => c.type === 'remove' || c.type === 'add');
      return {
        nodes: applyNodeChanges(changes, state.nodes) as AppNode[],
        topologyVersion: hasStructuralChange ? state.topologyVersion + 1 : state.topologyVersion,
      };
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set(state => {
      const hasStructuralChange = changes.some(c => c.type === 'remove' || c.type === 'add');
      return {
        edges: applyEdgeChanges(changes, state.edges),
        topologyVersion: hasStructuralChange ? state.topologyVersion + 1 : state.topologyVersion,
      };
    });
  },

  onConnect: (connection: Connection) => {
    get().addConnection(connection);
  },

  addConnection: (connection: Connection) => {
    set(state => {
      const result = addConnectionState(state, connection);
      // Always clear tempLink and pendingSource, even if connection fails
      // This prevents the temp link from sticking around
      
      if (!result) {
        // Connection failed (e.g., port already in use), but still clear temp link
        return {
          ...state,
          connectionMode: {
            ...state.connectionMode,
            pendingSource: null,
          },
          tempLink: { sourceNodeId: null, sourcePortId: null },
        };
      }
      
      // Connection succeeded
      return {
        edges: result.edges,
        topologyVersion: result.topologyVersion,
        connectionMode: {
          ...state.connectionMode,
          pendingSource: null,
        },
        tempLink: { sourceNodeId: null, sourcePortId: null },
      };
    });
  },

  addNode: (type, position) => {
    const id = uuidv4();
    const nodeIndex = get().nodes.length + 1;
    
    // Label nodes are special - no device config needed
    if (type === 'label') {
      const newNode: AppNode = {
        id,
        type: 'label',
        position,
        data: { 
          label: 'Label',
          type: 'label',
          config: { interfaces: [] }, // Dummy config for type compatibility
        },
      };
      set(state => ({ 
        nodes: [...state.nodes, newNode],
        topologyVersion: state.topologyVersion + 1,
      }));
      return;
    }
    
    const newNode: AppNode = {
      id,
      type: 'blueprint',
      position,
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeIndex}`,
        type,
        config: createDefaultConfig(type, nodeIndex),
      },
    };
    set(state => ({ 
        nodes: [...state.nodes, newNode],
        topologyVersion: state.topologyVersion + 1,
    }));
  },

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
  },

  setToolMode: (mode) => {
    set({ toolMode: mode });
  },

  setSnapToGrid: (enabled) => {
    set({ snapToGrid: enabled });
  },

  setCableType: (type: CableType | null) => {
    set(state => ({
      connectionMode: {
        cableType: type,
        pendingSource: null,
      },
      portPicker: { nodeId: null },
      tempLink: { sourceNodeId: null, sourcePortId: null },
      toolMode: state.toolMode,
    }));
  },

  beginConnection: (nodeId: string, portId: string, sourcePos?: { x: number; y: number }) => {
    set(state => {
      if (!state.connectionMode.cableType) return state;
      return {
        ...state,
        connectionMode: {
          ...state.connectionMode,
          pendingSource: { nodeId, portId },
        },
        portPicker: { nodeId: null },
        tempLink: {
          sourceNodeId: nodeId,
          sourcePortId: portId,
          sourcePos: sourcePos || { x: 0, y: 0 },
          cursorPos: sourcePos || { x: 0, y: 0 },
        },
      };
    });
  },

  completeConnection: (nodeId: string, portId: string) => {
    const { connectionMode, addConnection } = get();
    if (!connectionMode.cableType || !connectionMode.pendingSource) {
      // If no pending source, this might be starting a new connection
      return;
    }

    const { nodeId: sourceNodeId, portId: sourcePortId } = connectionMode.pendingSource;
    
    // Prevent connecting to same port
    if (sourceNodeId === nodeId && sourcePortId === portId) {
      // Cancel the connection instead
      set(state => ({
        ...state,
        connectionMode: {
          ...state.connectionMode,
          pendingSource: null,
        },
        tempLink: { sourceNodeId: null, sourcePortId: null },
        portPicker: { nodeId: null },
      }));
      return;
    }

    // Create the connection - addConnection will clear tempLink
    addConnection({
      source: sourceNodeId,
      target: nodeId,
      sourceHandle: `${sourcePortId}-source`,
      targetHandle: `${portId}-target`,
      type: 'blueprint',
    });
  },

  cancelConnection: () => {
    set(state => ({
      ...state,
      connectionMode: {
        cableType: state.connectionMode.cableType,
        pendingSource: null,
      },
      portPicker: { nodeId: null },
      tempLink: { sourceNodeId: null, sourcePortId: null },
    }));
  },

  setPortPicker: (nodeId: string | null) => {
    set(state => ({
      portPicker: { nodeId },
      connectionMode: {
        ...state.connectionMode,
        // Don't clear pendingSource when opening port picker - we need it for completion
        pendingSource: state.connectionMode.pendingSource,
      },
    }));
  },

  setTempLinkCursor: (cursorPos: { x: number; y: number }) => {
    set(state => {
      if (!state.tempLink.sourceNodeId) return state;
      return {
        ...state,
        tempLink: {
          ...state.tempLink,
          cursorPos,
        },
      };
    });
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      ),
    });
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label } }
          : node
      ),
    });
  },

  setTopology: (nodes, edges) => {
    set({ nodes, edges, selectedNodeId: null });
  },

  setAnimatedEdges: (edgeIds: Set<string>) => {
    const { edges } = get();
    const newEdges = edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        isAnimating: edgeIds.has(edge.id)
      }
    }));
    set({ edges: newEdges, isAnimating: true });
  },

  clearTopology: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      simulationTrace: [],
      currentHopIndex: -1,
      isAnimating: false,
      connectionMode: { cableType: null, pendingSource: null },
      portPicker: { nodeId: null },
      tempLink: { sourceNodeId: null, sourcePortId: null },
    });
  },

  setSimulationTrace: (trace) => {
    // Identify edges involved in the trace
    const activeEdgeIds = new Set<string>();
    const { edges } = get();

    console.log('📊 Simulation Trace:', trace.map(h => `${h.nodeLabel} (${h.nodeId})`).join(' → '));

    for (let i = 0; i < trace.length - 1; i++) {
        const sourceId = trace[i].nodeId;
        const targetId = trace[i+1].nodeId;
        
        // Find edge connecting source and target
        const edge = edges.find(e => 
            (e.source === sourceId && e.target === targetId) ||
            (e.source === targetId && e.target === sourceId)
        );
        
        if (edge) {
            activeEdgeIds.add(edge.id);
            console.log(`✅ Animating edge: ${trace[i].nodeLabel} → ${trace[i+1].nodeLabel} (edge ID: ${edge.id})`);
        } else {
            console.warn(`⚠️ No edge found between ${trace[i].nodeLabel} (${sourceId}) and ${trace[i+1].nodeLabel} (${targetId})`);
        }
    }

    // Log which edges are NOT animating
    edges.forEach(edge => {
        if (!activeEdgeIds.has(edge.id)) {
            const sourceNode = get().nodes.find(n => n.id === edge.source);
            const targetNode = get().nodes.find(n => n.id === edge.target);
            console.log(`⚪ Not animating: ${sourceNode?.data.label || edge.source} → ${targetNode?.data.label || edge.target} (not in trace path)`);
        }
    });

    // Update edges with animation state
    const newEdges = edges.map(edge => ({
        ...edge,
        data: {
            ...edge.data,
            isAnimating: activeEdgeIds.has(edge.id)
        }
    }));

    set({ simulationTrace: trace, edges: newEdges, currentHopIndex: -1, isAnimating: true });
  },

  startAnimation: () => {
    set({ isAnimating: true, currentHopIndex: 0 });
  },

  nextHop: () => {
    const { currentHopIndex, simulationTrace } = get();
    if (currentHopIndex < simulationTrace.length - 1) {
      set({ currentHopIndex: currentHopIndex + 1 });
    } else {
      set({ isAnimating: false });
    }
  },

  stopAnimation: () => {
    set({ isAnimating: false, currentHopIndex: -1 });
  },
}));

