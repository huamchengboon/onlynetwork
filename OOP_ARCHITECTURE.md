# OOP Architecture Documentation

## Overview

The network simulator has been refactored to use Object-Oriented Programming (OOP) principles with classes, inheritance, polymorphism, and encapsulation. Each device is now a fully functional object that manages its own state and behavior.

---

## OOP Principles Implemented

### 1. **Encapsulation**
- Device state (id, label, type, interfaces, config) is encapsulated within device classes
- Private/protected properties prevent direct access
- Public methods provide controlled access to device functionality

### 2. **Inheritance**
- Base `Device` class contains common functionality
- Specific device classes (`HostDevice`, `SwitchDevice`, `RouterDevice`, `FirewallDevice`) inherit from `Device`
- Shared behavior is defined once in the base class

### 3. **Polymorphism**
- All devices implement `processPacket()` method with different behaviors
- Simulator uses polymorphism to call the correct method for each device type
- Same interface, different implementations

### 4. **Abstraction**
- Abstract base class defines the contract (interface) for all devices
- Implementation details hidden in subclasses
- Factory pattern for device creation

---

## Class Hierarchy

```
Device (Abstract Base Class)
├── HostDevice (host, phone, server, laptop)
├── SwitchDevice (switch)
├── RouterDevice (router)
└── FirewallDevice (firewall)
```

---

## Device Classes

### Base Device Class (`Device.ts`)

**Purpose**: Abstract base class providing common functionality for all network devices.

**Key Methods**:
- `processPacket()` - Abstract method (must be implemented by subclasses)
- `getPortConfigurations()` - Abstract method (device-specific port layout)
- `getDefaultConfig()` - Abstract method (device-specific default configuration)
- `getId()`, `getLabel()`, `getType()` - Getters for device properties
- `getInterfaces()`, `getInterface()` - Interface management
- `updateConfig()` - Update device configuration
- `toSimNode()` - Convert to SimNode format for simulator

**Protected Helper Methods**:
- `isPacketForThisDevice()` - Check if packet is addressed to device
- `createTraceHop()` - Create trace entry
- `createForwardEvent()` - Create forwarding event
- `findConnectedInterface()` - Find connected interface on link

---

### HostDevice Class (`HostDevice.ts`)

**Inherits from**: `Device`

**Purpose**: Represents end devices (PC, Laptop, Phone, Server)

**Key Features**:
- Single interface (typically)
- Receives and delivers packets
- Does not forward packets (end device)
- Can send packets via `sendPacket()` method

**Port Configuration**: 1 port on right side

**Methods**:
- `processPacket()` - Receives packets, delivers if addressed to this host
- `sendPacket()` - Creates and sends a packet from this host
- `getPortConfigurations()` - Returns single port config
- `getDefaultConfig()` - Returns host configuration with one interface

---

### SwitchDevice Class (`SwitchDevice.ts`)

**Inherits from**: `Device`

**Purpose**: Represents network switches

**Key Features**:
- Multiple interfaces (ports)
- MAC address learning
- VLAN support (access/trunk ports)
- Packet flooding for unknown destinations
- Unicast forwarding to known MAC addresses

**Port Configuration**: 2 ports per side (8 total)

**Properties**:
- `macLearning` - Whether MAC learning is enabled
- `vlanDatabase` - List of VLAN IDs

**Methods**:
- `processPacket()` - Implements switch forwarding logic
  - MAC learning
  - VLAN resolution
  - Unicast forwarding or flooding
- `getPortConfigurations()` - Returns 8 port configurations
- `getDefaultConfig()` - Returns switch config with 4 interfaces
- `isMacLearningEnabled()` - Get MAC learning status
- `getVlanDatabase()` - Get VLAN database

**Protected Methods**:
- `resolveVlan()` - Determine VLAN for packet
- `learnMacAddress()` - Learn MAC on ingress port
- `forwardToKnownPort()` - Forward to specific port
- `floodPacket()` - Flood to all ports in VLAN
- `canEgressOnInterface()` - Check VLAN compatibility
- `prepareEgressPacket()` - Handle VLAN tagging/untagging

---

### RouterDevice Class (`RouterDevice.ts`)

**Inherits from**: `Device`

**Purpose**: Represents network routers

**Key Features**:
- IP forwarding
- Static routing
- TTL handling
- Directly connected network detection
- Route lookup and forwarding

**Port Configuration**: 1 port per side (4 total)

**Properties**:
- `staticRoutes` - Array of static routes

**Methods**:
- `processPacket()` - Implements router forwarding logic
  - TTL decrement
  - Directly connected network check
  - Static route lookup
  - IP forwarding
- `getPortConfigurations()` - Returns 4 port configurations
- `getDefaultConfig()` - Returns router config with static routes
- `getStaticRoutes()` - Get all static routes
- `addStaticRoute()` - Add a static route
- `removeStaticRoute()` - Remove a static route

**Protected Methods**:
- `isPacketForRouter()` - Check if packet is for router
- `findDirectRoute()` - Find directly connected network route
- `findStaticRoute()` - Find static route for destination

---

### FirewallDevice Class (`FirewallDevice.ts`)

