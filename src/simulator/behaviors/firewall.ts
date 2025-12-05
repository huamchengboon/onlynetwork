// Firewall behavior: ACL rule matching

import type { Packet, SimNode, SimLink, TraceHop, SimEvent } from '../types';
import { getConnectedInterface, ipInSubnet } from '../utils';

export interface FirewallBehaviorResult {
    events: Omit<SimEvent, 'time'>[];
    trace: TraceHop[];
    delivered: boolean;
}

// Process an incoming packet at a firewall
export function firewallProcess(
    node: SimNode,
    interfaceId: string,
    packet: Packet,
    links: SimLink[],
    time: number
): FirewallBehaviorResult {
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

    // Receive trace
    trace.push({
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId,
        action: 'receive',
        reason: `Packet received on ${interfaceId}`,
        packet,
    });

    // Check if packet is for this firewall
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
            reason: `Packet delivered to firewall ${node.label}`,
            packet,
        });
        return { events, trace, delivered: true };
    }

    // Match ACL rules (ordered)
    const aclRules = node.aclRules || [];
    const sortedRules = [...aclRules].sort((a, b) => a.order - b.order);
    
    let matched = false;
    let action: 'allow' | 'deny' = node.defaultPolicy || 'deny';
    let matchedRule: typeof aclRules[0] | null = null;

    for (const rule of sortedRules) {
        if (matchesRule(packet, rule)) {
            matched = true;
            action = rule.action;
            matchedRule = rule;
            break;
        }
    }

    if (action === 'deny') {
        trace.push({
            time,
            nodeId: node.id,
            nodeLabel: node.label,
            interfaceId,
            action: 'acl-deny',
            reason: matched 
                ? `Blocked by ACL rule ${matchedRule?.order}` 
                : `Blocked by default policy (${node.defaultPolicy || 'deny'})`,
            packet,
        });
        return { events, trace, delivered: false };
    }

    // ACL allows - forward the packet
    trace.push({
        time,
        nodeId: node.id,
        nodeLabel: node.label,
        interfaceId,
        action: 'acl-allow',
        reason: matched 
            ? `Allowed by ACL rule ${matchedRule?.order}` 
            : `Allowed by default policy (${node.defaultPolicy})`,
        packet,
    });

    // Forward to egress interface (simple: forward on first non-ingress interface)
    for (const egressIface of node.interfaces) {
        if (egressIface.id === interfaceId) continue;
        
        const connected = getConnectedInterface(links, node.id, egressIface.id);
        if (connected) {
            events.push({
                packet: { ...packet, srcMac: egressIface.mac },
                nodeId: connected.nodeId,
                interfaceId: connected.interfaceId,
            });
            
            trace.push({
                time,
                nodeId: node.id,
                nodeLabel: node.label,
                interfaceId: egressIface.id,
                action: 'forward',
                reason: `Forwarding via ${egressIface.id}`,
                packet,
            });
            break;
        }
    }

    return { events, trace, delivered: false };
}

// Check if a packet matches an ACL rule
function matchesRule(
    packet: Packet, 
    rule: NonNullable<SimNode['aclRules']>[0]
): boolean {
    // Protocol match
    if (rule.proto && rule.proto !== 'any' && rule.proto !== packet.proto) {
        return false;
    }

    // Source IP match
    if (rule.srcIp && rule.srcIp !== 'any' && packet.srcIp) {
        if (rule.srcIp.includes('/')) {
            if (!ipInSubnet(packet.srcIp, rule.srcIp)) return false;
        } else {
            if (rule.srcIp !== packet.srcIp) return false;
        }
    }

    // Destination IP match
    if (rule.dstIp && rule.dstIp !== 'any' && packet.dstIp) {
        if (rule.dstIp.includes('/')) {
            if (!ipInSubnet(packet.dstIp, rule.dstIp)) return false;
        } else {
            if (rule.dstIp !== packet.dstIp) return false;
        }
    }

    // Source port match
    if (rule.srcPort !== undefined && packet.srcPort !== rule.srcPort) {
        return false;
    }

    // Destination port match
    if (rule.dstPort !== undefined && packet.dstPort !== rule.dstPort) {
        return false;
    }

    return true;
}
