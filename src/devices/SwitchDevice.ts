// Switch Device Class - Represents network switches
// Inherits from Device base class

import { Device, type DeviceProcessResult, type DevicePortConfig } from './Device';
import type { Packet, SimLink, TraceHop, MacTable, SimInterface, SimEvent } from '../simulator/types';
import type { SwitchConfig } from '../store/useTopologyStore';
import { generateMac } from '../lib/validators';
import { macTableKey, isBroadcastMac, isMulticastMac } from '../simulator/utils';

// COMPONENT DEFINITION - Switch Device Class
export class SwitchDevice extends Device {
    // PROPERTIES
    protected macLearning: boolean;
    protected vlanDatabase: number[];

    // CONSTRUCTOR
    constructor(
        id: string,
        label: string,
        config: SwitchConfig
    ) {
        super(id, label, 'switch', config);
        this.macLearning = config.macLearning ?? true;
        this.vlanDatabase = config.vlanDatabase || [1];
    }

    // IMPLEMENT ABSTRACT METHODS
    /**
     * Process incoming packet at switch
     * Implements MAC learning, VLAN filtering, and flooding
     */
    processPacket(
        interfaceId: string,
        packet: Packet,
        links: SimLink[],
        time: number,
        macTable?: MacTable
    ): DeviceProcessResult {
        const trace: TraceHop[] = [];
        const events: Omit<SimEvent, 'time'>[] = [];
        
        const ingressIface = this.getInterface(interfaceId);
        if (!ingressIface) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'drop',
                'Invalid ingress interface',
                packet
            ));
            return { events, trace, delivered: false };
        }

        // Determine VLAN for this packet
        let vlan = this.resolveVlan(packet, ingressIface);
        if (vlan === null) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'drop',
                'VLAN not allowed on trunk',
                packet
            ));
            return { events, trace, delivered: false };
        }

        const processedPacket: Packet = { ...packet, vlan };

        // MAC Learning
        if (this.macLearning && macTable) {
            this.learnMacAddress(packet.srcMac, interfaceId, vlan, time, macTable, trace);
        }

        // Receive trace
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'receive',
            `Packet received on ${interfaceId}`,
            processedPacket
        ));

        // Forward packet
        const isBroadcast = isBroadcastMac(packet.dstMac) || isMulticastMac(packet.dstMac);
        const dstKey = macTableKey(packet.dstMac, vlan);
        const dstEntry = macTable?.get(dstKey);

        if (!isBroadcast && dstEntry) {
            // Unicast forwarding to known port
            this.forwardToKnownPort(dstEntry.interfaceId, processedPacket, interfaceId, vlan, links, events, trace, time);
        } else {
            // Flood to all ports in same VLAN
            this.floodPacket(processedPacket, interfaceId, vlan, links, events, trace, time, isBroadcast);
        }

        return { events, trace, delivered: false };
    }

    /**
     * Get port configurations for switch
     * Switches have 2 ports per side (8 total)
     */
    getPortConfigurations(): DevicePortConfig[] {
        return [
            { position: 'top', id: 't1', offset: 30 },
            { position: 'top', id: 't2', offset: 70 },
            { position: 'right', id: 'r1', offset: 30 },
            { position: 'right', id: 'r2', offset: 70 },
            { position: 'bottom', id: 'b1', offset: 30 },
            { position: 'bottom', id: 'b2', offset: 70 },
            { position: 'left', id: 'l1', offset: 30 },
            { position: 'left', id: 'l2', offset: 70 },
        ];
    }

    /**
     * Get default configuration for switch
     */
    getDefaultConfig(_nodeIndex: number): SwitchConfig {
        return {
            interfaces: [
                { id: 'gi0/1', mac: generateMac(), portMode: 'access', vlan: 1 },
                { id: 'gi0/2', mac: generateMac(), portMode: 'access', vlan: 1 },
                { id: 'gi0/3', mac: generateMac(), portMode: 'access', vlan: 1 },
                { id: 'gi0/4', mac: generateMac(), portMode: 'access', vlan: 1 },
            ],
            vlanDatabase: [1],
            macLearning: true,
        };
    }

    // PROTECTED METHODS
    /**
     * Resolve VLAN for packet based on ingress interface
     */
    protected resolveVlan(packet: Packet, ingressIface: SimInterface): number | null {
        let vlan = packet.vlan;
        
        if (ingressIface.portMode === 'access') {
            vlan = ingressIface.vlan || 1;
        } else if (ingressIface.portMode === 'trunk') {
            vlan = packet.vlan || 1;
            if (ingressIface.allowedVlans && !ingressIface.allowedVlans.includes(vlan)) {
                return null; // VLAN not allowed
            }
        }

        return vlan || 1;
    }

    /**
     * Learn MAC address on ingress port
     */
    protected learnMacAddress(
        mac: string,
        interfaceId: string,
        vlan: number,
        time: number,
        macTable: MacTable,
        trace: TraceHop[]
    ): void {
        const key = macTableKey(mac, vlan);
        const existing = macTable.get(key);
        
        if (!existing || existing.interfaceId !== interfaceId) {
            macTable.set(key, {
                mac,
                interfaceId,
                vlan,
                timestamp: time,
            });
            
            const learnPacket: Packet = {
                id: this.generatePacketId(),
                srcMac: mac,
                dstMac: '',
                ttl: 64,
                proto: 'icmp',
            };
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'learn',
                `Learned ${mac} on ${interfaceId} (VLAN ${vlan})`,
                learnPacket
            ));
        }
    }

    /**
     * Forward packet to known destination port
     */
    protected forwardToKnownPort(
        egressInterfaceId: string,
        packet: Packet,
        ingressInterfaceId: string,
        vlan: number,
        links: SimLink[],
        events: Omit<SimEvent, 'time'>[],
        trace: TraceHop[],
        time: number
    ): void {
        const egressIface = this.getInterface(egressInterfaceId);
        if (!egressIface || egressIface.id === ingressInterfaceId) return;

        if (this.canEgressOnInterface(egressIface, vlan)) {
            const outPacket = this.prepareEgressPacket(packet, egressIface);
            const connected = this.findConnectedInterface(links, egressIface.id);
            
            if (connected) {
                events.push(this.createForwardEvent(outPacket, connected.nodeId, connected.interfaceId));
                trace.push(this.createTraceHop(
                    time,
                    egressIface.id,
                    'forward',
                    `Forwarding to known MAC on ${egressIface.id}`,
                    outPacket
                ));
            }
        }
    }

    /**
     * Flood packet to all ports in same VLAN
     */
    protected floodPacket(
        packet: Packet,
        ingressInterfaceId: string,
        vlan: number,
        links: SimLink[],
        events: Omit<SimEvent, 'time'>[],
        trace: TraceHop[],
        time: number,
        isBroadcast: boolean
    ): void {
        trace.push(this.createTraceHop(
            time,
            ingressInterfaceId,
            'flood',
            isBroadcast ? 'Flooding broadcast' : 'Unknown destination, flooding',
            packet
        ));

        for (const egressIface of this.interfaces) {
            if (egressIface.id === ingressInterfaceId) continue;
            
            if (this.canEgressOnInterface(egressIface, vlan)) {
                const outPacket = this.prepareEgressPacket(packet, egressIface);
                const connected = this.findConnectedInterface(links, egressIface.id);
                
                if (connected) {
                    events.push(this.createForwardEvent(outPacket, connected.nodeId, connected.interfaceId));
                }
            }
        }
    }

    /**
     * Check if packet can egress on this interface
     */
    protected canEgressOnInterface(iface: SimInterface, vlan: number): boolean {
        if (iface.portMode === 'access') {
            return iface.vlan === vlan;
        }
        if (iface.portMode === 'trunk') {
            if (!iface.allowedVlans) return true;
            return iface.allowedVlans.includes(vlan);
        }
        return vlan === 1;
    }

    /**
     * Prepare packet for egress (handle VLAN tagging)
     */
    protected prepareEgressPacket(packet: Packet, egressIface: SimInterface): Packet {
        if (egressIface.portMode === 'access') {
            return { ...packet, vlan: undefined };
        }
        return packet;
    }

    /**
     * Get type-specific properties
     */
    protected getTypeSpecificProperties(): Record<string, any> {
        return {
            macLearning: this.macLearning,
            vlanDatabase: this.vlanDatabase,
        };
    }

    // PUBLIC METHODS
    /**
     * Get MAC learning status
     */
    isMacLearningEnabled(): boolean {
        return this.macLearning;
    }

    /**
     * Get VLAN database
     */
    getVlanDatabase(): number[] {
        return [...this.vlanDatabase];
    }
}
