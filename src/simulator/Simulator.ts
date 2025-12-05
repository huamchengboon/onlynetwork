// Main Simulator - orchestrates packet processing through the network
// Refactored to use OOP Device classes with polymorphism

import type { 
    Packet, 
    PacketSpec,
    SimNode, 
    SimTopology, 
    SimulationResult, 
    SimulationOptions,
    TraceHop,
    MacTable,
} from './types';
import { DEFAULT_SIM_OPTIONS } from './types';
import { EventQueue } from './EventQueue';
import { Device, DeviceFactory, HostDevice } from '../devices';
import { getNodeById } from './utils';
import { GraphAnalyzer } from './GraphAnalyzer';

// COMPONENT DEFINITION - Simulator Class
export class Simulator {
    // PROPERTIES (Encapsulation)
    private topology: SimTopology;
    private options: SimulationOptions;
    private eventQueue: EventQueue;
    private macTables: Map<string, MacTable>; // Per-switch MAC tables
    private trace: TraceHop[];
    private devices: Map<string, Device>; // Cache of device instances
    private graphAnalyzer: GraphAnalyzer; // Fast path analysis

    // CONSTRUCTOR
    constructor(topology: SimTopology, options: Partial<SimulationOptions> = {}) {
        this.topology = topology;
        this.options = { ...DEFAULT_SIM_OPTIONS, ...options };
        this.eventQueue = new EventQueue();
        this.macTables = new Map();
        this.trace = [];
        this.devices = new Map();
        this.graphAnalyzer = new GraphAnalyzer(topology);

        // Initialize MAC tables for switches
        for (const node of topology.nodes) {
            if (node.type === 'switch') {
                this.macTables.set(node.id, new Map());
            }
        }

        // Create device instances for all nodes (OOP approach)
        this.initializeDevices();
    }

    // PRIVATE METHODS
    /**
     * Initialize device instances from topology
     * Uses Factory pattern to create appropriate device types
     */
    private initializeDevices(): void {
        for (const node of this.topology.nodes) {
            const device = DeviceFactory.createFromSimNode(node);
            this.devices.set(node.id, device);
        }
    }

    /**
     * Get device instance for a node
     */
    private getDevice(nodeId: string): Device | undefined {
        return this.devices.get(nodeId);
    }

    // Run a simulation from a packet specification
    simulate(packetSpec: PacketSpec): SimulationResult {
        this.trace = [];
        this.eventQueue.clear();

        // Find source and destination nodes
        const srcNode = getNodeById(this.topology.nodes, packetSpec.srcNodeId);
        const dstNode = getNodeById(this.topology.nodes, packetSpec.dstNodeId);

        if (!srcNode) {
            return {
                success: false,
                delivered: false,
                blocked: false,
                loop: false,
                trace: [],
                reason: `Source node ${packetSpec.srcNodeId} not found`,
            };
        }

        if (!dstNode) {
            return {
                success: false,
                delivered: false,
                blocked: false,
                loop: false,
                trace: [],
                reason: `Destination node ${packetSpec.dstNodeId} not found`,
            };
        }

        // Fast pre-check: Are nodes reachable? (saves simulation time)
        if (!this.graphAnalyzer.isReachable(srcNode.id, dstNode.id)) {
            return {
                success: false,
                delivered: false,
                blocked: false,
                loop: false,
                trace: [],
                reason: `No path exists between ${srcNode.label} and ${dstNode.label}`,
            };
        }

        // Get source device
        const srcDevice = this.getDevice(srcNode.id);
        if (!srcDevice) {
            return {
                success: false,
                delivered: false,
                blocked: false,
                loop: false,
                trace: [],
                reason: 'Source device not found',
            };
        }

        // Get destination MAC and IP
        const dstIface = dstNode.interfaces[0];
        const dstMac = dstIface?.mac || 'FF:FF:FF:FF:FF:FF';
        const dstIp = packetSpec.dstIp || dstIface?.ip?.split('/')[0] || '';

        // Create initial packet using device's sendPacket method (polymorphism)
        let sendResult;
        if (srcDevice instanceof HostDevice) {
            sendResult = srcDevice.sendPacket(
                dstMac,
                dstIp,
                this.topology.links,
                this.eventQueue.getTime(),
                packetSpec.proto || 'icmp',
                packetSpec.srcPort,
                packetSpec.dstPort
            );
        } else {
            // For non-host devices, we can't initiate packets
            return {
                success: false,
                delivered: false,
                blocked: false,
                loop: false,
                trace: [],
                reason: 'Source must be a host device (host, phone, server, laptop)',
            };
        }
        
        this.trace.push(...sendResult.trace);
        
        for (const event of sendResult.events) {
            this.eventQueue.enqueue(event);
        }

        // Main simulation loop
        let hops = 0;
        const visitedStates = new Set<string>();

        while (!this.eventQueue.isEmpty() && hops < this.options.maxHops) {
            const event = this.eventQueue.dequeue()!;
            this.eventQueue.tick();
            hops++;

            // Loop detection
            const stateKey = `${event.nodeId}-${event.interfaceId}-${event.packet.id}`;
            if (visitedStates.has(stateKey)) {
                return {
                    success: false,
                    delivered: false,
                    blocked: false,
                    loop: true,
                    trace: this.trace,
                    reason: 'Loop detected',
                };
            }
            visitedStates.add(stateKey);

            // Process at current device using polymorphism
            const device = this.getDevice(event.nodeId);
            if (!device) continue;

            const processResult = this.processAtDevice(
                device,
                event.interfaceId,
                event.packet,
                this.eventQueue.getTime()
            );

            this.trace.push(...processResult.trace);

            if (processResult.delivered) {
                return {
                    success: true,
                    delivered: true,
                    blocked: false,
                    loop: false,
                    trace: this.trace,
                    reason: `Packet delivered to ${device.getLabel()}`,
                };
            }

            for (const newEvent of processResult.events) {
                this.eventQueue.enqueue(newEvent);
            }
        }

        // Check if we hit max hops
        if (hops >= this.options.maxHops) {
            return {
                success: false,
                delivered: false,
                blocked: false,
                loop: true,
                trace: this.trace,
                reason: 'Max hops exceeded (possible loop)',
            };
        }

        // No more events but not delivered
        const lastTrace = this.trace[this.trace.length - 1];
        const wasBlocked = lastTrace?.action === 'acl-deny' || lastTrace?.action === 'drop';

        return {
            success: false,
            delivered: false,
            blocked: wasBlocked,
            loop: false,
            trace: this.trace,
            reason: wasBlocked ? lastTrace.reason : 'Packet did not reach destination',
        };
    }

