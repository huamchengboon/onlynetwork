// WebWorker wrapper for the simulator

import { Simulator } from './Simulator';
import type { SimTopology, PacketSpec, SimulationResult } from './types';

// Message types
export type WorkerMessage = 
    | { type: 'SIMULATE'; topology: SimTopology; packet: PacketSpec }
    | { type: 'TERMINATE' };

export type WorkerResponse = 
    | { type: 'SIMULATION_COMPLETE'; result: SimulationResult }
    | { type: 'ERROR'; error: string };

// Listen for messages from the main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type } = e.data;

    if (type === 'SIMULATE') {
        try {
            const { topology, packet } = e.data;
            const simulator = new Simulator(topology);
            const result = simulator.simulate(packet);
            
            const response: WorkerResponse = {
                type: 'SIMULATION_COMPLETE',
                result,
            };
            self.postMessage(response);
        } catch (error) {
            const response: WorkerResponse = {
                type: 'ERROR',
                error: error instanceof Error ? error.message : 'Unknown simulation error',
            };
            self.postMessage(response);
        }
    }
};
