// Command Palette - Cmd+K to open, type commands to control the app

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTopologyStore } from '../store/useTopologyStore';
import { useReactFlow } from '@xyflow/react';
import { saveTopology, loadTopology } from '../lib/storage';
import {
    Search,
    Plus,
    Trash2,
    Settings,
    Play,
    Square,
    Link,
    Maximize,
    ZoomIn,
    ZoomOut,
    Grid3X3,
    HelpCircle,
    X,
    Command as CommandIcon,
    Save,
    FolderOpen,
    Download,
    Upload,
} from 'lucide-react';

interface Command {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'nodes' | 'simulation' | 'view' | 'edit' | 'help' | 'topology';
    keywords?: string[];
    shortcut?: string;
}

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const reactFlow = useReactFlow();

    const {
        nodes,
        edges,
        addNode,
        clearTopology,
        setTopology,
        isAnimating,
        simulationTrace,
        selectedNodeId,
        stopAnimation,
        startAnimation,
        onConnect,
        onNodesChange,
        setSelectedNodeId
    } = useTopologyStore();

    // Handle file import
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = (e) => {
                if (e.target?.result) {
                    const parsed = JSON.parse(e.target.result as string);
                    setTopology(parsed.nodes, parsed.edges);
                    setIsOpen(false);
                }
            };
        }
    };

    // Generate commands dynamically
    const generateCommands = useCallback((): Command[] => {
        const commands: Command[] = [];

        // ═══════════════════════════════════════
        // TOPOLOGY MANAGEMENT
        // ═══════════════════════════════════════
        commands.push(
            {
                id: 'save',
                label: 'Save Topology',
                description: 'Save current topology to local storage',
                icon: <Save size={14} />,
                keywords: ['save', 'store', 'persist'],
                category: 'topology',
                shortcut: '⌘S',
                action: async () => {
                    await saveTopology('current-topology', { nodes, edges });
                    setIsOpen(false);
                },
            },
            {
                id: 'load',
                label: 'Load Topology',
                description: 'Load topology from local storage',
                icon: <FolderOpen size={14} />,
                keywords: ['open', 'restore', 'load'],
                category: 'topology',
                shortcut: '⌘O',
                action: async () => {
                    const topology = await loadTopology('current-topology');
                    if (topology) {
                        setTopology(topology.nodes, topology.edges);
                    }
                    setIsOpen(false);
                },
            },
            {
                id: 'export',
                label: 'Export JSON',
                description: 'Download topology as JSON file',
                icon: <Download size={14} />,
                keywords: ['download', 'export', 'file', 'json'],
                category: 'topology',
                action: () => {
                    const topology = { nodes, edges };
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(topology, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "topology.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                    setIsOpen(false);
                },
            },
            {
                id: 'import',
                label: 'Import JSON',
                description: 'Load topology from JSON file',
                icon: <Upload size={14} />,
                keywords: ['upload', 'import', 'file', 'json'],
                category: 'topology',
                action: () => {
                    fileInputRef.current?.click();
                },
            },
            {
                id: 'clear',
                label: 'Clear Topology',
                description: 'Remove all nodes and connections',
                icon: <Trash2 size={14} />,
                keywords: ['delete', 'reset', 'remove', 'clear'],
                category: 'topology',
                action: () => {
                    clearTopology();
                    setIsOpen(false);
                },
            }
        );

        // ═══════════════════════════════════════
        // ADD NODES
        // ═══════════════════════════════════════
        commands.push(
            {
                id: 'add-host',
                label: 'Add Host',
                description: 'Add a new host/PC node',
                icon: <Plus size={14} />,
                keywords: ['create', 'new', 'pc', 'computer', 'endpoint'],
                category: 'nodes',
                action: () => {
                    const pos = { x: 150 + (nodes.length % 5) * 180, y: 150 + Math.floor(nodes.length / 5) * 150 };
                    addNode('host', pos);
                    setIsOpen(false);
                },
            },
            {
                id: 'add-switch',
                label: 'Add Switch',
                description: 'Add a new L2 switch node',
                icon: <Plus size={14} />,
                keywords: ['create', 'new', 'l2', 'layer2'],
                category: 'nodes',
                action: () => {
                    const pos = { x: 150 + (nodes.length % 5) * 180, y: 150 + Math.floor(nodes.length / 5) * 150 };
                    addNode('switch', pos);
                    setIsOpen(false);
                },
            },
            {
                id: 'add-router',
                label: 'Add Router',
                description: 'Add a new L3 router node',
                icon: <Plus size={14} />,
                keywords: ['create', 'new', 'l3', 'layer3', 'gateway'],
                category: 'nodes',
                action: () => {
                    const pos = { x: 150 + (nodes.length % 5) * 180, y: 150 + Math.floor(nodes.length / 5) * 150 };
                    addNode('router', pos);
                    setIsOpen(false);
                },
            },
            {
                id: 'add-firewall',
                label: 'Add Firewall',
                description: 'Add a new firewall node with ACL',
                icon: <Plus size={14} />,
                keywords: ['create', 'new', 'security', 'acl', 'filter'],
                category: 'nodes',
                action: () => {
                    const pos = { x: 150 + (nodes.length % 5) * 180, y: 150 + Math.floor(nodes.length / 5) * 150 };
                    addNode('firewall', pos);
                    setIsOpen(false);
                },
            }
        );

        // ═══════════════════════════════════════
        // VIEW CONTROLS
        // ═══════════════════════════════════════
        commands.push(
            {
                id: 'fit-view',
                label: 'Fit View',
                description: 'Zoom to fit all nodes in view',
                icon: <Maximize size={14} />,
                keywords: ['zoom', 'fit', 'center', 'view all'],
                category: 'view',
                action: () => {
                    reactFlow.fitView({ padding: 0.2, duration: 300 });
                    setIsOpen(false);
                },
            },
            {
                id: 'zoom-in',
                label: 'Zoom In',
                description: 'Increase zoom level',
                icon: <ZoomIn size={14} />,
                keywords: ['zoom', 'magnify', 'enlarge'],
                category: 'view',
                shortcut: '⌘+',
                action: () => {
                    reactFlow.zoomIn({ duration: 200 });
                    setIsOpen(false);
                },
            },
            {
                id: 'zoom-out',
                label: 'Zoom Out',
                description: 'Decrease zoom level',
                icon: <ZoomOut size={14} />,
                keywords: ['zoom', 'shrink', 'reduce'],
                category: 'view',
                shortcut: '⌘-',
                action: () => {
                    reactFlow.zoomOut({ duration: 200 });
                    setIsOpen(false);
                },
            },
            {
                id: 'zoom-reset',
                label: 'Reset Zoom',
                description: 'Reset zoom to 100%',
                icon: <Grid3X3 size={14} />,
                keywords: ['zoom', 'reset', '100%', 'default'],
                category: 'view',
                shortcut: '⌘0',
                action: () => {
                    reactFlow.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
                    setIsOpen(false);
                },
            }
        );

        // ═══════════════════════════════════════
        // SIMULATION
        // ═══════════════════════════════════════
        if (isAnimating) {
            commands.push({
                id: 'stop-simulation',
                label: 'STOP_ANIMATION',
                description: 'Stop the current packet flow',
                icon: <Square size={16} />,
                action: () => stopAnimation(),
                category: 'simulation',
                shortcut: 'Esc',
            });
        } else if (simulationTrace.length > 0) {
            commands.push({
                id: 'replay-simulation',
                label: 'REPLAY_SIMULATION',
                description: 'Replay the last packet flow',
                icon: <Play size={16} />,
                action: () => startAnimation(),
                category: 'simulation',
            });
        }

        // ═══════════════════════════════════════
        // CONNECT NODES
        // ═══════════════════════════════════════
        if (nodes.length < 10) {
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const source = nodes[i];
                    const target = nodes[j];

                    const isConnected = edges.some(e =>
                        (e.source === source.id && e.target === target.id) ||
                        (e.source === target.id && e.target === source.id)
                    );

                    if (!isConnected) {
                        commands.push({
                            id: `connect-${source.id}-${target.id}`,
                            label: `CONNECT ${source.data.label} → ${target.data.label}`,
                            description: 'Create a connection (Right to Left)',
                            icon: <Link size={16} />,
                            category: 'nodes',
                            action: () => {
                                onConnect({
                                    source: source.id,
                                    target: target.id,
                                    sourceHandle: 'r-source',
                                    targetHandle: 'l-target',
                                });
                                setIsOpen(false);
                            },
                        });
                    }
                }
            }
        }

        // ═══════════════════════════════════════
        // CONFIGURE NODES
        // ═══════════════════════════════════════
        nodes.forEach(node => {
            commands.push({
                id: `configure-${node.id}`,
                label: `CONFIGURE ${node.data.label}`,
                description: `Open settings for ${node.data.type}`,
                icon: <Settings size={16} />,
                category: 'nodes',
                action: () => {
                    setSelectedNodeId(node.id);
                    setIsOpen(false);
                },
            });
        });

        // ═══════════════════════════════════════
        // EDIT - Delete selected node
        // ═══════════════════════════════════════
        if (selectedNodeId) {
            commands.push({
                id: 'delete-selected',
                label: 'DELETE_SELECTED',
                description: 'Remove the currently selected node',
                icon: <Trash2 size={16} />,
                category: 'edit',
                shortcut: '⌫',
                action: () => {
                    onNodesChange([{ type: 'remove', id: selectedNodeId }]);
                    setSelectedNodeId(null);
                    setIsOpen(false);
                },
            });

            commands.push({
                id: 'deselect',
                label: 'DESELECT',
                description: 'Clear current selection',
                icon: <X size={16} />,
                category: 'edit',
                shortcut: 'Esc',
                action: () => {
                    setSelectedNodeId(null);
                    setIsOpen(false);
                },
            });
        }

        // ═══════════════════════════════════════
        // HELP
        // ═══════════════════════════════════════
        commands.push({
            id: 'show-shortcuts',
            label: 'KEYBOARD_SHORTCUTS',
            description: 'View all keyboard shortcuts',
            icon: <HelpCircle size={16} />,
            category: 'help',
            shortcut: '?',
            action: () => {
                setShowShortcuts(true);
                setIsOpen(false);
            },
        });

        return commands;
    }, [nodes, edges, addNode, clearTopology, setTopology, reactFlow, isAnimating, simulationTrace, selectedNodeId, stopAnimation, startAnimation, onConnect, onNodesChange, setSelectedNodeId]);

    const commands = generateCommands();

    // Filter commands based on query
    const filteredCommands = commands.filter(cmd => {
        const q = query.toLowerCase();
        return cmd.label.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.keywords?.some(k => k.includes(q));
    });

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setQuery('');
                setSelectedIndex(0);
            }
            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Handle input keyboard navigation
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
            setSelectedIndex(newIndex);
            // Scroll selected item into view
            setTimeout(() => {
                const list = listRef.current;
                if (list && list.children[newIndex]) {
                    list.children[newIndex].scrollIntoView({
                        block: 'nearest',
                        behavior: 'smooth'
                    });
                }
            }, 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = Math.max(selectedIndex - 1, 0);
            setSelectedIndex(newIndex);
            // Scroll selected item into view
            setTimeout(() => {
                const list = listRef.current;
                if (list && list.children[newIndex]) {
                    list.children[newIndex].scrollIntoView({
                        block: 'nearest',
                        behavior: 'smooth'
                    });
                }
            }, 0);
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
            e.preventDefault();
            filteredCommands[selectedIndex].action();
            setIsOpen(false);
            setQuery('');
        }
    };

    // Render keyboard shortcuts modal
    if (showShortcuts) {
        const shortcuts = [
            { key: '⌘K', action: 'OPEN_COMMAND_PALETTE' },
            { key: '⌘S', action: 'SAVE_TOPOLOGY' },
            { key: '⌘O', action: 'LOAD_TOPOLOGY' },
            { key: '⌘+', action: 'ZOOM_IN' },
            { key: '⌘-', action: 'ZOOM_OUT' },
            { key: '⌘0', action: 'RESET_ZOOM' },
            { key: '⌫', action: 'DELETE_SELECTED' },
            { key: 'SPACE', action: 'NEXT_HOP' },
            { key: 'ESC', action: 'CLOSE_MODAL' },
        ];

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setShowShortcuts(false)}
            >
                <div
                    className="w-full max-w-md"
                    style={{
                        backgroundColor: 'var(--c-canvas)',
                        border: '2px solid var(--c-blueprint)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--c-blueprint)' }}
                    >
                        <div className="flex items-center gap-2">
                            <CommandIcon size={16} style={{ color: 'var(--c-blueprint)' }} />
                            <span
                                className="text-sm uppercase"
                                style={{
                                    fontFamily: 'var(--f-tech)',
                                    color: 'var(--c-blueprint)',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                KEYBOARD_SHORTCUTS
                            </span>
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="p-1 hover:opacity-70"
                            style={{ color: 'var(--c-blueprint)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Shortcuts List */}
                    <div className="p-4">
                        {shortcuts.map(({ key, action }) => (
                            <div
                                key={key}
                                className="flex items-center justify-between py-2"
                                style={{ borderBottom: '1px solid var(--c-grid)' }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'var(--f-tech)',
                                        fontSize: '12px',
                                        color: 'var(--c-ink)',
                                    }}
                                >
                                    {action}
                                </span>
                                <span
                                    className="px-2 py-1"
                                    style={{
                                        fontFamily: 'var(--f-tech)',
                                        fontSize: '11px',
                                        backgroundColor: 'var(--c-grid)',
                                        color: 'var(--c-blueprint)',
                                        border: '1px solid var(--c-blueprint)',
                                    }}
                                >
                                    {key}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div
                        className="px-4 py-2 text-center"
                        style={{
                            borderTop: '1px solid var(--c-blueprint)',
                            fontFamily: 'var(--f-tech)',
                            fontSize: '10px',
                            color: 'var(--c-blueprint)',
                            opacity: 0.6,
                        }}
                    >
                        PRESS ESC TO CLOSE
                    </div>
                </div>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Hidden file input for import */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleImport}
            />

            <div
                className="fixed inset-0 z-50 flex items-start justify-center pt-20"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setIsOpen(false)}
            >
                <div
                    className="w-full max-w-xl"
                    style={{
                        backgroundColor: 'var(--c-canvas)',
                        border: '2px solid var(--c-blueprint)',
                        boxShadow: '4px 4px 0 var(--c-blueprint)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid var(--c-blueprint)' }}
                    >
                        <Search size={18} style={{ color: 'var(--c-blueprint)' }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleInputKeyDown}
                            placeholder="TYPE A COMMAND..."
                            className="flex-grow bg-transparent outline-none"
                            style={{
                                fontFamily: 'var(--f-tech)',
                                fontSize: '14px',
                                color: 'var(--c-ink)',
                                letterSpacing: '0.02em',
                            }}
                        />
                        <span
                            className="px-2 py-1"
                            style={{
                                fontFamily: 'var(--f-tech)',
                                fontSize: '10px',
                                backgroundColor: 'var(--c-grid)',
                                color: 'var(--c-blueprint)',
                                border: '1px solid var(--c-blueprint)',
                            }}
                        >
                            ESC
                        </span>
                    </div>

                    {/* Command List */}
                    <div ref={listRef} className="max-h-80 overflow-y-auto">
                        {filteredCommands.length === 0 ? (
                            <div
                                className="px-4 py-8 text-center"
                                style={{
                                    fontFamily: 'var(--f-tech)',
                                    fontSize: '12px',
                                    color: 'var(--c-ink)',
                                    opacity: 0.5,
                                }}
                            >
                                NO_COMMANDS_FOUND
                            </div>
                        ) : (
                            filteredCommands.map((cmd, index) => (
                                <div
                                    key={cmd.id}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                    style={{
                                        backgroundColor: index === selectedIndex ? 'var(--c-blueprint)' : 'transparent',
                                        borderBottom: '1px solid var(--c-grid)',
                                    }}
                                    onClick={() => {
                                        cmd.action();
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <span style={{ color: index === selectedIndex ? 'var(--c-canvas)' : 'var(--c-blueprint)' }}>
                                        {cmd.icon}
                                    </span>
                                    <div className="flex-grow min-w-0">
                                        <div
                                            style={{
                                                fontFamily: 'var(--f-tech)',
                                                fontSize: '13px',
                                                color: index === selectedIndex ? 'var(--c-canvas)' : 'var(--c-ink)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.02em',
                                            }}
                                        >
                                            {cmd.label}
                                        </div>
                                        <div
                                            className="truncate"
                                            style={{
                                                fontFamily: 'var(--f-body)',
                                                fontSize: '11px',
                                                color: index === selectedIndex ? 'var(--c-canvas)' : 'var(--c-ink)',
                                                opacity: 0.7,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {cmd.description}
                                        </div>
                                    </div>
                                    {cmd.shortcut && (
                                        <span
                                            className="px-2 py-1 flex-shrink-0"
                                            style={{
                                                fontFamily: 'var(--f-tech)',
                                                fontSize: '10px',
                                                backgroundColor: index === selectedIndex ? 'rgba(255,255,255,0.2)' : 'var(--c-grid)',
                                                color: index === selectedIndex ? 'var(--c-canvas)' : 'var(--c-blueprint)',
                                                border: `1px solid ${index === selectedIndex ? 'rgba(255,255,255,0.3)' : 'var(--c-blueprint)'}`,
                                            }}
                                        >
                                            {cmd.shortcut}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="px-4 py-2 flex justify-between items-center"
                        style={{
                            borderTop: '1px solid var(--c-blueprint)',
                            backgroundColor: 'var(--c-grid)',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: 'var(--f-tech)',
                                fontSize: '10px',
                                color: 'var(--c-blueprint)',
                            }}
                        >
                            ↑↓ NAVIGATE • ENTER SELECT • ESC CLOSE
                        </span>
                        <span
                            style={{
                                fontFamily: 'var(--f-tech)',
                                fontSize: '10px',
                                color: 'var(--c-blueprint)',
                            }}
                        >
                            {filteredCommands.length} COMMANDS
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
