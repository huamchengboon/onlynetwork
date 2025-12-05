import React, { useState } from 'react';
import { useTopologyStore, type InterfaceConfig } from '../../store/useTopologyStore';
import { isValidMac, isValidCidr, generateMac } from '../../lib/validators';
import { convertTopology, Simulator } from '../../simulator/Simulator';

interface HostConfigFormProps {
    nodeId: string;
    config: {
        interfaces: InterfaceConfig[];
    };
}

export const HostConfigForm: React.FC<HostConfigFormProps> = ({ nodeId, config }) => {
    const { updateNodeConfig, nodes, edges } = useTopologyStore();
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);

    const updateInterface = (index: number, field: keyof InterfaceConfig, value: string) => {
        const newInterfaces = [...config.interfaces];
        newInterfaces[index] = { ...newInterfaces[index], [field]: value };
        updateNodeConfig(nodeId, { ...config, interfaces: newInterfaces });
    };

    const addInterface = () => {
        const newInterface: InterfaceConfig = {
            id: `eth${config.interfaces.length}`,
            mac: generateMac(),
            ip: '',
        };
        updateNodeConfig(nodeId, {
            ...config,
            interfaces: [...config.interfaces, newInterface]
        });
    };

    const removeInterface = (index: number) => {
        if (config.interfaces.length <= 1) return;
        const newInterfaces = config.interfaces.filter((_, i) => i !== index);
        updateNodeConfig(nodeId, { ...config, interfaces: newInterfaces });
    };

    // RENDER LOGIC
    // Get available target devices (other hosts, routers, cloud)
    const availableTargets = nodes.filter(n => 
        n.id !== nodeId && 
        (n.data.type === 'host' || n.data.type === 'laptop' || n.data.type === 'phone' || 
         n.data.type === 'server' || n.data.type === 'router' || n.data.type === 'cloud')
    );

    const handlePing = () => {
        if (!selectedTarget) {
            setPingResult({ success: false, message: 'Please select a target device' });
            return;
        }

        const sourceNode = nodes.find(n => n.id === nodeId);
        const targetNode = nodes.find(n => n.id === selectedTarget);

        if (!sourceNode || !targetNode) {
            setPingResult({ success: false, message: 'Source or target node not found' });
            return;
        }

        const srcIp = sourceNode.data.config.interfaces[0]?.ip?.split('/')[0];
        const dstIp = targetNode.data.config.interfaces[0]?.ip?.split('/')[0];

        if (!srcIp || !dstIp) {
            setPingResult({ success: false, message: 'Source or target IP not configured' });
            return;
        }

        try {
            const topology = convertTopology(nodes, edges);
            const simulator = new Simulator(topology);
            
            const result = simulator.simulate({
                srcNodeId: nodeId,
                dstNodeId: selectedTarget,
                srcIp,
                dstIp,
                proto: 'icmp',
            });

            if (result.success && result.delivered) {
                setPingResult({ 
                    success: true, 
                    message: `Ping successful! Packet delivered to ${targetNode.data.label}` 
                });
            } else {
                setPingResult({ 
                    success: false, 
                    message: result.reason || 'Ping failed - packet not delivered' 
                });
            }
        } catch (error) {
            setPingResult({ 
                success: false, 
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-tech text-xs" style={{ color: 'var(--c-ink)', fontWeight: 600 }}>Interfaces</h3>
                <button
                    onClick={addInterface}
                    className="btn-blueprint text-xs px-2 py-1"
                >
                    + Add
                </button>
            </div>

            {config.interfaces.map((iface, index) => (
                <div key={iface.id} className="card-blueprint p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-tech text-xs" style={{ color: 'var(--c-ink)', fontWeight: 500 }}>{iface.id}</span>
                        {config.interfaces.length > 1 && (
                            <button
                                onClick={() => removeInterface(index)}
                                className="text-red-500 text-xs hover:underline"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    {/* MAC Address */}
                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs" style={{ color: 'var(--c-muted)', fontWeight: 500 }}>MAC Address</label>
                        <input
                            type="text"
                            value={iface.mac}
                            onChange={(e) => updateInterface(index, 'mac', e.target.value)}
                            className={`input-blueprint ${!isValidMac(iface.mac) ? 'border-red-500' : ''}`}
                            placeholder="XX:XX:XX:XX:XX:XX"
                        />
                        {!isValidMac(iface.mac) && (
                            <span className="text-red-500 text-xs">Invalid MAC format</span>
                        )}
                    </div>

                    {/* IP Address */}
                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs" style={{ color: 'var(--c-muted)', fontWeight: 500 }}>IP Address (CIDR)</label>
                        <input
                            type="text"
                            value={iface.ip || ''}
                            onChange={(e) => updateInterface(index, 'ip', e.target.value)}
                            className={`input-blueprint ${iface.ip && !isValidCidr(iface.ip) ? 'border-red-500' : ''}`}
                            placeholder="192.168.1.1/24"
                        />
                        {iface.ip && !isValidCidr(iface.ip) && (
                            <span className="text-red-500 text-xs">Invalid CIDR format</span>
                        )}
                    </div>
                </div>
            ))}

            {/* Ping Test Section */}
            <div className="card-blueprint p-3 flex flex-col gap-3" style={{ marginTop: '16px' }}>
                <h3 className="text-tech text-xs" style={{ color: 'var(--c-ink)', fontWeight: 600 }}>Ping Test</h3>
                
                <div className="flex flex-col gap-2">
                    <label className="text-tech text-xs" style={{ color: 'var(--c-muted)', fontWeight: 500 }}>
                        Target Device
                    </label>
                    <select
                        value={selectedTarget}
                        onChange={(e) => {
                            setSelectedTarget(e.target.value);
                            setPingResult(null);
                        }}
                        className="input-blueprint"
                    >
                        <option value="">Select target device...</option>
                        {availableTargets.map(node => (
                            <option key={node.id} value={node.id}>
                                {node.data.label} ({node.data.type})
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handlePing}
                    className="btn-blueprint"
                    disabled={!selectedTarget}
                    style={{
                        opacity: selectedTarget ? 1 : 0.5,
                        cursor: selectedTarget ? 'pointer' : 'not-allowed',
                    }}
                >
                    Run Ping
                </button>

                {pingResult && (
                    <div
                        className="p-2 text-tech text-xs"
                        style={{
                            backgroundColor: pingResult.success 
                                ? 'rgba(34, 197, 94, 0.1)' 
                                : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${pingResult.success ? '#22c55e' : '#ef4444'}`,
                            color: pingResult.success ? '#22c55e' : '#ef4444',
                        }}
                    >
                        {pingResult.message}
                    </div>
                )}
            </div>
        </div>
    );
};
