import React from 'react';
import { useTopologyStore, type InterfaceConfig, type SwitchConfig } from '../../store/useTopologyStore';
import { isValidMac, isValidVlanId, generateMac } from '../../lib/validators';

interface SwitchConfigFormProps {
    nodeId: string;
    config: SwitchConfig;
}

export const SwitchConfigForm: React.FC<SwitchConfigFormProps> = ({ nodeId, config }) => {
    const { updateNodeConfig } = useTopologyStore();

    const updateInterface = (index: number, field: keyof InterfaceConfig, value: any) => {
        const newInterfaces = [...config.interfaces];
        newInterfaces[index] = { ...newInterfaces[index], [field]: value };
        updateNodeConfig(nodeId, { ...config, interfaces: newInterfaces });
    };

    const addPort = () => {
        const portNum = config.interfaces.length + 1;
        const newInterface: InterfaceConfig = {
            id: `gi0/${portNum}`,
            mac: generateMac(),
            portMode: 'access',
            vlan: 1,
        };
        updateNodeConfig(nodeId, {
            ...config,
            interfaces: [...config.interfaces, newInterface]
        });
    };

    const removePort = (index: number) => {
        if (config.interfaces.length <= 1) return;
        const newInterfaces = config.interfaces.filter((_, i) => i !== index);
        updateNodeConfig(nodeId, { ...config, interfaces: newInterfaces });
    };

    const addVlan = () => {
        const nextVlan = Math.max(...config.vlanDatabase, 0) + 1;
        if (isValidVlanId(nextVlan)) {
            updateNodeConfig(nodeId, {
                ...config,
                vlanDatabase: [...config.vlanDatabase, nextVlan],
            });
        }
    };

    const removeVlan = (vlan: number) => {
        if (config.vlanDatabase.length <= 1) return;
        updateNodeConfig(nodeId, {
            ...config,
            vlanDatabase: config.vlanDatabase.filter(v => v !== vlan),
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* MAC Learning Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-tech text-xs">MAC_LEARNING</span>
                <button
                    onClick={() => updateNodeConfig(nodeId, { ...config, macLearning: !config.macLearning })}
                    className={`btn-blueprint text-xs px-2 py-1 ${config.macLearning ? 'bg-[var(--c-blueprint)] text-white' : ''}`}
                >
                    {config.macLearning ? 'ENABLED' : 'DISABLED'}
                </button>
            </div>

            {/* VLAN Database */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-tech text-xs">VLAN_DATABASE</h3>
                    <button onClick={addVlan} className="btn-blueprint text-xs px-2 py-1">+ ADD</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {config.vlanDatabase.map(vlan => (
                        <span
                            key={vlan}
                            className="card-blueprint px-2 py-1 text-xs flex items-center gap-1 cursor-pointer hover:line-through"
                            onClick={() => removeVlan(vlan)}
                        >
                            VLAN_{vlan}
                        </span>
                    ))}
                </div>
            </div>

            {/* Ports */}
            <div className="flex items-center justify-between">
                <h3 className="text-tech text-xs">PORTS</h3>
                <button onClick={addPort} className="btn-blueprint text-xs px-2 py-1">+ ADD</button>
            </div>

            {config.interfaces.map((iface, index) => (
                <div key={iface.id} className="card-blueprint p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-tech text-xs">{iface.id.toUpperCase()}</span>
                        {config.interfaces.length > 1 && (
                            <button
                                onClick={() => removePort(index)}
                                className="text-red-500 text-xs hover:underline"
                            >
                                REMOVE
                            </button>
                        )}
                    </div>

                    {/* Port Mode */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateInterface(index, 'portMode', 'access')}
                            className={`btn-blueprint text-xs px-2 py-1 flex-1 ${iface.portMode === 'access' ? 'bg-[var(--c-blueprint)] text-white' : ''}`}
                        >
                            ACCESS
                        </button>
                        <button
                            onClick={() => updateInterface(index, 'portMode', 'trunk')}
                            className={`btn-blueprint text-xs px-2 py-1 flex-1 ${iface.portMode === 'trunk' ? 'bg-[var(--c-blueprint)] text-white' : ''}`}
                        >
                            TRUNK
                        </button>
                    </div>

                    {/* VLAN (for access mode) */}
                    {iface.portMode === 'access' && (
                        <div className="flex flex-col gap-1">
                            <label className="text-tech text-xs opacity-70">ACCESS_VLAN</label>
                            <select
                                value={iface.vlan || 1}
                                onChange={(e) => updateInterface(index, 'vlan', parseInt(e.target.value))}
                                className="input-blueprint"
                            >
                                {config.vlanDatabase.map(vlan => (
                                    <option key={vlan} value={vlan}>VLAN_{vlan}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
