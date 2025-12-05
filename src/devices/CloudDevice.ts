// Cloud Device Class - Represents Internet/Cloud endpoint
// Acts as a simple passthrough device for network simulation
// Inherits from Device base class

import { Device, type DeviceProcessResult, type DevicePortConfig } from './Device';
import type { Packet, SimLink, TraceHop } from '../simulator/types';
import type { HostConfig } from '../store/useTopologyStore';
import { generateMac, generateDefaultIp } from '../lib/validators';

// COMPONENT DEFINITION - Cloud Device Class
export class CloudDevice extends Device {
    // CONSTRUCTOR
    constructor(
        id: string,
        label: string,
        config: HostConfig
    ) {
        super(id, label, 'cloud', config);
    }

    // IMPLEMENT ABSTRACT METHODS
    /**
     * Process incoming packet at cloud
     * Cloud acts as internet endpoint - accepts all packets
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

        // Cloud accepts all packets (acts as internet)
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'deliver',
            `Packet delivered to ${this.label} (Internet)`,
            packet
        ));

        return { events: [], trace, delivered: true };
    }

    /**
     * Get port configurations for cloud
     * Cloud has 1 port on the right side
     */
    getPortConfigurations(): DevicePortConfig[] {
        return [
            { position: 'right', id: 'eth0', offset: 50 }
        ];
    }

    /**
     * Get default configuration for cloud
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
}
