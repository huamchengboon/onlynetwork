// Router behavior: IP forwarding, static routing

import type { Packet, SimNode, SimLink, TraceHop, SimEvent } from '../types';
import { getConnectedInterface, findBestRoute } from '../utils';

export interface RouterBehaviorResult {
    events: Omit<SimEvent, 'time'>[];
    trace: TraceHop[];
    delivered: boolean;
}

// Process an incoming packet at a router
export function routerProcess(
    node: SimNode,
    interfaceId: string,
    packet: Packet,
    links: SimLink[],
    time: number
): RouterBehaviorResult {
    const trace: TraceHop[] = [];
    const events: Omit<SimEvent, 'time'>[] = [];
    
    const ingressIface = node.interfaces.find(i => i.id === interfaceId);
    if (!ingressIface) {
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'drop',
            reason: 'Invalid ingress interface',
            packet,
        });
        return { events, trace, delivered: false };
    }

    // Check if packet is for this router (one of its IPs)
    const isForUs = node.interfaces.some(iface => {
        const ifaceIp = iface.ip?.split('/')[0];
        return ifaceIp && ifaceIp === packet.dstIp;
    });

    if (isForUs) {
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'deliver',
            reason: `Packet delivered to router ${node.label}`,
            packet,
        });
        return { events, trace, delivered: true };
    }

    // Check TTL
    if (packet.ttl <= 1) {
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'drop',
            reason: 'TTL expired',
            packet,
        });
        return { events, trace, delivered: false };
    }

    // Decrement TTL
    const routedPacket: Packet = { ...packet, ttl: packet.ttl - 1 };

    // Receive trace
    trace.push({
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId,
        action: 'receive',
        reason: `Packet received on ${interfaceId}`,
        packet: routedPacket,
    });

    // If no destination IP, can't route
    if (!packet.dstIp) {
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'drop',
            reason: 'No destination IP for routing',
            packet: routedPacket,
        });
        return { events, trace, delivered: false };
    }

    // Check directly connected networks first
    for (const iface of node.interfaces) {
        if (iface.ip) {
            const [ifaceIp, prefix] = iface.ip.split('/');
            const subnetMask = parseInt(prefix, 10);
            
            // Simple check: if first 3 octets match, consider it directly connected
            // (This is simplified - proper subnet matching is in utils.ts)
            const dstOctets = packet.dstIp.split('.');
            const ifaceOctets = ifaceIp.split('.');
            
            let match = true;
            const octetsToCheck = Math.floor(subnetMask / 8);
            for (let i = 0; i < octetsToCheck; i++) {
                if (dstOctets[i] !== ifaceOctets[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match && iface.id !== interfaceId) {
                // Update source MAC to egress interface
                const forwardedPacket: Packet = {
                    ...routedPacket,
                    srcMac: iface.mac,
                };
                
                const connected = getConnectedInterface(links, node.id, iface.id);
                if (connected) {
                    events.push({
                        packet: forwardedPacket,
                        nodeId: connected.nodeId,
                        interfaceId: connected.interfaceId,
                    });
                    
                    trace.push({
                        time,
                        nodeId: node.id,
                        nodeLabel: node.label,
                        interfaceId: iface.id,
                        action: 'route',
                        reason: `Routing to directly connected network via ${iface.id}`,
                        packet: forwardedPacket,
                    });
                    
                    return { events, trace, delivered: false };
                }
            }
        }
    }

    // Lookup static routes
    const route = findBestRoute(node.staticRoutes, packet.dstIp);
    
    if (route) {
        const egressIface = node.interfaces.find(i => i.id === route.outInterface);
        
        if (egressIface) {
            const forwardedPacket: Packet = {
                ...routedPacket,
                srcMac: egressIface.mac,
            };
            
            const connected = getConnectedInterface(links, node.id, egressIface.id);
            if (connected) {
                events.push({
                    packet: forwardedPacket,
                    nodeId: connected.nodeId,
                    interfaceId: connected.interfaceId,
                });
                
                trace.push({
                    time,
                    nodeId: node.id,
                    nodeLabel: node.label,
                    interfaceId: egressIface.id,
                    action: 'route',
                    reason: `Routing via static route ${route.prefix} -> ${route.nextHop}`,
                    packet: forwardedPacket,
                });
                
                return { events, trace, delivered: false };
            }
        }
    }

    // No route found
    trace.push({
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId,
        action: 'drop',
        reason: `No route to ${packet.dstIp}`,
        packet: routedPacket,
    });

    return { events, trace, delivered: false };
}