**Inherits from**: `Device`

**Purpose**: Represents network firewalls

**Key Features**:
- ACL (Access Control List) rule matching
- Default policy (allow/deny)
- Ordered rule evaluation
- Packet filtering based on rules

**Port Configuration**: 1 port per side (4 total)

**Properties**:
- `aclRules` - Array of ACL rules
- `defaultPolicy` - Default action if no rule matches

**Methods**:
- `processPacket()` - Implements firewall filtering logic
  - ACL rule matching
  - Policy enforcement
  - Packet forwarding if allowed
- `getPortConfigurations()` - Returns 4 port configurations
- `getDefaultConfig()` - Returns firewall config with ACL rules
- `getAclRules()` - Get all ACL rules
- `addAclRule()` - Add an ACL rule
- `removeAclRule()` - Remove an ACL rule
- `getDefaultPolicy()` - Get default policy
- `setDefaultPolicy()` - Set default policy

**Protected Methods**:
- `isPacketForFirewall()` - Check if packet is for firewall
- `matchAclRules()` - Match packet against ACL rules
- `matchesRule()` - Check if packet matches a specific rule
- `forwardPacket()` - Forward packet to egress interface

---

## DeviceFactory Class

**Purpose**: Factory pattern for creating device instances

**Methods**:
- `createDevice()` - Create device instance based on type
- `getDefaultConfig()` - Get default configuration for device type
- `createFromSimNode()` - Create device from SimNode format

**Usage**:
```typescript
const device = DeviceFactory.createDevice({
    id: 'node-1',
    label: 'PC-1',
    type: 'host',
    nodeIndex: 0
});
```

---

## Simulator Integration

The `Simulator` class has been refactored to use device classes:

1. **Device Initialization**: Creates device instances for all nodes in topology
2. **Polymorphic Processing**: Calls `device.processPacket()` for each device
3. **Device Caching**: Maintains a map of device instances for performance

**Key Changes**:
- `initializeDevices()` - Creates device instances from topology
- `processAtDevice()` - Uses polymorphism to process packets
- `getDeviceInstance()` - Public API to access device objects

---

## Component Integration

### BlueprintNode Component

**OOP Integration**:
- Uses `DeviceFactory` to create device instance
- Calls `device.getPortConfigurations()` to get port layout
- Each device type knows its own port configuration

**Benefits**:
- Port configuration is encapsulated in device class
- No hardcoded port logic in component
- Easy to add new device types

### useTopologyStore

**OOP Integration**:
- Uses `DeviceFactory.getDefaultConfig()` for creating default configurations
- Centralized configuration logic in device classes

---

## Benefits of OOP Architecture

1. **Maintainability**: Each device type is self-contained
2. **Extensibility**: Easy to add new device types by extending `Device`
3. **Testability**: Each device class can be tested independently
4. **Code Reuse**: Common functionality in base class
5. **Type Safety**: TypeScript ensures correct usage
6. **Encapsulation**: Device state and behavior are encapsulated
7. **Polymorphism**: Simulator doesn't need to know device-specific logic

---

## Adding New Device Types

To add a new device type:

1. **Create Device Class**:
```typescript
export class NewDevice extends Device {
    processPacket(...): DeviceProcessResult {
        // Implement packet processing
    }
    
    getPortConfigurations(): DevicePortConfig[] {
        // Define port layout
    }
    
    getDefaultConfig(nodeIndex: number): NodeConfig {
        // Return default configuration
    }
}
```

2. **Update DeviceFactory**:
```typescript
case 'newdevice':
    return new NewDevice(id, label, deviceConfig);
```

3. **Update Type Definitions**:
- Add to `DeviceType` union
- Add to `NodeData['type']`
- Add to `SimNode['type']`

---

## File Structure

```
src/devices/
├── Device.ts              # Abstract base class
├── HostDevice.ts          # Host/Phone/Server/Laptop
├── SwitchDevice.ts        # Switch
├── RouterDevice.ts        # Router
├── FirewallDevice.ts      # Firewall
├── DeviceFactory.ts       # Factory for device creation
└── index.ts               # Exports
```

---

## Example Usage

```typescript
// Create a device
const device = DeviceFactory.createDevice({
    id: 'router-1',
    label: 'Router-A',
    type: 'router',
    nodeIndex: 0
});

// Process a packet
const result = device.processPacket(
    'eth0',
    packet,
    links,
    time
);

// Access device properties
const interfaces = device.getInterfaces();
const config = device.getConfig();

// Update configuration
device.updateConfig(newConfig);

// Get port configurations for UI
const ports = device.getPortConfigurations();
```

---

## Design Patterns Used

1. **Factory Pattern**: `DeviceFactory` creates device instances
2. **Template Method Pattern**: Base class defines structure, subclasses implement
3. **Strategy Pattern**: Different packet processing strategies per device type
4. **Polymorphism**: Same interface, different implementations

---

## Future Enhancements

- Add more device types (Access Point, Load Balancer, etc.)
- Add device capabilities interface
- Add device state management
- Add device event system
- Add device configuration validation
- Add device-to-device communication protocols
