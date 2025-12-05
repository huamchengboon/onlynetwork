// Hook to manage the simulation worker

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SimTopology, PacketSpec, SimulationResult } from '../simulator/types';
import type { WorkerMessage, WorkerResponse } from '../simulator/worker';

export function useSimulator() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(
            new URL('../simulator/worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Message handler
        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { type } = e.data;

            if (type === 'SIMULATION_COMPLETE') {
                setResult(e.data.result);
                setIsRunning(false);
            } else if (type === 'ERROR') {
                setError(e.data.error);
                setIsRunning(false);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const runSimulation = useCallback((topology: SimTopology, packet: PacketSpec) => {
        if (!workerRef.current) return;

        setIsRunning(true);
        setResult(null);
        setError(null);

        const message: WorkerMessage = {
            type: 'SIMULATE',
            topology,
            packet,
        };

        workerRef.current.postMessage(message);
    }, []);

    return {
        runSimulation,
        isRunning,
        result,
        error,
    };
}
