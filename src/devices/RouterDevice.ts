// Router Device Class - Represents network routers
// Inherits from Device base class

import { Device, type DeviceProcessResult, type DevicePortConfig } from './Device';
import type { Packet, SimLink, TraceHop, SimEvent } from '../simulator/types';
import type { RouterConfig } from '../store/useTopologyStore';
import { generateMac, generateDefaultIp } from '../lib/validators';
import { findBestRoute, ipInSubnet } from '../simulator/utils';

// COMPONENT DEFINITION - Router Device Class
export class RouterDevice extends Device {
    // PROPERTIES
    protected staticRoutes: { prefix: string; nextHop: string; outInterface: string }[];

    // CONSTRUCTOR
    constructor(
        id: string,
        label: string,
        config: RouterConfig
    ) {
        super(id, label, 'router', config);
        this.staticRoutes = config.staticRoutes || [];
    }

    // IMPLEMENT ABSTRACT METHODS
    /**
     * Process incoming packet at router
     * Implements IP forwarding, static routing, and TTL handling
     */
    processPacket(
        interfaceId: string,
        packet: Packet,
        links: SimLink[],
        time: number
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

        // Check if packet is for this router
        const isForUs = this.isPacketForRouter(packet);
        if (isForUs) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'deliver',
                `Packet delivered to router ${this.label}`,
                packet
            ));
            return { events, trace, delivered: true };
        }

        // Check TTL
        if (packet.ttl <= 1) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'drop',
                'TTL expired',
                packet
            ));
            return { events, trace, delivered: false };
        }

        // Decrement TTL
        const routedPacket: Packet = { ...packet, ttl: packet.ttl - 1 };

        // Receive trace
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'receive',
            `Packet received on ${interfaceId}`,
            routedPacket
        ));

        // If no destination IP, can't route
        if (!packet.dstIp) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'drop',
                'No destination IP for routing',
                routedPacket
            ));
            return { events, trace, delivered: false };
        }

        // Check directly connected networks first
        const directRoute = this.findDirectRoute(packet.dstIp, interfaceId, links, routedPacket, trace, time);
        if (directRoute) {
            return { events: [directRoute], trace, delivered: false };
        }

        // Lookup static routes
        const staticRoute = this.findStaticRoute(packet.dstIp, links, routedPacket, trace, time);
        if (staticRoute) {
            return { events: [staticRoute], trace, delivered: false };
        }

        // No route found
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'drop',
            `No route to ${packet.dstIp}`,
            routedPacket
        ));

        return { events, trace, delivered: false };
    }

    /**
     * Get port configurations for router
     * Routers have 1 port per side (4 total)
     */
    getPortConfigurations(): DevicePortConfig[] {
        return [
            { position: 'top', id: 't', offset: 50 },
            { position: 'right', id: 'r', offset: 50 },
            { position: 'bottom', id: 'b', offset: 50 },
            { position: 'left', id: 'l', offset: 50 },
        ];
    }

    /**
     * Get default configuration for router
     */
    getDefaultConfig(nodeIndex: number): RouterConfig {
        return {
            interfaces: [{
                id: 'eth0',
                mac: generateMac(),
                ip: generateDefaultIp(nodeIndex),
            }],
            staticRoutes: [],
        };
    }

    // PROTECTED METHODS
    /**
     * Check if packet is for this router
     */
    protected isPacketForRouter(packet: Packet): boolean {
        return this.interfaces.some(iface => {
            const ifaceIp = iface.ip?.split('/')[0];
            return ifaceIp && ifaceIp === packet.dstIp;
        });
    }

    /**
     * Find directly connected network route
     */
    protected findDirectRoute(
        dstIp: string,
        ingressInterfaceId: string,
        links: SimLink[],
        routedPacket: Packet,
        trace: TraceHop[],
        time: number
    ): Omit<SimEvent, 'time'> | null {
        for (const iface of this.interfaces) {
            if (iface.id === ingressInterfaceId || !iface.ip) continue;
            
            // Check if destination is in this interface's subnet
            if (ipInSubnet(dstIp, iface.ip)) {
                const forwardedPacket: Packet = {
                    ...routedPacket,
                    srcMac: iface.mac,
                };
                
                const connected = this.findConnectedInterface(links, iface.id);
                if (connected) {
                    trace.push(this.createTraceHop(
                        time,
                        iface.id,
                        'route',
                        `Routing to directly connected network via ${iface.id}`,
                        forwardedPacket
                    ));
                    return this.createForwardEvent(forwardedPacket, connected.nodeId, connected.interfaceId);
                }
            }
        }
        return null;
    }

    /**
     * Find static route for destination
     */
    protected findStaticRoute(
        dstIp: string,
        links: SimLink[],
        routedPacket: Packet,
        trace: TraceHop[],
        time: number
    ): Omit<SimEvent, 'time'> | null {
        const route = findBestRoute(this.staticRoutes, dstIp);
        
        if (route) {
            const egressIface = this.getInterface(route.outInterface);
            
            if (egressIface) {
                const forwardedPacket: Packet = {
                    ...routedPacket,
                    srcMac: egressIface.mac,
                };
                
                const connected = this.findConnectedInterface(links, egressIface.id);
                if (connected) {
                    trace.push(this.createTraceHop(
                        time,
                        egressIface.id,
                        'route',
                        `Routing via static route ${route.prefix} -> ${route.nextHop}`,
                        forwardedPacket
                    ));
                    return this.createForwardEvent(forwardedPacket, connected.nodeId, connected.interfaceId);
                }
            }
        }
        return null;
    }

    /**
     * Get type-specific properties
     */
    protected getTypeSpecificProperties(): Record<string, any> {
        return {
            staticRoutes: this.staticRoutes,
        };
    }

    // PUBLIC METHODS
    /**
     * Get static routes
     */
    getStaticRoutes(): { prefix: string; nextHop: string; outInterface: string }[] {
        return [...this.staticRoutes];
    }

    /**
     * Add static route
     */
    addStaticRoute(prefix: string, nextHop: string, outInterface: string): void {
        this.staticRoutes.push({ prefix, nextHop, outInterface });
    }

    /**
     * Remove static route
     */
    removeStaticRoute(prefix: string): void {
        this.staticRoutes = this.staticRoutes.filter(r => r.prefix !== prefix);
    }
}
