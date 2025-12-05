// Host Device Class - Represents end devices (PC, Laptop, Phone, Server)
// Inherits from Device base class

import { Device, type DeviceProcessResult, type DevicePortConfig, type DeviceType } from './Device';
import type { Packet, SimLink, TraceHop, SimEvent } from '../simulator/types';
import type { HostConfig } from '../store/useTopologyStore';
import { generateMac, generateDefaultIp } from '../lib/validators';

// COMPONENT DEFINITION - Host Device Class
export class HostDevice extends Device {
    // CONSTRUCTOR
    constructor(
        id: string,
        label: string,
        type: DeviceType,
        config: HostConfig
    ) {
        super(id, label, type, config);
    }

    // IMPLEMENT ABSTRACT METHODS
    /**
     * Process incoming packet at host
     * Hosts receive packets and deliver if addressed to them
     */
    processPacket(
        interfaceId: string,
        packet: Packet,
        _links: SimLink[],
        time: number
    ): DeviceProcessResult {
        const trace: TraceHop[] = [];
        const iface = this.getInterface(interfaceId);

        if (!iface) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'drop',
                'Invalid interface',
                packet
            ));
            return { events: [], trace, delivered: false };
        }

        // Check if packet is for this host
        const isForUs = this.isPacketForThisDevice(packet, interfaceId);

        if (isForUs) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'deliver',
                `Packet delivered to ${this.label}`,
                packet
            ));
            return { events: [], trace, delivered: true };
        }

        // Not for us, drop it (hosts don't forward)
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'drop',
            'Packet not addressed to this host',
            packet
        ));

        return { events: [], trace, delivered: false };
    }

    /**
     * Get port configurations for host
     * Hosts have 1 port on the right side
     */
    getPortConfigurations(): DevicePortConfig[] {
        return [
            { position: 'right', id: 'eth0', offset: 50 }
        ];
    }

    /**
     * Get default configuration for host
     */
    getDefaultConfig(nodeIndex: number): HostConfig {
        return {
            interfaces: [{
                id: 'eth0',
                mac: generateMac(),
                ip: generateDefaultIp(nodeIndex),
            }],
        };
    }

    /**
     * Send a packet from this host
     * Public method for initiating packet transmission
     */
    sendPacket(
        dstMac: string,
        dstIp: string,
        links: SimLink[],
        time: number,
        proto: Packet['proto'] = 'icmp',
        srcPort?: number,
        dstPort?: number
    ): DeviceProcessResult {
        const iface = this.interfaces[0]; // Hosts typically have one interface
        if (!iface) {
            return { events: [], trace: [], delivered: false };
        }

        const packet: Packet = {
            id: this.generatePacketId(),
            srcMac: iface.mac,
            dstMac,
            srcIp: iface.ip?.split('/')[0],
            dstIp,
            vlan: iface.vlan,
            proto,
            srcPort,
            dstPort,
            ttl: 64,
        };

        const trace: TraceHop[] = [this.createTraceHop(
            time,
            iface.id,
            'forward',
            `Sending packet from ${this.label} to ${dstIp}`,
            packet
        )];

        // Find where this interface connects
        const connected = this.findConnectedInterface(links, iface.id);
        if (!connected) {
            trace[0].action = 'drop';
            trace[0].reason = 'No link connected';
            return { events: [], trace, delivered: false };
        }

        const events: Omit<SimEvent, 'time'>[] = [
            this.createForwardEvent(packet, connected.nodeId, connected.interfaceId)
        ];

        return { events, trace, delivered: false };
    }
}
