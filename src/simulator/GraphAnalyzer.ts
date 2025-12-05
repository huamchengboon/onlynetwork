/**
 * GraphAnalyzer - Uses graphlib for topology analysis
 * Provides path finding, reachability checks, and cycle detection
 * This makes simulation faster by pre-validating topologies
 */

import { Graph } from 'graphlib';
import type { SimTopology, SimNode, SimLink } from './types';

export class GraphAnalyzer {
    private graph: Graph;
    private topology: SimTopology;

    constructor(topology: SimTopology) {
        this.topology = topology;
        this.graph = new Graph({ directed: false });
        this.buildGraph();
    }

    /**
     * Build graphlib graph from topology
     */
    private buildGraph(): void {
        // Add all nodes
        for (const node of this.topology.nodes) {
            this.graph.setNode(node.id, node);
        }

        // Add all edges (links are bidirectional)
        for (const link of this.topology.links) {
            this.graph.setEdge(link.sourceNodeId, link.targetNodeId, link);
        }
    }

    /**
     * Check if two nodes are reachable
     * Much faster than running full simulation
     */
    isReachable(sourceId: string, targetId: string): boolean {
        try {
            const path = this.graph.path(sourceId, targetId);
            return path !== null && path.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Get shortest path between two nodes
     * Returns array of node IDs
     */
    getShortestPath(sourceId: string, targetId: string): string[] | null {
        try {
            const path = this.graph.path(sourceId, targetId);
            return path || null;
        } catch {
            return null;
        }
    }

    /**
     * Check if topology has cycles (loops)
     * Useful for detecting potential routing loops
     */
    hasCycles(): boolean {
        // For undirected graphs, any cycle means multiple paths exist
        // We check if removing any edge still leaves nodes connected
        const edges = this.graph.edges();
        
        for (const edge of edges) {
            const testGraph = new Graph({ directed: false });
            
            // Rebuild graph without this edge
            for (const node of this.topology.nodes) {
                testGraph.setNode(node.id, node);
            }
            for (const link of this.topology.links) {
                if (!(link.sourceNodeId === edge.v && link.targetNodeId === edge.w) &&
                    !(link.sourceNodeId === edge.w && link.targetNodeId === edge.v)) {
                    testGraph.setEdge(link.sourceNodeId, link.targetNodeId, link);
                }
            }
            
            // If graph is still connected, we have a cycle
            const nodes = testGraph.nodes();
            if (nodes.length > 0) {
                const reachable = new Set<string>();
                const queue = [nodes[0]];
                reachable.add(nodes[0]);
                
                while (queue.length > 0) {
                    const current = queue.shift()!;
                    const neighbors = testGraph.neighbors(current) || [];
                    for (const neighbor of neighbors) {
                        if (!reachable.has(neighbor)) {
                            reachable.add(neighbor);
                            queue.push(neighbor);
                        }
                    }
                }
                
                if (reachable.size === nodes.length) {
                    return true; // Cycle exists
                }
            }
        }
        
        return false;
    }

    /**
     * Get all neighbors of a node
     */
    getNeighbors(nodeId: string): string[] {
        return this.graph.neighbors(nodeId) || [];
    }

    /**
     * Check if two nodes are directly connected
     */
    areDirectlyConnected(nodeId1: string, nodeId2: string): boolean {
        return this.graph.hasEdge(nodeId1, nodeId2) || this.graph.hasEdge(nodeId2, nodeId1);
    }

    /**
     * Get all nodes in a component (connected subgraph)
     */
    getConnectedComponent(nodeId: string): string[] {
        const visited = new Set<string>();
        const queue = [nodeId];
        visited.add(nodeId);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const neighbors = this.graph.neighbors(current) || [];
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return Array.from(visited);
    }

    /**
     * Validate topology before simulation
     * Returns array of validation errors
     */
    validateTopology(): string[] {
        const errors: string[] = [];

        // Check for isolated nodes
        for (const node of this.topology.nodes) {
            const neighbors = this.getNeighbors(node.id);
            if (neighbors.length === 0) {
                errors.push(`Node ${node.id} (${node.label}) is isolated (no connections)`);
            }
        }

        // Check for unreachable pairs (if multiple components)
        const components: string[][] = [];
        const processed = new Set<string>();

        for (const node of this.topology.nodes) {
            if (!processed.has(node.id)) {
                const component = this.getConnectedComponent(node.id);
                components.push(component);
                component.forEach(id => processed.add(id));
            }
        }

        if (components.length > 1) {
            errors.push(`Topology has ${components.length} disconnected components`);
        }

        return errors;
    }
}
