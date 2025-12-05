import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Monitor, Network, Router, Shield, Type } from 'lucide-react';
import { DeviceIcon } from './ui/DeviceIcon';
import cableImage from '../assets/Cable.png';
import { useTopologyStore } from '../store/useTopologyStore';

// TYPES & INTERFACES
type DeviceCategory = 'end' | 'switch' | 'router' | 'security' | 'connections';

interface DeviceType {
    type: string;
    label: string;
    iconType: 'host' | 'switch' | 'router' | 'firewall' | 'server' | 'phone' | 'laptop' | 'cloud';
    category: DeviceCategory;
}

interface CategoryInfo {
    id: DeviceCategory;
    label: string;
    icon: React.ReactNode;
}

interface CableOption {
    type: 'auto' | 'straight' | 'crossover' | 'console';
    label: string;
}

// COMPONENT DEFINITION
export const NodePalette: React.FC = () => {
    // HOOKS
    const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('end');
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const setCableType = useTopologyStore(state => state.setCableType);
    const connectionMode = useTopologyStore(state => state.connectionMode);
    const cancelConnection = useTopologyStore(state => state.cancelConnection);

    // EVENT HANDLERS
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    // CONSTANTS & DATA
    const deviceTypes: DeviceType[] = [
        { type: 'host', label: 'PC', iconType: 'host', category: 'end' },
        { type: 'laptop', label: 'Laptop', iconType: 'laptop', category: 'end' },
        { type: 'phone', label: 'Phone', iconType: 'phone', category: 'end' },
        { type: 'server', label: 'Server', iconType: 'server', category: 'end' },
        { type: 'cloud', label: 'Cloud', iconType: 'cloud', category: 'end' },
        { type: 'label', label: 'Label', iconType: 'host', category: 'end' }, // Using host icon as placeholder
        { type: 'switch', label: 'Switch', iconType: 'switch', category: 'switch' },
        { type: 'router', label: 'Router', iconType: 'router', category: 'router' },
        { type: 'firewall', label: 'Firewall', iconType: 'firewall', category: 'security' },
    ];

    const categories: CategoryInfo[] = [
        { id: 'end', label: 'END', icon: <Monitor size={24} /> },
        { id: 'switch', label: 'SWITCH', icon: <Network size={24} /> },
        { id: 'router', label: 'ROUTER', icon: <Router size={24} /> },
        { id: 'security', label: 'SECURITY', icon: <Shield size={24} /> },
        {
            id: 'connections',
            label: 'CABLE',
            icon: <img src={cableImage} alt="Cable" width={24} height={24} style={{ objectFit: 'contain', display: 'block' }} />
        },
    ];

    const cableTypes: CableOption[] = [
        { type: 'auto', label: 'AUTO' },
        { type: 'straight', label: 'STRAIGHT' },
        { type: 'crossover', label: 'CROSSOVER' },
        { type: 'console', label: 'CONSOLE' },
    ];

    // RENDER LOGIC
    const filteredDevices = deviceTypes.filter(d => d.category === selectedCategory);
    const isConnectionsCategory = selectedCategory === 'connections';

    // RENDER
    return (
        <aside
            className="flex flex-row relative transition-all duration-300 ease-in-out"
            style={{
                width: isCollapsed ? '56px' : 'auto',
                backgroundColor: 'var(--c-canvas)',
                borderRight: '1px solid var(--c-blueprint)',
            }}
        >
            {/* Vertical Category Selector (Left) - Cisco Packet Tracer style */}
            <div 
                className="flex flex-col border-r border-[var(--c-blueprint)]"
                style={{ width: isCollapsed ? '56px' : '56px' }}
            >
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedDevice(null);
                            if (cat.id !== 'connections') {
                                setCableType(null);
                                cancelConnection();
                            }
                        }}
                        className="device-category-btn"
                        style={{
                            backgroundColor: selectedCategory === cat.id ? 'var(--c-blueprint)' : 'var(--c-canvas)',
                            color: selectedCategory === cat.id ? 'var(--c-canvas)' : 'var(--c-blueprint)',
                            borderBottom: '1px solid var(--c-blueprint)',
                        }}
                        title={cat.label}
                    >
                        <div className="flex flex-col items-center justify-center gap-1 py-2">
                            {cat.icon}
                            <span className="text-tech text-[8px] uppercase">
                                {cat.label}
                            </span>
                        </div>
                    </button>
                ))}
                
                {/* Collapse/Expand Toggle Button */}
                <button
                    onClick={toggleCollapse}
                    className="device-category-btn border-t border-[var(--c-blueprint)]"
                    style={{
                        backgroundColor: 'var(--c-canvas)',
                        color: 'var(--c-blueprint)',
                        marginTop: 'auto',
                    }}
                    title={isCollapsed ? 'Expand palette' : 'Collapse palette'}
                >
                    {isCollapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <ChevronLeft size={16} />
                    )}
                </button>
            </div>

            {/* Vertical Device List (Right) */}
            {!isCollapsed && (
                <div 
                    className="flex flex-col flex-1"
                    style={{ minWidth: '200px' }}
                >
                    {/* Device List Header */}
                    <div 
                        className="px-3 py-2 border-b border-[var(--c-blueprint)]"
                        style={{
                            backgroundColor: 'var(--c-blueprint-lighter)',
                        }}
                    >
                        <span className="text-tech text-xs uppercase" style={{ color: 'var(--c-blueprint)' }}>
                            {isConnectionsCategory ? 'CONNECTIONS' : `${categories.find(c => c.id === selectedCategory)?.label} DEVICES`}
                        </span>
                    </div>

                    {/* Scrollable Device List - Vertical Flow */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
                        <div className="flex flex-col gap-2">
                            {isConnectionsCategory ? (
                                // Connection Cable Types
                                cableTypes.map(({ type, label }) => (
                                    <div
                                        key={type}
                                        className="device-item"
                                        style={{
                                            border: connectionMode.cableType === type ? '2px solid var(--c-blueprint)' : '1px solid var(--c-blueprint)',
                                            backgroundColor: connectionMode.cableType === type ? 'var(--c-blueprint-light)' : 'var(--c-canvas)',
                                            width: '100%',
                                        }}
                                        onClick={() => {
                                            setSelectedDevice(`cable-${type}`);
                                            setCableType(type);
                                        }}
                                        title={label}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1 p-2">
                                            <img
                                                src={cableImage}
                                                alt={label}
                                                width={48}
                                                height={48}
                                                style={{ objectFit: 'contain', display: 'block' }}
                                            />
                                            <span className="text-tech text-[9px] text-center uppercase font-bold" style={{ color: 'var(--c-blueprint)' }}>
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Device Types
                                filteredDevices.map(({ type, label, iconType }) => (
                                    <div
                                        key={`${type}-${label}`}
                                        className="device-item"
                                        style={{
                                            border: selectedDevice === `${type}-${label}` ? '2px solid var(--c-blueprint)' : '1px solid var(--c-blueprint)',
                                            backgroundColor: selectedDevice === `${type}-${label}` ? 'var(--c-blueprint-light)' : 'var(--c-canvas)',
                                            width: '100%',
                                        }}
                                        onClick={() => {
                                            setSelectedDevice(`${type}-${label}`);
                                            setCableType(null);
                                            cancelConnection();
                                        }}
                                        onDragStart={(event) => onDragStart(event, type)}
                                        draggable
                                        title={label}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1 p-2">
                                            {type === 'label' ? (
                                                <Type size={48} style={{ color: 'var(--c-blueprint)' }} />
                                            ) : (
                                                <DeviceIcon
                                                    type={iconType}
                                                    size={48}
                                                />
                                            )}
                                            <span className="text-tech text-[9px] text-center uppercase font-bold" style={{ color: 'var(--c-blueprint)' }}>
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};
