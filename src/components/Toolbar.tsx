import React, { useState } from 'react';
import { 
    Save, FolderOpen, Download, Upload, 
    MousePointer2, Move, X, 
    ZoomIn, ZoomOut, Maximize, Grid3X3,
    FileText, Settings
} from 'lucide-react';
import { useTopologyStore } from '../store/useTopologyStore';
import { saveTopology, loadTopology } from '../lib/storage';
import { Modal, useModal } from './Modal';


export const Toolbar: React.FC = () => {
    const { nodes, edges, setTopology, clearTopology, selectedNodeId, setSelectedNodeId, toolMode, setToolMode, snapToGrid, setSnapToGrid } = useTopologyStore();
    const { isOpen, content, showModal, closeModal } = useModal();
    const [showGrid, setShowGrid] = useState(true);
    
    // Zoom functions will be passed from NetworkCanvas via context or store
    const handleZoomIn = () => {
        // Will be implemented via store or context
        window.dispatchEvent(new CustomEvent('zoom-in'));
    };
    const handleZoomOut = () => {
        window.dispatchEvent(new CustomEvent('zoom-out'));
    };
    const handleFitView = () => {
        window.dispatchEvent(new CustomEvent('fit-view'));
    };

    const handleSave = async () => {
        const topology = { nodes, edges };
        await saveTopology('current-topology', topology);
        showModal('Topology saved to local storage!', 'Saved');
    };

    const handleLoad = async () => {
        const topology = await loadTopology('current-topology');
        if (topology) {
            setTopology(topology.nodes, topology.edges);
            showModal('Topology loaded from local storage!', 'Loaded');
        } else {
            showModal('No saved topology found.', 'Error');
        }
    };

    const handleExport = () => {
        const topology = { nodes, edges };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(topology));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "topology.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = (e) => {
                if (e.target?.result) {
                    const parsed = JSON.parse(e.target.result as string);
                    setTopology(parsed.nodes, parsed.edges);
                }
            };
        }
    };

    const handleDelete = () => {
        if (selectedNodeId) {
            const newNodes = nodes.filter(n => n.id !== selectedNodeId);
            const newEdges = edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);
            setTopology(newNodes, newEdges);
            setSelectedNodeId(null);
        }
    };

    // RENDER LOGIC
    const isActive = (mode: string) => toolMode === mode;

    // RENDER
    return (
        <>
            {/* Main Toolbar - Cisco Packet Tracer style */}
            <header 
                className="h-10 flex items-center px-1 gap-0"
                style={{
                    backgroundColor: 'var(--c-canvas)',
                    borderBottom: '1px solid var(--c-blueprint)'
                }}
            >
                {/* File Operations */}
                <div className="flex items-center gap-0">
                    <button 
                        className="toolbar-btn"
                        title="New"
                        onClick={clearTopology}
                    >
                        <FileText size={16} />
                    </button>
                    <button 
                        className="toolbar-btn"
                        title="Open"
                        onClick={handleLoad}
                    >
                        <FolderOpen size={16} />
                    </button>
                    <button 
                        className="toolbar-btn"
                        title="Save"
                        onClick={handleSave}
                    >
                        <Save size={16} />
                    </button>
                </div>

                {/* Separator */}
                <div className="h-6 w-px mx-1" style={{ backgroundColor: 'var(--c-blueprint)', opacity: 0.3 }}></div>

                {/* Edit Tools */}
                <div className="flex items-center gap-0">
                    <button
                        className={`toolbar-btn ${isActive('select') ? 'active' : ''}`}
                        title="Select Tool"
                        onClick={() => setToolMode('select')}
                    >
                        <MousePointer2 size={16} />
                    </button>
                    <button
                        className={`toolbar-btn ${isActive('move') ? 'active' : ''}`}
                        title="Move Tool"
                        onClick={() => setToolMode('move')}
                    >
                        <Move size={16} />
                    </button>
                    <button
                        className={`toolbar-btn ${isActive('delete') ? 'active' : ''}`}
                        title="Delete Tool"
                        onClick={() => {
                            setToolMode('delete');
                            if (selectedNodeId) {
                                handleDelete();
                            }
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Separator */}
                <div className="h-6 w-px mx-1" style={{ backgroundColor: 'var(--c-blueprint)', opacity: 0.3 }}></div>

                {/* View Tools */}
                <div className="flex items-center gap-0">
                    <button
                        className="toolbar-btn"
                        title="Zoom In"
                        onClick={handleZoomIn}
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        className="toolbar-btn"
                        title="Zoom Out"
                        onClick={handleZoomOut}
                    >
                        <ZoomOut size={16} />
                    </button>
                    <button
                        className="toolbar-btn"
                        title="Fit View"
                        onClick={handleFitView}
                    >
                        <Maximize size={16} />
                    </button>
                    <button
                        className={`toolbar-btn ${showGrid ? 'active' : ''}`}
                        title="Toggle Grid"
                        onClick={() => setShowGrid(!showGrid)}
                    >
                        <Grid3X3 size={16} />
                    </button>
                    <button
                        className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
                        title="Snap to Grid"
                        onClick={() => setSnapToGrid(!snapToGrid)}
                    >
                        <Grid3X3 size={16} style={{ opacity: snapToGrid ? 1 : 0.5 }} />
                    </button>
                </div>

                <div className="flex-grow"></div>

                {/* Right side actions */}
                <div className="flex items-center gap-0">
                    <label className="toolbar-btn cursor-pointer" title="Import">
                        <Upload size={16} />
                        <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </label>
                    <button
                        className="toolbar-btn"
                        title="Export"
                        onClick={handleExport}
                    >
                        <Download size={16} />
                    </button>
                    <button
                        className="toolbar-btn"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </header>

            <Modal isOpen={isOpen} onClose={closeModal} title={content.title}>
                {content.message}
            </Modal>
        </>
    );
};
