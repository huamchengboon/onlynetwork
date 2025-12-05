import { describe, it, expect, beforeEach } from 'vitest';
import { useTopologyStore } from './useTopologyStore';

describe('useTopologyStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTopologyStore.setState({ nodes: [], edges: [] });
  });

  it('should initialize with empty nodes and edges', () => {
    const { nodes, edges } = useTopologyStore.getState();
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('should add a node', () => {
    const { addNode } = useTopologyStore.getState();
    addNode('host', { x: 100, y: 100 });
    
    const { nodes } = useTopologyStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].data.type).toBe('host');
    expect(nodes[0].position).toEqual({ x: 100, y: 100 });
  });

  it('should clear topology', () => {
    const { addNode, clearTopology } = useTopologyStore.getState();
    addNode('host', { x: 100, y: 100 });
    addNode('switch', { x: 200, y: 200 });
    
    clearTopology();
    
    const { nodes, edges } = useTopologyStore.getState();
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('should set topology', () => {
    const { setTopology } = useTopologyStore.getState();
    const mockNodes = [
      { id: '1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'Host 1', type: 'host' as const } }
    ];
    const mockEdges = [
      { id: 'e1-2', source: '1', target: '2' }
    ];
    
    setTopology(mockNodes, mockEdges);
    
    const { nodes, edges } = useTopologyStore.getState();
    expect(nodes).toEqual(mockNodes);
    expect(edges).toEqual(mockEdges);
  });
});
