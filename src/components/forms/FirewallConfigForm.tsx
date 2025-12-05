import React from 'react';
import { useTopologyStore, type InterfaceConfig, type AclRule, type FirewallConfig } from '../../store/useTopologyStore';
import { isValidMac, isValidCidr, generateMac } from '../../lib/validators';
import { v4 as uuidv4 } from 'uuid';

interface FirewallConfigFormProps {
    nodeId: string;
    config: FirewallConfig;
}

export const FirewallConfigForm: React.FC<FirewallConfigFormProps> = ({ nodeId, config }) => {
    const { updateNodeConfig } = useTopologyStore();

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

    const updateRule = (index: number, field: keyof AclRule, value: any) => {
        const newRules = [...config.aclRules];
        newRules[index] = { ...newRules[index], [field]: value };
        updateNodeConfig(nodeId, { ...config, aclRules: newRules });
    };

    const addRule = () => {
        const newRule: AclRule = {
            id: uuidv4(),
            order: config.aclRules.length + 1,
            action: 'allow',
            proto: 'any',
        };
        updateNodeConfig(nodeId, {
            ...config,
            aclRules: [...config.aclRules, newRule]
        });
    };

    const removeRule = (index: number) => {
        const newRules = config.aclRules.filter((_, i) => i !== index);
        updateNodeConfig(nodeId, { ...config, aclRules: newRules });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Default Policy */}
            <div className="flex items-center justify-between">
                <span className="text-tech text-xs">DEFAULT_POLICY</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => updateNodeConfig(nodeId, { ...config, defaultPolicy: 'allow' })}
                        className={`btn-blueprint text-xs px-2 py-1 ${config.defaultPolicy === 'allow' ? 'bg-green-600 text-white border-green-600' : ''}`}
                    >
                        ALLOW
                    </button>
                    <button
                        onClick={() => updateNodeConfig(nodeId, { ...config, defaultPolicy: 'deny' })}
                        className={`btn-blueprint text-xs px-2 py-1 ${config.defaultPolicy === 'deny' ? 'bg-red-600 text-white border-red-600' : ''}`}
                    >
                        DENY
                    </button>
                </div>
            </div>

            {/* Interfaces */}
            <div className="flex items-center justify-between">
                <h3 className="text-tech text-xs">INTERFACES</h3>
                <button onClick={addInterface} className="btn-blueprint text-xs px-2 py-1">+ ADD</button>
            </div>

            {config.interfaces.map((iface, index) => (
                <div key={iface.id} className="card-blueprint p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-tech text-xs">{iface.id.toUpperCase()}</span>
                        {config.interfaces.length > 1 && (
                            <button
                                onClick={() => removeInterface(index)}
                                className="text-red-500 text-xs hover:underline"
                            >
                                REMOVE
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">IP_ADDRESS_CIDR</label>
                        <input
                            type="text"
                            value={iface.ip || ''}
                            onChange={(e) => updateInterface(index, 'ip', e.target.value)}
                            className={`input-blueprint ${iface.ip && !isValidCidr(iface.ip) ? 'border-red-500' : ''}`}
                        />
                    </div>
                </div>
            ))}

            {/* ACL Rules */}
            <div className="flex items-center justify-between mt-4">
                <h3 className="text-tech text-xs">ACL_RULES</h3>
                <button onClick={addRule} className="btn-blueprint text-xs px-2 py-1">+ ADD</button>
            </div>

            {config.aclRules.length === 0 && (
                <div className="text-tech text-xs opacity-50 text-center py-2">NO_RULES_CONFIGURED</div>
            )}

            {config.aclRules.map((rule, index) => (
                <div key={rule.id} className="card-blueprint p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-tech text-xs">RULE_{rule.order}</span>
                        <button
                            onClick={() => removeRule(index)}
                            className="text-red-500 text-xs hover:underline"
                        >
                            REMOVE
                        </button>
                    </div>

                    {/* Action */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateRule(index, 'action', 'allow')}
                            className={`btn-blueprint text-xs px-2 py-1 flex-1 ${rule.action === 'allow' ? 'bg-green-600 text-white border-green-600' : ''}`}
                        >
                            ALLOW
                        </button>
                        <button
                            onClick={() => updateRule(index, 'action', 'deny')}
                            className={`btn-blueprint text-xs px-2 py-1 flex-1 ${rule.action === 'deny' ? 'bg-red-600 text-white border-red-600' : ''}`}
                        >
                            DENY
                        </button>
                    </div>

                    {/* Protocol */}
                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">PROTOCOL</label>
                        <select
                            value={rule.proto || 'any'}
                            onChange={(e) => updateRule(index, 'proto', e.target.value)}
                            className="input-blueprint"
                        >
                            <option value="any">ANY</option>
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                            <option value="icmp">ICMP</option>
                        </select>
                    </div>

                    {/* Source IP */}
                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">SRC_IP (optional)</label>
                        <input
                            type="text"
                            value={rule.srcIp || ''}
                            onChange={(e) => updateRule(index, 'srcIp', e.target.value)}
                            className="input-blueprint"
                            placeholder="any or 192.168.1.0/24"
                        />
                    </div>

                    {/* Destination IP */}
                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">DST_IP (optional)</label>
                        <input
                            type="text"
                            value={rule.dstIp || ''}
                            onChange={(e) => updateRule(index, 'dstIp', e.target.value)}
                            className="input-blueprint"
                            placeholder="any or 10.0.0.0/8"
                        />
                    </div>

                    {/* Ports (for TCP/UDP) */}
                    {(rule.proto === 'tcp' || rule.proto === 'udp') && (
                        <div className="flex gap-2">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-tech text-xs opacity-70">SRC_PORT</label>
                                <input
                                    type="number"
                                    value={rule.srcPort || ''}
                                    onChange={(e) => updateRule(index, 'srcPort', parseInt(e.target.value) || undefined)}
                                    className="input-blueprint"
                                    placeholder="any"
                                />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-tech text-xs opacity-70">DST_PORT</label>
                                <input
                                    type="number"
                                    value={rule.dstPort || ''}
                                    onChange={(e) => updateRule(index, 'dstPort', parseInt(e.target.value) || undefined)}
                                    className="input-blueprint"
                                    placeholder="any"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
