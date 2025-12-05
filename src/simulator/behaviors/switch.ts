// Switch behavior: MAC learning, VLAN filtering, flooding

import type { Packet, SimNode, SimLink, TraceHop, SimEvent, MacTable, MacTableEntry } from '../types';
import { getConnectedInterface, macTableKey, isBroadcastMac, isMulticastMac } from '../utils';

export interface SwitchBehaviorResult {
    events: Omit<SimEvent, 'time'>[];
    trace: TraceHop[];
}

// Process an incoming packet at a switch
export function switchProcess(
    node: SimNode,
    interfaceId: string,
    packet: Packet,
    links: SimLink[],
    macTable: MacTable,
    time: number
): SwitchBehaviorResult {
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
        return { events, trace };
    }

    // Determine the VLAN for this packet
    let vlan = packet.vlan;
    
    // If ingress is access port, packet gets that VLAN
    if (ingressIface.portMode === 'access') {
        vlan = ingressIface.vlan || 1;
    }
    // If ingress is trunk, use packet's VLAN tag (or native VLAN 1)
    else if (ingressIface.portMode === 'trunk') {
        vlan = packet.vlan || 1;
        // Check if VLAN is allowed on this trunk
        if (ingressIface.allowedVlans && !ingressIface.allowedVlans.includes(vlan)) {
            trace.push({
                time,
                nodeId: node.id,
                nodeLabel: node.label,
                interfaceId,
                action: 'drop',
                reason: `VLAN ${vlan} not allowed on trunk`,
                packet,
            });
            return { events, trace };
        }
    }

    // Default to VLAN 1 if not set
    vlan = vlan || 1;

    // Update packet with resolved VLAN
    const processedPacket: Packet = { ...packet, vlan };

    // MAC Learning: learn source MAC on ingress port
    if (node.macLearning !== false) {
        const key = macTableKey(packet.srcMac, vlan);
        const existing = macTable.get(key);
        
        if (!existing || existing.interfaceId !== interfaceId) {
            macTable.set(key, {
                mac: packet.srcMac,
                interfaceId,
                vlan,
                timestamp: time,
            });
            
            trace.push({
                time,
                nodeId: node.id,
                nodeLabel: node.label,
                interfaceId,
                action: 'learn',
                reason: `Learned ${packet.srcMac} on ${interfaceId} (VLAN ${vlan})`,
                packet: processedPacket,
            });
        }
    }

    // Receive trace
    trace.push({
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId,
        action: 'receive',
        reason: `Packet received on ${interfaceId}`,
        packet: processedPacket,
    });

    // Determine forwarding: lookup or flood
    const isBroadcast = isBroadcastMac(packet.dstMac) || isMulticastMac(packet.dstMac);
    const dstKey = macTableKey(packet.dstMac, vlan);
    const dstEntry = macTable.get(dstKey);

    if (!isBroadcast && dstEntry) {
        // Unicast forwarding - send to known port
        const egressIface = node.interfaces.find(i => i.id === dstEntry.interfaceId);
        
        if (egressIface && egressIface.id !== interfaceId) {
            // Check VLAN compatibility on egress
            if (canEgressOnInterface(egressIface, vlan)) {
                const outPacket = prepareEgressPacket(processedPacket, egressIface);
                const connected = getConnectedInterface(links, node.id, egressIface.id);
                
                if (connected) {
                    events.push({
                        packet: outPacket,
                        nodeId: connected.nodeId,
                        interfaceId: connected.interfaceId,
                    });
                    
                    trace.push({
                        time,
                        nodeId: node.id,
                        nodeLabel: node.label,
                        interfaceId: egressIface.id,
                        action: 'forward',
                        reason: `Forwarding to known MAC on ${egressIface.id}`,
                        packet: outPacket,
                    });
                }
            }
        }
    } else {
        // Flood to all ports in same VLAN (except ingress)
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'flood',
            reason: isBroadcast ? 'Flooding broadcast' : 'Unknown destination, flooding',
            packet: processedPacket,
        });

        for (const egressIface of node.interfaces) {
            if (egressIface.id === interfaceId) continue; // Don't send back on ingress
            
            if (canEgressOnInterface(egressIface, vlan)) {
                const outPacket = prepareEgressPacket(processedPacket, egressIface);
                const connected = getConnectedInterface(links, node.id, egressIface.id);
                
                if (connected) {
                    events.push({
                        packet: outPacket,
                        nodeId: connected.nodeId,
                        interfaceId: connected.interfaceId,
                    });
                }
            }
        }
    }

    return { events, trace };
}

// Check if packet can egress on this interface
function canEgressOnInterface(iface: SimNode['interfaces'][0], vlan: number): boolean {
    if (iface.portMode === 'access') {
        return iface.vlan === vlan;
    }
    if (iface.portMode === 'trunk') {
        if (!iface.allowedVlans) return true; // All VLANs allowed
        return iface.allowedVlans.includes(vlan);
    }
    // Default: access mode, VLAN 1
    return vlan === 1;
}

// Prepare packet for egress (handle VLAN tagging)
function prepareEgressPacket(packet: Packet, egressIface: SimNode['interfaces'][0]): Packet {
    if (egressIface.portMode === 'access') {
        // Strip VLAN tag for access port
        return { ...packet, vlan: undefined };
    }
    // Keep VLAN tag for trunk
    return packet;
}
