// Firewall Device Class - Represents network firewalls
// Inherits from Device base class

import { Device, type DeviceProcessResult, type DevicePortConfig } from './Device';
import type { Packet, SimLink, TraceHop, SimEvent } from '../simulator/types';
import type { FirewallConfig } from '../store/useTopologyStore';
import { generateMac, generateDefaultIp } from '../lib/validators';
import { ipInSubnet } from '../simulator/utils';

// TYPES & INTERFACES
interface AclRule {
    id: string;
    order: number;
    action: 'allow' | 'deny';
    srcIp?: string;
    dstIp?: string;
    proto?: string;
    srcPort?: number;
    dstPort?: number;
}

// COMPONENT DEFINITION - Firewall Device Class
export class FirewallDevice extends Device {
    // PROPERTIES
    protected aclRules: AclRule[];
    protected defaultPolicy: 'allow' | 'deny';

    // CONSTRUCTOR
    constructor(
        id: string,
        label: string,
        config: FirewallConfig
    ) {
        super(id, label, 'firewall', config);
        this.aclRules = config.aclRules || [];
        this.defaultPolicy = config.defaultPolicy || 'deny';
    }

    // IMPLEMENT ABSTRACT METHODS
    /**
     * Process incoming packet at firewall
     * Implements ACL rule matching and packet filtering
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

        // Receive trace
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'receive',
            `Packet received on ${interfaceId}`,
            packet
        ));

        // Check if packet is for this firewall
        const isForUs = this.isPacketForFirewall(packet);
        if (isForUs) {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'deliver',
                `Packet delivered to firewall ${this.label}`,
                packet
            ));
            return { events, trace, delivered: true };
        }

        // Match ACL rules (ordered)
        const aclResult = this.matchAclRules(packet);
        
        if (aclResult.action === 'deny') {
            trace.push(this.createTraceHop(
                time,
                interfaceId,
                'acl-deny',
                aclResult.matched 
                    ? `Blocked by ACL rule ${aclResult.matchedRule?.order}` 
                    : `Blocked by default policy (${this.defaultPolicy})`,
                packet
            ));
            return { events, trace, delivered: false };
        }

        // ACL allows - forward the packet
        trace.push(this.createTraceHop(
            time,
            interfaceId,
            'acl-allow',
            aclResult.matched 
                ? `Allowed by ACL rule ${aclResult.matchedRule?.order}` 
                : `Allowed by default policy (${this.defaultPolicy})`,
            packet
        ));

        // Forward to egress interface
        const forwardEvent = this.forwardPacket(packet, interfaceId, links, trace, time);
        if (forwardEvent) {
            events.push(forwardEvent);
        }

        return { events, trace, delivered: false };
    }

    /**
     * Get port configurations for firewall
     * Firewalls have 1 port per side (4 total)
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
     * Get default configuration for firewall
     */
    getDefaultConfig(nodeIndex: number): FirewallConfig {
        return {
            interfaces: [{
                id: 'eth0',
                mac: generateMac(),
                ip: generateDefaultIp(nodeIndex),
            }],
            aclRules: [],
            defaultPolicy: 'deny',
        };
    }

    // PROTECTED METHODS
    /**
     * Check if packet is for this firewall
     */
    protected isPacketForFirewall(packet: Packet): boolean {
        return this.interfaces.some(iface => {
            const ifaceIp = iface.ip?.split('/')[0];
            return ifaceIp && ifaceIp === packet.dstIp;
        });
    }

    /**
     * Match packet against ACL rules
     */
    protected matchAclRules(packet: Packet): {
        matched: boolean;
        action: 'allow' | 'deny';
        matchedRule: AclRule | null;
    } {
        const sortedRules = [...this.aclRules].sort((a, b) => a.order - b.order);
        
        for (const rule of sortedRules) {
            if (this.matchesRule(packet, rule)) {
                return {
                    matched: true,
                    action: rule.action,
                    matchedRule: rule,
                };
            }
        }

        return {
            matched: false,
            action: this.defaultPolicy,
            matchedRule: null,
        };
    }

    /**
     * Check if packet matches an ACL rule
     */
    protected matchesRule(packet: Packet, rule: AclRule): boolean {
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

    /**
     * Forward packet to egress interface
     */
    protected forwardPacket(
        packet: Packet,
        ingressInterfaceId: string,
        links: SimLink[],
        trace: TraceHop[],
        time: number
    ): Omit<SimEvent, 'time'> | null {
        // Forward to first non-ingress interface
        for (const egressIface of this.interfaces) {
            if (egressIface.id === ingressInterfaceId) continue;
            
            const connected = this.findConnectedInterface(links, egressIface.id);
            if (connected) {
                const forwardedPacket: Packet = {
                    ...packet,
                    srcMac: egressIface.mac,
                };
                
                trace.push(this.createTraceHop(
                    time,
                    egressIface.id,
                    'forward',
                    `Forwarding via ${egressIface.id}`,
                    forwardedPacket
                ));
                
                return this.createForwardEvent(forwardedPacket, connected.nodeId, connected.interfaceId);
            }
        }
        return null;
    }

    /**
     * Get type-specific properties
     */
    protected getTypeSpecificProperties(): Record<string, any> {
        return {
            aclRules: this.aclRules,
            defaultPolicy: this.defaultPolicy,
        };
    }

    // PUBLIC METHODS
    /**
     * Get ACL rules
     */
    getAclRules(): AclRule[] {
        return [...this.aclRules];
    }

    /**
     * Add ACL rule
     */
    addAclRule(rule: AclRule): void {
        this.aclRules.push(rule);
        this.aclRules.sort((a, b) => a.order - b.order);
    }

    /**
     * Remove ACL rule
     */
    removeAclRule(ruleId: string): void {
        this.aclRules = this.aclRules.filter(r => r.id !== ruleId);
    }

    /**
     * Get default policy
     */
    getDefaultPolicy(): 'allow' | 'deny' {
        return this.defaultPolicy;
    }

    /**
     * Set default policy
     */
    setDefaultPolicy(policy: 'allow' | 'deny'): void {
        this.defaultPolicy = policy;
    }
}
