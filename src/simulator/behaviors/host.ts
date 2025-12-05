// Host behavior: send and receive packets

import type { Packet, SimNode, SimLink, TraceHop, SimEvent } from '../types';
import { getConnectedInterface, generatePacketId } from '../utils';

export interface HostBehaviorResult {
    events: Omit<SimEvent, 'time'>[];
    trace: TraceHop[];
    delivered: boolean;
}

// Process an incoming packet at a host
export function hostReceive(
    node: SimNode,
    interfaceId: string,
    packet: Packet,
    time: number
): HostBehaviorResult {
    const trace: TraceHop[] = [];
    const iface = node.interfaces.find(i => i.id === interfaceId);

    // Check if packet is for this host
    const isForUs = 
        packet.dstMac.toUpperCase() === iface?.mac.toUpperCase() ||
        packet.dstMac.toUpperCase() === 'FF:FF:FF:FF:FF:FF' ||
        (packet.dstIp && iface?.ip?.split('/')[0] === packet.dstIp);

    if (isForUs) {
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'deliver',
            reason: `Packet delivered to ${node.label}`,
            packet,
        });
        return { events: [], trace, delivered: true };
    }

    // Not for us, drop it (hosts don't forward)
    trace.push({
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId,
        action: 'drop',
        reason: 'Packet not addressed to this host',
        packet,
    });

    return { events: [], trace, delivered: false };
}

// Create a packet to send from a host
export function hostSend(
    node: SimNode,
    dstMac: string,
    dstIp: string,
    links: SimLink[],
    time: number,
    proto: Packet['proto'] = 'icmp',
    srcPort?: number,
    dstPort?: number
): HostBehaviorResult {
    const iface = node.interfaces[0]; // Hosts typically have one interface
    if (!iface) {
        return { events: [], trace: [], delivered: false };
    }

    const packet: Packet = {
        id: generatePacketId(),
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

    const trace: TraceHop[] = [{
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId: iface.id,
        action: 'forward',
        reason: `Sending packet from ${node.label} to ${dstIp}`,
        packet,
    }];

    // Find where this interface connects
    const connected = getConnectedInterface(links, node.id, iface.id);
    if (!connected) {
        trace[0].action = 'drop';
        trace[0].reason = 'No link connected';
        return { events: [], trace, delivered: false };
    }

    const events: Omit<SimEvent, 'time'>[] = [{
        packet,
        nodeId: connected.nodeId,
        interfaceId: connected.interfaceId,
    }];

    return { events, trace, delivered: false };
}
