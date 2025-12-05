import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { NetworkCanvas } from './components/NetworkCanvas';
import { NodePalette } from './components/NodePalette';
import { Toolbar } from './components/Toolbar';
import { ConfigPanel } from './components/ConfigPanel';
import { CommandPalette } from './components/CommandPalette';
import { useTopologyStore } from './store/useTopologyStore';
import { convertTopology, Simulator } from './simulator/Simulator';
import './App.css'

function App() {
  const { nodes, edges, topologyVersion, setAnimatedEdges, startAnimation } = useTopologyStore();
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-run simulation when topology changes
  useEffect(() => {
    // Debounce: clear any pending simulation
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }

    // Wait a bit for topology to stabilize
    simulationTimeoutRef.current = setTimeout(() => {
      const hosts = nodes.filter(n => n.type === 'blueprint' && n.data.type === 'host');
      
      if (hosts.length < 2 || edges.length === 0) {
        // No valid topology, clear animation
        setAnimatedEdges(new Set());
        return;
      }

      const topology = convertTopology(nodes, edges);
      const simulator = new Simulator(topology);
      const allValidEdges = new Set<string>();

      // Test connectivity between ALL host pairs
      for (const host1 of hosts) {
        for (const host2 of hosts) {
          if (host1.id === host2.id) continue;
          
          const srcIp = host1.data.config.interfaces[0]?.ip?.split('/')[0] || '10.0.0.1';
          const dstIp = host2.data.config.interfaces[0]?.ip?.split('/')[0] || '10.0.0.2';

          // Run simulation for this pair
          const result = simulator.simulate({
            srcNodeId: host1.id,
            dstNodeId: host2.id,
            srcIp,
            dstIp,
            proto: 'icmp',
            ttl: 64,
            payload: 'ping',
          });

          // If simulation succeeded and packet was delivered, collect edges from trace
          if (result.success && result.delivered && result.trace) {
            // Extract edges from this trace
            for (let i = 0; i < result.trace.length - 1; i++) {
              const sourceId = result.trace[i].nodeId;
              const targetId = result.trace[i+1].nodeId;
              
              const edge = edges.find(e => 
                (e.source === sourceId && e.target === targetId) ||
                (e.source === targetId && e.target === sourceId)
              );
              
              if (edge) {
                allValidEdges.add(edge.id);
              }
            }
          }
        }
      }

      // Animate all valid edges
      if (allValidEdges.size > 0) {
        setAnimatedEdges(allValidEdges);
        startAnimation();
      } else {
        setAnimatedEdges(new Set());
      }
    }, 300); // 300ms debounce

    return () => {
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }
    };
  }, [topologyVersion, nodes, edges, setAnimatedEdges, startAnimation]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-full w-full" style={{ backgroundColor: 'var(--c-canvas)' }}>
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <div className="flex flex-col flex-1">
            <NetworkCanvas />
          </div>
          <ConfigPanel />
        </div>
        <CommandPalette />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
