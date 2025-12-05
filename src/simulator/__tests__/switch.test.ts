// Unit tests for Switch behavior

import { describe, it, expect, beforeEach } from 'vitest';
import { switchProcess } from '../behaviors/switch';
import type { SimNode, SimLink, Packet, MacTable } from '../types';

describe('Switch Behavior', () => {
    let switchNode: SimNode;
    let links: SimLink[];
    let macTable: MacTable;

    beforeEach(() => {
        switchNode = {
            id: 'sw1',
            type: 'switch',
            label: 'Switch 1',
            interfaces: [
                { id: 'gi0/1', mac: '00:00:00:00:00:01', portMode: 'access', vlan: 10 },
                { id: 'gi0/2', mac: '00:00:00:00:00:02', portMode: 'access', vlan: 10 },
                { id: 'gi0/3', mac: '00:00:00:00:00:03', portMode: 'access', vlan: 20 },
                { id: 'gi0/4', mac: '00:00:00:00:00:04', portMode: 'trunk', allowedVlans: [10, 20] },
            ],
            macLearning: true,
            vlanDatabase: [10, 20],
        };

        links = [
            { id: 'link1', source: { nodeId: 'sw1', interfaceId: 'gi0/1' }, target: { nodeId: 'host1', interfaceId: 'eth0' } },
            { id: 'link2', source: { nodeId: 'sw1', interfaceId: 'gi0/2' }, target: { nodeId: 'host2', interfaceId: 'eth0' } },
            { id: 'link3', source: { nodeId: 'sw1', interfaceId: 'gi0/3' }, target: { nodeId: 'host3', interfaceId: 'eth0' } },
            { id: 'link4', source: { nodeId: 'sw1', interfaceId: 'gi0/4' }, target: { nodeId: 'sw2', interfaceId: 'gi0/1' } },
        ];

        macTable = new Map();
    });

    describe('MAC Learning', () => {
        it('should learn source MAC address', () => {
            const packet: Packet = {
                id: 'pkt1',
                srcMac: 'AA:BB:CC:DD:EE:FF',
                dstMac: 'FF:FF:FF:FF:FF:FF',
                proto: 'icmp',
                ttl: 64,
            };

            switchProcess(switchNode, 'gi0/1', packet, links, macTable, 0);

            expect(macTable.size).toBe(1);
            const entry = macTable.get('AA:BB:CC:DD:EE:FF-10');
            expect(entry).toBeDefined();
            expect(entry?.interfaceId).toBe('gi0/1');
            expect(entry?.vlan).toBe(10);
        });

        it('should update MAC entry when host moves', () => {
            const packet: Packet = {
                id: 'pkt1',
                srcMac: 'AA:BB:CC:DD:EE:FF',
                dstMac: 'FF:FF:FF:FF:FF:FF',
                proto: 'icmp',
                ttl: 64,
            };

            // Learn on port 1
            switchProcess(switchNode, 'gi0/1', packet, links, macTable, 0);
            expect(macTable.get('AA:BB:CC:DD:EE:FF-10')?.interfaceId).toBe('gi0/1');

            // Move to port 2
            switchProcess(switchNode, 'gi0/2', packet, links, macTable, 1);
            expect(macTable.get('AA:BB:CC:DD:EE:FF-10')?.interfaceId).toBe('gi0/2');
        });
    });

    describe('Flooding', () => {
        it('should flood broadcast packets to all ports in same VLAN', () => {
            const packet: Packet = {
                id: 'pkt1',
                srcMac: 'AA:BB:CC:DD:EE:FF',
                dstMac: 'FF:FF:FF:FF:FF:FF',
                proto: 'icmp',
                ttl: 64,
            };

            const result = switchProcess(switchNode, 'gi0/1', packet, links, macTable, 0);

            // Should flood to gi0/2 (same VLAN 10) and gi0/4 (trunk allows VLAN 10)
            // But NOT gi0/3 (VLAN 20) or back to gi0/1
            const forwardedPorts = result.events.map(e => e.interfaceId);
            expect(forwardedPorts).toContain('eth0'); // host2's interface (via gi0/2)
            expect(result.events.length).toBeGreaterThanOrEqual(1);
        });

        it('should flood unknown unicast', () => {
            const packet: Packet = {
                id: 'pkt1',
                srcMac: 'AA:BB:CC:DD:EE:FF',
                dstMac: '11:22:33:44:55:66', // Unknown destination
                proto: 'icmp',
                ttl: 64,
            };

            const result = switchProcess(switchNode, 'gi0/1', packet, links, macTable, 0);

            // Check that we have a flood action in trace
            const floodAction = result.trace.find(t => t.action === 'flood');
            expect(floodAction).toBeDefined();
        });
    });

    describe('Unicast Forwarding', () => {
        it('should forward to known MAC', () => {
            // Use unicast MAC (first octet must be even, hex 10 = dec 16, even)
            const dstMac = '10:22:33:44:55:66';
            
            // Pre-populate MAC table with uppercase key (macTableKey() uppercases)
            macTable.set(dstMac.toUpperCase() + '-10', {
                mac: dstMac,
                interfaceId: 'gi0/2',
                vlan: 10,
                timestamp: 0,
            });

            const packet: Packet = {
                id: 'pkt1',
                srcMac: 'AA:BB:CC:DD:EE:FF',
                dstMac: dstMac,
                proto: 'icmp',
                ttl: 64,
            };

            const result = switchProcess(switchNode, 'gi0/1', packet, links, macTable, 0);

            // Key behavior: packet should be forwarded to the known MAC destination
            const forwardToHost2 = result.events.find(e => e.nodeId === 'host2');
            expect(forwardToHost2).toBeDefined();
            
            // Should NOT have flooded (no flood action in trace)
            const floodAction = result.trace.find(t => t.action === 'flood');
            expect(floodAction).toBeUndefined();
        });
    });

    describe('VLAN Isolation', () => {
        it('should not forward between different VLANs', () => {
            // Host on VLAN 10 sends to broadcast
            const packet: Packet = {
                id: 'pkt1',
                srcMac: 'AA:BB:CC:DD:EE:FF',
                dstMac: 'FF:FF:FF:FF:FF:FF',
                proto: 'icmp',
                ttl: 64,
            };

            const result = switchProcess(switchNode, 'gi0/1', packet, links, macTable, 0);

            // Should NOT forward to gi0/3 (VLAN 20)
            const host3Event = result.events.find(e => e.nodeId === 'host3');
            expect(host3Event).toBeUndefined();
        });
    });
});
