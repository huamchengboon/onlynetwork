// Base Device class - Abstract base class for all network devices
// Implements OOP principles: Encapsulation, Inheritance, Polymorphism

import type { Packet, SimLink, TraceHop, SimEvent, SimInterface } from '../simulator/types';
import { getConnectedInterface, generatePacketId } from '../simulator/utils';
import type { NodeConfig } from '../store/useTopologyStore';

// TYPES & INTERFACES
export type DeviceType = 'host' | 'switch' | 'router' | 'firewall' | 'phone' | 'server' | 'laptop' | 'cloud';

export interface DeviceProcessResult {
    events: Omit<SimEvent, 'time'>[];
    trace: TraceHop[];
    delivered: boolean;
}

export interface DevicePortConfig {
    position: 'top' | 'right' | 'bottom' | 'left';
    id: string;
    offset: number; // Percentage (0-100)
}


// COMPONENT DEFINITION - Abstract Base Device Class
export abstract class Device {
    // PROPERTIES (Encapsulation)
    protected id: string;
    protected label: string;
    protected type: DeviceType;
    protected interfaces: SimInterface[];
    protected config: NodeConfig;

    // CONSTRUCTOR
    constructor(
        id: string,
        label: string,
        type: DeviceType,
        config: NodeConfig
    ) {
        this.id = id;
        this.label = label;
        this.type = type;
        this.config = config;
        this.interfaces = this.extractInterfaces(config);
    }

    // ABSTRACT METHODS (Polymorphism - must be implemented by subclasses)
    /**
     * Process an incoming packet at this device
     * Each device type implements its own packet processing logic
     */
    abstract processPacket(
        interfaceId: string,
        packet: Packet,
        links: SimLink[],
        time: number,
        macTable?: Map<string, any>
    ): DeviceProcessResult;

    /**
     * Get port configurations for this device type
     * Defines where connection ports are located
     */
    abstract getPortConfigurations(): DevicePortConfig[];

    /**
     * Get default configuration for this device type
     */
    abstract getDefaultConfig(nodeIndex: number): NodeConfig;

    // PUBLIC METHODS (Interface)
    /**
     * Get device ID
     */
    getId(): string {
        return this.id;
    }

    /**
     * Get device label
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Get device type
     */
    getType(): DeviceType {
        return this.type;
    }

    /**
     * Get all interfaces
     */
    getInterfaces(): SimInterface[] {
        return [...this.interfaces];
    }

    /**
     * Get interface by ID
     */
    getInterface(interfaceId: string): SimInterface | undefined {
        return this.interfaces.find(i => i.id === interfaceId);
    }

    /**
     * Update device configuration
     */
    updateConfig(config: NodeConfig): void {
        this.config = config;
        this.interfaces = this.extractInterfaces(config);
    }

    /**
     * Get current configuration
     */
    getConfig(): NodeConfig {
        return { ...this.config };
    }

    /**
     * Update device label
     */
    setLabel(label: string): void {
        this.label = label;
    }

    /**
     * Convert device to SimNode format (for simulator compatibility)
     */
    toSimNode(): {
        id: string;
        type: DeviceType;
        label: string;
        interfaces: SimInterface[];
        [key: string]: any;
    } {
        return {
            id: this.id,
            type: this.type,
            label: this.label,
            interfaces: this.interfaces,
            ...this.getTypeSpecificProperties(),
        };
    }

    // PROTECTED METHODS (Helper methods for subclasses)
    /**
     * Extract interfaces from config
     */
    protected extractInterfaces(config: NodeConfig): SimInterface[] {
        if ('interfaces' in config) {
            return config.interfaces.map(iface => ({
                id: iface.id,
                mac: iface.mac,
                ip: iface.ip,
                vlan: iface.vlan,
                portMode: iface.portMode,
                allowedVlans: iface.allowedVlans,
            }));
        }
        return [];
    }

    /**
     * Get type-specific properties (for SimNode conversion)
     * Override in subclasses to add device-specific properties
     */
    protected getTypeSpecificProperties(): Record<string, any> {
        return {};
    }

    /**
     * Check if packet is addressed to this device
     */
    protected isPacketForThisDevice(packet: Packet, interfaceId: string): boolean {
        const iface = this.getInterface(interfaceId);
        if (!iface) return false;

        const dstMacMatch = packet.dstMac.toUpperCase() === iface.mac.toUpperCase();
        const broadcastMatch = packet.dstMac.toUpperCase() === 'FF:FF:FF:FF:FF:FF';
        const ipMatch = packet.dstIp ? iface.ip?.split('/')[0] === packet.dstIp : false;

        return dstMacMatch || broadcastMatch || ipMatch;
    }

    /**
     * Create a trace hop entry
     */
    protected createTraceHop(
        time: number,
        interfaceId: string,
        action: TraceHop['action'],
        reason: string,
        packet: Packet
    ): TraceHop {
        return {
            time,
            nodeId: this.id,
            nodeLabel: this.label,
            interfaceId,
            action,
            reason,
            packet,
        };
    }

    /**
     * Create a forwarding event
     */
    protected createForwardEvent(
        packet: Packet,
        targetNodeId: string,
        targetInterfaceId: string
    ): Omit<SimEvent, 'time'> {
        return {
            packet,
            nodeId: targetNodeId,
            interfaceId: targetInterfaceId,
        };
    }

    /**
     * Find connected interface on a link
     */
    protected findConnectedInterface(
        links: SimLink[],
        interfaceId: string
    ): { nodeId: string; interfaceId: string } | null {
        return getConnectedInterface(links, this.id, interfaceId);
    }

    /**
     * Generate a new packet ID
     */
    protected generatePacketId(): string {
        return generatePacketId();
    }
}