    /**
     * Process packet at a device using polymorphism
     * Each device type implements its own processPacket method
     */
    private processAtDevice(
        device: Device,
        interfaceId: string,
        packet: Packet,
        time: number
    ): { events: { packet: Packet; nodeId: string; interfaceId: string }[]; trace: TraceHop[]; delivered: boolean } {
        // Get MAC table if device is a switch
        const macTable = device.getType() === 'switch' 
            ? this.macTables.get(device.getId())
            : undefined;

        // Use polymorphism - each device implements processPacket differently
        const result = device.processPacket(
            interfaceId,
            packet,
            this.topology.links,
            time,
            macTable
        );

        return result;
    }

    // Get current trace
    getTrace(): TraceHop[] {
        return [...this.trace];
    }

    // Get MAC table for a switch
    getMacTable(switchId: string): MacTable | undefined {
        return this.macTables.get(switchId);
    }

    // Get device instance (public API for accessing device objects)
    getDeviceInstance(nodeId: string): Device | undefined {
        return this.devices.get(nodeId);
    }
}

// Helper to convert React Flow topology to SimTopology
export function convertTopology(
    nodes: any[],
    edges: any[]
): SimTopology {
    const simNodes: SimNode[] = nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        interfaces: node.data.config?.interfaces || [],
        macLearning: node.data.config?.macLearning,
        vlanDatabase: node.data.config?.vlanDatabase,
        staticRoutes: node.data.config?.staticRoutes,
        aclRules: node.data.config?.aclRules,
        defaultPolicy: node.data.config?.defaultPolicy,
    }));

    const simLinks = edges.map(edge => ({
        id: edge.id,
        source: { 
            nodeId: edge.source, 
            interfaceId: getInterfaceForConnection(simNodes, edge.source, edge.sourceHandle) 
        },
        target: { 
            nodeId: edge.target, 
            interfaceId: getInterfaceForConnection(simNodes, edge.target, edge.targetHandle) 
        },
    }));

    return { nodes: simNodes, links: simLinks };
}

// Get interface ID for a connection (uses first available if not specified)
function getInterfaceForConnection(nodes: SimNode[], nodeId: string, handleId?: string): string {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 'eth0';
    
    if (handleId && node.interfaces.some(i => i.id === handleId)) {
        return handleId;
    }
    
    return node.interfaces[0]?.id || 'eth0';
}
