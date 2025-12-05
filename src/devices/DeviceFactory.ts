// Device Factory - Factory pattern for creating device instances
// Implements OOP: Encapsulation, Polymorphism

import { Device } from './Device';
import { HostDevice } from './HostDevice';
import { SwitchDevice } from './SwitchDevice';
import { RouterDevice } from './RouterDevice';
import { FirewallDevice } from './FirewallDevice';
import { CloudDevice } from './CloudDevice';
import type { DeviceType } from './Device';
import type { NodeConfig } from '../store/useTopologyStore';
import { generateMac, generateDefaultIp } from '../lib/validators';

// TYPES & INTERFACES
interface DeviceCreationParams {
    id: string;
    label: string;
    type: DeviceType;
    config?: NodeConfig;
    nodeIndex?: number;
}

// COMPONENT DEFINITION - Device Factory Class
export class DeviceFactory {
    /**
     * Create a device instance based on type
     * Uses factory pattern for polymorphic device creation
     */
    static createDevice(params: DeviceCreationParams): Device {
        const { id, label, type, config, nodeIndex = 0 } = params;

        // If config provided, use it; otherwise create default
        const deviceConfig = config || DeviceFactory.getDefaultConfig(type, nodeIndex);

        // Create appropriate device instance based on type
        switch (type) {
            case 'host':
            case 'phone':
            case 'server':
            case 'laptop':
                return new HostDevice(id, label, type, deviceConfig as any);

            case 'switch':
                return new SwitchDevice(id, label, deviceConfig as any);

            case 'router':
                return new RouterDevice(id, label, deviceConfig as any);

            case 'firewall':
                return new FirewallDevice(id, label, deviceConfig as any);

            case 'cloud':
                return new CloudDevice(id, label, deviceConfig as any);

            default:
                // Fallback to host for unknown types
                return new HostDevice(id, label, 'host', deviceConfig as any);
        }
    }

    /**
     * Get default configuration for a device type
     */
    static getDefaultConfig(type: DeviceType, nodeIndex: number): NodeConfig {
        const baseInterface = {
            id: 'eth0',
            mac: generateMac(),
        };

        switch (type) {
            case 'host':
            case 'phone':
            case 'server':
            case 'laptop':
                return {
                    interfaces: [{
                        ...baseInterface,
                        ip: generateDefaultIp(nodeIndex),
                    }],
                };

            case 'switch':
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

            case 'router':
                return {
                    interfaces: [{
                        ...baseInterface,
                        ip: generateDefaultIp(nodeIndex),
                    }],
                    staticRoutes: [],
                };

            case 'firewall':
                return {
                    interfaces: [{
                        ...baseInterface,
                        ip: generateDefaultIp(nodeIndex),
                    }],
                    aclRules: [],
                    defaultPolicy: 'deny',
                };

            case 'cloud':
                return {
                    interfaces: [{
                        ...baseInterface,
                        ip: generateDefaultIp(nodeIndex),
                    }],
                };

            default:
                return {
                    interfaces: [baseInterface],
                };
        }
    }

    /**
     * Create device from SimNode (for simulator compatibility)
     */
    static createFromSimNode(simNode: {
        id: string;
        type: DeviceType;
        label: string;
        interfaces: any[];
        [key: string]: any;
    }): Device {
        // Convert SimNode to appropriate config format
        let config: NodeConfig;

        switch (simNode.type) {
            case 'switch':
                config = {
                    interfaces: simNode.interfaces,
                    vlanDatabase: simNode.vlanDatabase || [1],
                    macLearning: simNode.macLearning ?? true,
                };
                break;

            case 'router':
                config = {
                    interfaces: simNode.interfaces,
                    staticRoutes: simNode.staticRoutes || [],
                };
                break;

            case 'firewall':
                config = {
                    interfaces: simNode.interfaces,
                    aclRules: simNode.aclRules || [],
                    defaultPolicy: simNode.defaultPolicy || 'deny',
                };
                break;

            case 'cloud':
                config = {
                    interfaces: simNode.interfaces,
                };
                break;

            default:
                config = {
                    interfaces: simNode.interfaces,
                };
        }

        return this.createDevice({
            id: simNode.id,
            label: simNode.label,
            type: simNode.type,
            config,
        });
    }
}
