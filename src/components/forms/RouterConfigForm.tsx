import React from 'react';
import { useTopologyStore, type InterfaceConfig, type StaticRoute, type RouterConfig } from '../../store/useTopologyStore';
import { isValidMac, isValidCidr, generateMac } from '../../lib/validators';
import { v4 as uuidv4 } from 'uuid';

interface RouterConfigFormProps {
    nodeId: string;
    config: RouterConfig;
}

export const RouterConfigForm: React.FC<RouterConfigFormProps> = ({ nodeId, config }) => {
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

    const updateRoute = (index: number, field: keyof StaticRoute, value: string) => {
        const newRoutes = [...config.staticRoutes];
        newRoutes[index] = { ...newRoutes[index], [field]: value };
        updateNodeConfig(nodeId, { ...config, staticRoutes: newRoutes });
    };

    const addRoute = () => {
        const newRoute: StaticRoute = {
            prefix: '0.0.0.0/0',
            nextHop: '',
            outInterface: config.interfaces[0]?.id || 'eth0',
        };
        updateNodeConfig(nodeId, {
            ...config,
            staticRoutes: [...config.staticRoutes, newRoute]
        });
    };

    const removeRoute = (index: number) => {
        const newRoutes = config.staticRoutes.filter((_, i) => i !== index);
        updateNodeConfig(nodeId, { ...config, staticRoutes: newRoutes });
    };

    return (
        <div className="flex flex-col gap-4">
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
                        <label className="text-tech text-xs opacity-70">MAC_ADDRESS</label>
                        <input
                            type="text"
                            value={iface.mac}
                            onChange={(e) => updateInterface(index, 'mac', e.target.value)}
                            className={`input-blueprint ${!isValidMac(iface.mac) ? 'border-red-500' : ''}`}
                        />
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

            {/* Static Routes */}
            <div className="flex items-center justify-between mt-4">
                <h3 className="text-tech text-xs">STATIC_ROUTES</h3>
                <button onClick={addRoute} className="btn-blueprint text-xs px-2 py-1">+ ADD</button>
            </div>

            {config.staticRoutes.length === 0 && (
                <div className="text-tech text-xs opacity-50 text-center py-2">NO_ROUTES_CONFIGURED</div>
            )}

            {config.staticRoutes.map((route, index) => (
                <div key={index} className="card-blueprint p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-tech text-xs">ROUTE_{index + 1}</span>
                        <button
                            onClick={() => removeRoute(index)}
                            className="text-red-500 text-xs hover:underline"
                        >
                            REMOVE
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">DESTINATION_PREFIX</label>
                        <input
                            type="text"
                            value={route.prefix}
                            onChange={(e) => updateRoute(index, 'prefix', e.target.value)}
                            className="input-blueprint"
                            placeholder="0.0.0.0/0"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">NEXT_HOP</label>
                        <input
                            type="text"
                            value={route.nextHop}
                            onChange={(e) => updateRoute(index, 'nextHop', e.target.value)}
                            className="input-blueprint"
                            placeholder="192.168.1.1"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-tech text-xs opacity-70">OUT_INTERFACE</label>
                        <select
                            value={route.outInterface}
                            onChange={(e) => updateRoute(index, 'outInterface', e.target.value)}
                            className="input-blueprint"
                        >
                            {config.interfaces.map(iface => (
                                <option key={iface.id} value={iface.id}>{iface.id.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
};
