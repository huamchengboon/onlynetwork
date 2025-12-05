// Utility functions for the simulator

import type { SimNode, SimLink, SimInterface } from './types';

// Find the connected interface on the other end of a link
export function getConnectedInterface(
    links: SimLink[],
    nodeId: string,
    interfaceId: string
): { nodeId: string; interfaceId: string } | null {
    for (const link of links) {
        if (link.source.nodeId === nodeId && link.source.interfaceId === interfaceId) {
            return link.target;
        }
        if (link.target.nodeId === nodeId && link.target.interfaceId === interfaceId) {
            return link.source;
        }
    }
    return null;
}

// Find a node by ID
export function getNodeById(nodes: SimNode[], nodeId: string): SimNode | undefined {
    return nodes.find(n => n.id === nodeId);
}

// Find an interface on a node
export function getInterfaceById(node: SimNode, interfaceId: string): SimInterface | undefined {
    return node.interfaces.find(i => i.id === interfaceId);
}

// Generate a MAC table key (mac + vlan for per-VLAN learning)
export function macTableKey(mac: string, vlan: number): string {
    return `${mac.toUpperCase()}-${vlan}`;
}

// Check if a MAC address is broadcast
export function isBroadcastMac(mac: string): boolean {
    return mac.toUpperCase() === 'FF:FF:FF:FF:FF:FF';
}

// Check if a MAC address is multicast
export function isMulticastMac(mac: string): boolean {
    const firstOctet = parseInt(mac.split(':')[0], 16);
    return (firstOctet & 0x01) === 1;
}

// Parse CIDR notation and check if IP is in subnet
export function ipInSubnet(ip: string, cidr: string): boolean {
    const [subnetIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    const ipNum = ipToNumber(ip);
    const subnetNum = ipToNumber(subnetIp);
    const mask = prefixToMask(prefix);
    
    return (ipNum & mask) === (subnetNum & mask);
}

// Convert IP string to number
export function ipToNumber(ip: string): number {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

// Convert prefix length to subnet mask
export function prefixToMask(prefix: number): number {
    if (prefix === 0) return 0;
    return (~0 << (32 - prefix)) >>> 0;
}

// Find the best matching route for a destination IP
export function findBestRoute(
    staticRoutes: SimNode['staticRoutes'],
    dstIp: string
): { prefix: string; nextHop: string; outInterface: string } | null {
    if (!staticRoutes || staticRoutes.length === 0) return null;

    let bestRoute: typeof staticRoutes[0] | null = null;
    let bestPrefix = -1;

    for (const route of staticRoutes) {
        const [, prefixStr] = route.prefix.split('/');
        const prefix = parseInt(prefixStr, 10);
        
        if (ipInSubnet(dstIp, route.prefix) && prefix > bestPrefix) {
            bestRoute = route;
            bestPrefix = prefix;
        }
    }

    return bestRoute;
}

// Generate a unique packet ID
export function generatePacketId(): string {
    return `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
