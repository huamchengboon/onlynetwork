import React from 'react';
import { X } from 'lucide-react';
import { useTopologyStore, type HostConfig, type SwitchConfig, type RouterConfig, type FirewallConfig } from '../store/useTopologyStore';
import { HostConfigForm } from './forms/HostConfigForm';
import { SwitchConfigForm } from './forms/SwitchConfigForm';
import { RouterConfigForm } from './forms/RouterConfigForm';
import { FirewallConfigForm } from './forms/FirewallConfigForm';

export const ConfigPanel: React.FC = () => {
    const { nodes, selectedNodeId, setSelectedNodeId, updateNodeLabel } = useTopologyStore();

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    if (!selectedNode) {
        return (
            <aside
                className="w-80 p-4 flex flex-col items-center justify-center"
                style={{
                    backgroundColor: 'var(--c-canvas)',
                    borderLeft: '1px solid var(--c-blueprint)'
                }}
            >
                <div className="text-tech text-xs opacity-50 text-center">
                    SELECT_NODE_TO_CONFIGURE
                </div>
                <div className="text-vertical mt-8 opacity-30">CONFIG_PANEL</div>
            </aside>
        );
    }

    const nodeType = selectedNode.data.type;
    const nodeConfig = selectedNode.data.config;

    // Label nodes don't have config panel
    if (nodeType === 'label') {
        return null;
    }

    return (
        <aside
            className="w-80 flex flex-col overflow-hidden"
            style={{
                backgroundColor: 'var(--c-canvas)',
                borderLeft: '1px solid var(--c-blueprint)'
            }}
        >
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--c-blueprint)' }}
            >
                <h2 className="text-tech text-xs">{nodeType.toUpperCase()}_CONFIG</h2>
                <button
                    onClick={() => setSelectedNodeId(null)}
                    className="btn-blueprint p-1"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Node Label */}
                <div className="flex flex-col gap-1 mb-4">
                    <label className="text-tech text-xs opacity-70">NODE_LABEL</label>
                    <input
                        type="text"
                        value={selectedNode.data.label}
                        onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                        className="input-blueprint"
                    />
                </div>

                {/* Type-specific config forms */}
                {(nodeType === 'host' || nodeType === 'laptop' || nodeType === 'phone' || 
                  nodeType === 'server' || nodeType === 'cloud') && (
                    <HostConfigForm
                        nodeId={selectedNode.id}
                        config={nodeConfig as HostConfig}
                    />
                )}
                {nodeType === 'switch' && (
                    <SwitchConfigForm
                        nodeId={selectedNode.id}
                        config={nodeConfig as SwitchConfig}
                    />
                )}
                {nodeType === 'router' && (
                    <RouterConfigForm
                        nodeId={selectedNode.id}
                        config={nodeConfig as RouterConfig}
                    />
                )}
                {nodeType === 'firewall' && (
                    <FirewallConfigForm
                        nodeId={selectedNode.id}
                        config={nodeConfig as FirewallConfig}
                    />
                )}
            </div>

            {/* Footer */}
            <div
                className="p-2 text-center"
                style={{ borderTop: '1px solid var(--c-blueprint)' }}
            >
                <span className="text-tech text-xs opacity-30">ID: {selectedNode.id.slice(0, 8)}</span>
            </div>
        </aside>
    );
};
