// Core types for the network simulator

// ============================================
// PACKET TYPES
// ============================================

export interface Packet {
    id: string;
    srcMac: string;
    dstMac: string;
    srcIp?: string;
    dstIp?: string;
    vlan?: number;          // VLAN tag (null = untagged)
    proto: 'tcp' | 'udp' | 'icmp' | 'arp' | 'other';
    srcPort?: number;
    dstPort?: number;
    ttl: number;
    payload?: string;       // For tracing/debugging
}

export interface PacketSpec {
    srcNodeId: string;
    dstNodeId: string;
    srcIp?: string;
    dstIp?: string;
    proto?: Packet['proto'];
    srcPort?: number;
    dstPort?: number;
}

// ============================================
// EVENT QUEUE TYPES
// ============================================

export interface SimEvent {
    packet: Packet;
    nodeId: string;
    interfaceId: string;
    time: number;           // Logical time step
}

// ============================================
// TRACE TYPES
// ============================================

export type TraceAction = 
    | 'receive'
    | 'forward'
    | 'flood'
    | 'drop'
    | 'deliver'
    | 'learn'
    | 'route'
    | 'arp'
    | 'acl-allow'
    | 'acl-deny';

export interface TraceHop {
    time: number;
    nodeId: string;
    nodeLabel: string;
    interfaceId: string;
    action: TraceAction;
    reason: string;
    packet: Packet;
}

export interface SimulationResult {
    success: boolean;
    delivered: boolean;
    blocked: boolean;
    loop: boolean;
    trace: TraceHop[];
    reason: string;
}

// ============================================
// MAC TABLE
// ============================================

export interface MacTableEntry {
    mac: string;
    interfaceId: string;
    vlan: number;
    timestamp: number;
}

export type MacTable = Map<string, MacTableEntry>;  // key: "mac-vlan"

// ============================================
// SIMULATION OPTIONS
// ============================================

export interface SimulationOptions {
    maxHops: number;        // Prevent infinite loops
    stepMode: boolean;      // Pause after each hop
    traceLevel: 'minimal' | 'detailed';
}

export const DEFAULT_SIM_OPTIONS: SimulationOptions = {
    maxHops: 100,
    stepMode: false,
    traceLevel: 'detailed',
};

// ============================================
// TOPOLOGY TYPES (for simulator input)
// ============================================

export interface SimInterface {
    id: string;
    mac: string;
    ip?: string;
    vlan?: number;
    portMode?: 'access' | 'trunk';
    allowedVlans?: number[];
}

export interface SimNode {
    id: string;
    type: 'host' | 'switch' | 'router' | 'firewall' | 'phone' | 'server' | 'laptop' | 'cloud';
    label: string;
    interfaces: SimInterface[];
    // Type-specific config
    macLearning?: boolean;
    vlanDatabase?: number[];
    staticRoutes?: { prefix: string; nextHop: string; outInterface: string }[];
    aclRules?: { 
        id: string; 
        order: number; 
        action: 'allow' | 'deny'; 
        srcIp?: string; 
        dstIp?: string;
        proto?: string;
        srcPort?: number;
        dstPort?: number;
    }[];
    defaultPolicy?: 'allow' | 'deny';
}

export interface SimLink {
    id: string;
    source: { nodeId: string; interfaceId: string };
    target: { nodeId: string; interfaceId: string };
}

export interface SimTopology {
    nodes: SimNode[];
    links: SimLink[];
}
